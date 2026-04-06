-- ============================================================
-- Enable Realtime for orders table so postgres_changes works
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
