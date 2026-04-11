import { createBrowserClient } from '@supabase/ssr'

// 缓存 Supabase 客户端实例，避免每次调用 createClient 都创建新实例
let cachedClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (cachedClient) {
    return cachedClient
  }

  cachedClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return cachedClient
}
