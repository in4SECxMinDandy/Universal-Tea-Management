# Performance Index Checklist

The performance optimization spec relies on these frequently queried fields having database indexes:

- `chat_messages.session_id` for paginated message reads by session.
- `chat_messages.created_at` for cursor-based pagination and newest-first ordering.
- `foods.category_id` for catalog filtering by category.
- `foods.is_available` for public catalog and featured queries.

The current Supabase migrations already define these indexes in `supabase/migrations/001_initial_schema.sql`, so no new migration is required for this checkpoint.
