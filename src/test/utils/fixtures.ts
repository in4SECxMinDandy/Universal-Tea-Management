import type { AdminChatSession, ChatMessage, Food } from '@/lib/types'

export const mockUser = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  email: 'user@example.com',
  is_anonymous: false,
}

export const mockAdminUser = {
  id: '550e8400-e29b-41d4-a716-446655440002',
  email: 'admin@example.com',
  is_anonymous: false,
}

export const mockFood: Food = {
  id: 'food-1',
  name: 'Tra sua truyen thong',
  slug: 'tra-sua-truyen-thong',
  price: 25000,
  image_url: 'https://example.com/tea.jpg',
  description: 'Tra sua thom ngon',
  is_available: true,
  is_featured: false,
  category_id: 'cat-1',
  stock_quantity: 10,
  category: { name: 'Tra sua' },
}

export const mockChatSession: AdminChatSession = {
  id: '550e8400-e29b-41d4-a716-446655440010',
  user_id: mockUser.id,
  status: 'open',
  opened_at: '2026-04-13T00:00:00Z',
  last_message_at: '2026-04-13T00:00:00Z',
  session_type: 'account',
  guest_name: null,
  user: { full_name: 'Test User' },
  visit: null,
}

export const mockChatMessage: ChatMessage = {
  id: 'msg-1',
  sender_id: mockUser.id,
  sender_role: 'USER',
  content: 'Xin chao',
  image_url: null,
  created_at: '2026-04-13T00:00:00Z',
}

export const mockOrder = {
  id: 'order-1',
  user_id: mockUser.id,
  food_id: mockFood.id,
  quantity: 2,
  total_price: 50000,
  status: 'pending',
  created_at: '2026-04-13T00:00:00Z',
}
