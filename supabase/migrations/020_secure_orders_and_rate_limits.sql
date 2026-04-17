-- ============================================================
-- Secure order creation and distributed rate limiting
-- ============================================================

-- Block direct client inserts into orders; creation must go through
-- the secured RPC below so price and stock are validated server-side.
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;

-- Create orders through a guarded transactional function.
CREATE OR REPLACE FUNCTION public.create_order_secure(
  _food_id uuid,
  _quantity integer,
  _note text DEFAULT NULL
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_food public.foods%ROWTYPE;
  v_order public.orders%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF _quantity IS NULL OR _quantity <= 0 OR _quantity > 99 THEN
    RAISE EXCEPTION 'Invalid quantity';
  END IF;

  IF public.has_role(auth.uid(), 'STORE_ADMIN') THEN
    RAISE EXCEPTION 'Admins cannot place orders';
  END IF;

  SELECT *
  INTO v_food
  FROM public.foods
  WHERE id = _food_id
    AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Food not found';
  END IF;

  IF v_food.is_available IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Food unavailable';
  END IF;

  IF v_food.stock_quantity < _quantity THEN
    RAISE EXCEPTION 'Insufficient stock';
  END IF;

  UPDATE public.foods
  SET stock_quantity = stock_quantity - _quantity
  WHERE id = _food_id
    AND stock_quantity >= _quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock';
  END IF;

  INSERT INTO public.orders (
    user_id,
    food_id,
    quantity,
    note,
    total_price,
    status,
    stock_deducted
  )
  VALUES (
    auth.uid(),
    _food_id,
    _quantity,
    NULLIF(btrim(_note), ''),
    (_quantity * v_food.price)::bigint,
    'pending',
    true
  )
  RETURNING *
  INTO v_order;

  RETURN v_order;
END;
$$;

REVOKE ALL ON FUNCTION public.create_order_secure(uuid, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order_secure(uuid, integer, text) TO authenticated;

-- Rewrite stock trigger to prevent silent overselling and to keep
-- cancellation / re-open behavior coherent with stock_deducted.
CREATE OR REPLACE FUNCTION public.handle_order_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.stock_deducted := COALESCE(NEW.stock_deducted, false);

  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' AND OLD.stock_deducted = true THEN
      UPDATE public.foods
      SET stock_quantity = stock_quantity + OLD.quantity
      WHERE id = OLD.food_id;

      NEW.stock_deducted := false;
    END IF;

    IF OLD.status = 'cancelled' AND NEW.status != 'cancelled' AND NEW.stock_deducted = false THEN
      UPDATE public.foods
      SET stock_quantity = stock_quantity - NEW.quantity
      WHERE id = NEW.food_id
        AND stock_quantity >= NEW.quantity;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient stock';
      END IF;

      NEW.stock_deducted := true;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_order_stock ON public.orders;
CREATE TRIGGER tr_order_stock
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.handle_order_stock();

-- Shared rate limit store for multi-instance environments.
CREATE TABLE IF NOT EXISTS public.rate_limit_counters (
  key text PRIMARY KEY,
  count integer NOT NULL,
  window_started_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_counters_expires_at
  ON public.rate_limit_counters(expires_at);

CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  p_key text,
  p_window_ms integer,
  p_max_requests integer
)
RETURNS TABLE (
  success boolean,
  remaining integer,
  max_limit integer,
  reset_time bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_expires_at timestamptz := v_now + (p_window_ms::text || ' milliseconds')::interval;
  v_record public.rate_limit_counters%ROWTYPE;
BEGIN
  DELETE FROM public.rate_limit_counters
  WHERE expires_at <= v_now;

  LOOP
    SELECT *
    INTO v_record
    FROM public.rate_limit_counters
    WHERE key = p_key
    FOR UPDATE;

    IF NOT FOUND THEN
      BEGIN
        INSERT INTO public.rate_limit_counters (key, count, window_started_at, expires_at)
        VALUES (p_key, 1, v_now, v_expires_at);

        success := true;
        remaining := GREATEST(p_max_requests - 1, 0);
        max_limit := p_max_requests;
        reset_time := FLOOR(EXTRACT(EPOCH FROM v_expires_at) * 1000)::bigint;
        RETURN NEXT;
        RETURN;
      EXCEPTION
        WHEN unique_violation THEN
          -- Retry after a concurrent insert.
      END;
    ELSE
      IF v_record.expires_at <= v_now THEN
        UPDATE public.rate_limit_counters
        SET count = 1,
            window_started_at = v_now,
            expires_at = v_expires_at
        WHERE key = p_key;

        success := true;
        remaining := GREATEST(p_max_requests - 1, 0);
        max_limit := p_max_requests;
        reset_time := FLOOR(EXTRACT(EPOCH FROM v_expires_at) * 1000)::bigint;
        RETURN NEXT;
        RETURN;
      ELSIF v_record.count >= p_max_requests THEN
        success := false;
        remaining := 0;
        max_limit := p_max_requests;
        reset_time := FLOOR(EXTRACT(EPOCH FROM v_record.expires_at) * 1000)::bigint;
        RETURN NEXT;
        RETURN;
      ELSE
        UPDATE public.rate_limit_counters
        SET count = v_record.count + 1
        WHERE key = p_key;

        success := true;
        remaining := GREATEST(p_max_requests - (v_record.count + 1), 0);
        max_limit := p_max_requests;
        reset_time := FLOOR(EXTRACT(EPOCH FROM v_record.expires_at) * 1000)::bigint;
        RETURN NEXT;
        RETURN;
      END IF;
    END IF;
  END LOOP;
END;
$$;

REVOKE ALL ON TABLE public.rate_limit_counters FROM PUBLIC;
REVOKE ALL ON FUNCTION public.consume_rate_limit(text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(text, integer, integer) TO anon, authenticated;
