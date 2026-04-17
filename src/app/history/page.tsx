import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HistoryClient from './HistoryClient'

export default async function HistoryPage() {
  // Đọc session từ server — cookie đã sẵn sàng, không bị race condition
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    redirect('/login?redirect=history')
  }

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      food:foods(name, price, image_url, slug)
    `)
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  const orderIds = (orders ?? []).map((order) => order.id)
  const { data: reviews } = orderIds.length > 0
    ? await supabase
        .from('food_reviews')
        .select('id, order_id, food_id, rating, comment, admin_reply, admin_replied_at, created_at')
        .in('order_id', orderIds)
    : { data: [] }

  return (
    <HistoryClient
      userId={session.user.id}
      initialOrders={(orders ?? []) as any}
      initialReviews={(reviews ?? []) as any}
    />
  )
}
