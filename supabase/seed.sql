-- Seed categories
INSERT INTO food_categories (name, slug, sort_order) VALUES
  ('Cơm', 'com', 1),
  ('Phở', 'pho', 2),
  ('Nước uống', 'nuoc-uong', 3),
  ('Tráng miệng', 'trang-mieng', 4)
ON CONFLICT (slug) DO NOTHING;

-- Seed first STORE_ADMIN (manually update email + password in Supabase dashboard)
-- This is a placeholder; real admin created via Supabase Dashboard > Authentication > Users
