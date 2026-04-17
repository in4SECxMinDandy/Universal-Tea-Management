-- ============================================================
-- Food reviews and admin replies
-- ============================================================

CREATE TABLE IF NOT EXISTS public.food_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  food_id uuid NOT NULL REFERENCES public.foods(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_name text NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  admin_reply text,
  admin_replied_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_replied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_food_reviews_food_id_created_at
  ON public.food_reviews(food_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_food_reviews_user_id
  ON public.food_reviews(user_id);

ALTER TABLE public.food_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "food_reviews_public_read"
  ON public.food_reviews
  FOR SELECT
  USING (true);

CREATE POLICY "food_reviews_insert_own_completed_order"
  ON public.food_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.orders
      WHERE orders.id = order_id
        AND orders.user_id = auth.uid()
        AND orders.food_id = food_id
        AND orders.status = 'completed'
    )
  );

CREATE POLICY "food_reviews_admin_update"
  ON public.food_reviews
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'STORE_ADMIN'))
  WITH CHECK (public.has_role(auth.uid(), 'STORE_ADMIN'));

DROP TRIGGER IF EXISTS update_food_reviews_updated_at ON public.food_reviews;
CREATE TRIGGER update_food_reviews_updated_at
  BEFORE UPDATE ON public.food_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
