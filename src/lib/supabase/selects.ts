export const FOOD_CATEGORY_SELECT_FIELDS = 'id, name, slug, sort_order, is_active, created_at'

export const FOOD_RELATION_SELECT =
  'category:food_categories(id, name, slug, is_active, sort_order)'

export const FOOD_SELECT_FIELDS = `id, name, slug, price, image_url, description, is_available, is_featured, category_id, stock_quantity, sort_order, created_at, updated_at, ${FOOD_RELATION_SELECT}`

export const CHAT_MESSAGE_SELECT_FIELDS = 'id, sender_id, sender_role, content, image_url, created_at'

export const CHAT_SESSION_BASIC_SELECT_FIELDS = 'id, user_id, status, session_type, guest_name'

export const CHAT_SESSION_SELECT_FIELDS =
  'id, user_id, status, opened_at, last_message_at, guest_name, session_type, user:profiles(full_name), visit:visit_sessions(table_label)'

export const VISIT_SESSION_SELECT_FIELDS =
  'id, visit_token, table_label, is_active, expires_at, started_at, admin:profiles!visit_sessions_user_id_fkey(full_name)'

export const ADMIN_REVENUE_ORDER_SELECT_FIELDS =
  'id, food_id, quantity, total_price, status, created_at, profiles!orders_user_id_profiles_fkey(full_name), food:foods(id, name, slug)'

export const FOOD_REVIEW_SELECT_FIELDS =
  'id, order_id, food_id, user_id, reviewer_name, rating, comment, admin_reply, admin_replied_at, created_at, updated_at'

export const ADMIN_FOOD_REVIEW_SELECT_FIELDS =
  `${FOOD_REVIEW_SELECT_FIELDS}, food:foods(id, name, slug, image_url)`
