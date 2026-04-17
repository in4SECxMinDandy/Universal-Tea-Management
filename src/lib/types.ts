export interface Category {
  id: string
  name: string
  slug?: string
  is_active?: boolean
  sort_order?: number
}

export interface FoodCategory {
  id: string
  name: string
  slug?: string
  is_active: boolean
  sort_order: number
  created_at?: string
}

export interface Food {
  id: string
  name: string
  slug: string
  price: number
  image_url: string | null
  description: string | null
  is_available: boolean
  is_featured: boolean
  category_id: string | null
  stock_quantity: number
  category: { name: string } | null
  created_by?: string
  sort_order?: number
  created_at?: string
  updated_at?: string
}

export interface FoodWithCategory extends Food {
  category: { name: string } | null
}

export interface ChatMessage {
  id: string
  sender_id: string
  sender_role: string
  content: string
  image_url: string | null
  created_at: string
}

export interface ChatMessageCursor {
  created_at: string
  id: string
}

export interface ChatSession {
  id: string
  user_id: string
  status: 'open' | 'closed'
  opened_at?: string
  last_message_at?: string
  session_type: 'qr' | 'account'
  guest_name: string | null
}

export interface AdminChatSession extends ChatSession {
  user: { full_name: string | null } | null
  visit: { table_label: string | null } | null
}

export interface FoodReview {
  id: string
  order_id: string
  food_id: string
  user_id: string
  reviewer_name: string
  rating: number
  comment: string | null
  admin_reply: string | null
  admin_replied_at: string | null
  created_at: string
  updated_at?: string
}
