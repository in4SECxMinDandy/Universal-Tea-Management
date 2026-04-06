-- ============================================================
-- universaltea Food Store — Initial Schema Migration
-- 7 Core Improvements: soft delete, visit sessions, RLS, triggers
-- ============================================================
-- ============================================================
-- ROLES
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);
INSERT INTO roles (name, description)
VALUES ('STORE_ADMIN', 'Quản trị cửa hàng'),
  ('USER', 'Người dùng đã đăng ký') ON CONFLICT (name) DO NOTHING;
-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  avatar_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
-- ============================================================
-- USER ROLES
-- ============================================================
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
  granted_at timestamptz DEFAULT now(),
  granted_by uuid REFERENCES profiles(id),
  UNIQUE (user_id, role_id)
);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
-- ============================================================
-- FOOD CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS food_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  image_url text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
-- ============================================================
-- FOODS
-- ============================================================
CREATE TABLE IF NOT EXISTS foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES food_categories(id) ON DELETE
  SET NULL,
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    description text,
    price numeric(15, 2) NOT NULL,
    image_url text,
    is_available boolean DEFAULT true,
    is_featured boolean DEFAULT false,
    sort_order integer DEFAULT 0,
    stock_quantity integer DEFAULT 0,
    deleted_at timestamptz,
    created_by uuid REFERENCES profiles(id),
    updated_by uuid REFERENCES profiles(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_foods_category_id ON foods(category_id);
CREATE INDEX idx_foods_is_available ON foods(is_available)
WHERE deleted_at IS NULL;
CREATE INDEX idx_foods_is_featured ON foods(is_featured)
WHERE deleted_at IS NULL;
CREATE INDEX idx_foods_deleted_at ON foods(deleted_at)
WHERE deleted_at IS NOT NULL;
-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
CREATE TRIGGER foods_updated_at BEFORE
UPDATE ON foods FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE
UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
-- Trigger: soft delete
CREATE OR REPLACE FUNCTION set_deleted_at() RETURNS TRIGGER AS $$ BEGIN NEW.deleted_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
CREATE TRIGGER foods_soft_delete BEFORE DELETE ON foods FOR EACH ROW EXECUTE PROCEDURE set_deleted_at();
-- ============================================================
-- VISIT SESSIONS
-- ============================================================
CREATE TYPE chat_status AS ENUM ('open', 'closed');
CREATE TABLE IF NOT EXISTS visit_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  visit_token text UNIQUE NOT NULL,
  table_label text,
  started_at timestamptz DEFAULT now(),
  expires_in_hours integer DEFAULT 3,
  expires_at timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id)
);
CREATE INDEX idx_visit_sessions_user_id ON visit_sessions(user_id);
CREATE INDEX idx_visit_sessions_expires_at ON visit_sessions(expires_at);
CREATE INDEX idx_visit_sessions_token ON visit_sessions(visit_token);
CREATE OR REPLACE FUNCTION set_visit_expires_at() RETURNS TRIGGER AS $$ BEGIN NEW.expires_at = NEW.started_at + (NEW.expires_in_hours || ' hours')::interval;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
CREATE TRIGGER visit_session_auto_expires BEFORE
INSERT ON visit_sessions FOR EACH ROW EXECUTE PROCEDURE set_visit_expires_at();
-- ============================================================
-- CHAT SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  visit_session_id uuid REFERENCES visit_sessions(id) ON DELETE
  SET NULL,
    title text,
    status chat_status DEFAULT 'open',
    opened_at timestamptz DEFAULT now(),
    closed_at timestamptz,
    last_message_at timestamptz DEFAULT now()
);
-- ============================================================
-- CHAT MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES chat_sessions(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES profiles(id),
  sender_role text NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
-- Trigger: update last_message_at on new message
CREATE OR REPLACE FUNCTION update_chat_session_last_message() RETURNS TRIGGER AS $$ BEGIN
UPDATE chat_sessions
SET last_message_at = NEW.created_at
WHERE id = NEW.session_id;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
CREATE TRIGGER chat_messages_new_message
AFTER
INSERT ON chat_messages FOR EACH ROW EXECUTE PROCEDURE update_chat_session_last_message();
-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_role(uid uuid, role_name text) RETURNS boolean AS $$
SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = uid
      AND r.name = role_name
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public;
CREATE OR REPLACE FUNCTION public.has_valid_visit_session(uid uuid) RETURNS boolean AS $$
SELECT EXISTS (
    SELECT 1
    FROM visit_sessions
    WHERE user_id = uid
      AND is_active = true
      AND expires_at > now()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public;
-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO public.profiles (id, full_name)
VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
INSERT INTO public.user_roles (user_id, role_id)
SELECT NEW.id,
  id
FROM public.roles
WHERE name = 'USER';
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
-- Profiles: users see their own
CREATE POLICY "profiles_select_own" ON profiles FOR
SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR
UPDATE USING (auth.uid() = id);
-- Food categories: read all, admin write
CREATE POLICY "food_categories_select" ON food_categories FOR
SELECT USING (true);
CREATE POLICY "food_categories_admin_write" ON food_categories FOR ALL USING (has_role(auth.uid(), 'STORE_ADMIN'));
-- Foods: read all (except soft-deleted)
CREATE POLICY "foods_select" ON foods FOR
SELECT USING (deleted_at IS NULL);
CREATE POLICY "foods_admin_all" ON foods FOR ALL USING (has_role(auth.uid(), 'STORE_ADMIN'));
-- Visit sessions
CREATE POLICY "visit_sessions_select" ON visit_sessions FOR
SELECT USING (
    has_role(auth.uid(), 'STORE_ADMIN')
    OR user_id = auth.uid()
  );
CREATE POLICY "visit_sessions_insert_admin" ON visit_sessions FOR
INSERT WITH CHECK (has_role(auth.uid(), 'STORE_ADMIN'));
CREATE POLICY "visit_sessions_update_admin" ON visit_sessions FOR
UPDATE USING (has_role(auth.uid(), 'STORE_ADMIN'));
-- Chat sessions
CREATE POLICY "chat_sessions_select" ON chat_sessions FOR
SELECT USING (
    has_role(auth.uid(), 'STORE_ADMIN')
    OR user_id = auth.uid()
  );
CREATE POLICY "chat_sessions_insert_auth" ON chat_sessions FOR
INSERT WITH CHECK (auth.uid() IS NOT NULL);
-- Chat messages
CREATE POLICY "chat_messages_select" ON chat_messages FOR
SELECT USING (
    has_role(auth.uid(), 'STORE_ADMIN')
    OR session_id IN (
      SELECT id
      FROM chat_sessions
      WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "chat_messages_insert" ON chat_messages FOR
INSERT WITH CHECK (
    sender_id = auth.uid()
    AND (
      has_role(auth.uid(), 'STORE_ADMIN')
      OR has_valid_visit_session(auth.uid())
    )
  );