import { createBrowserClient } from '@supabase/ssr'

// Khai báo một biến toàn cục ở phạm vi module để lưu trữ instance
let supabaseBrowserClient: ReturnType<typeof createBrowserClient> | undefined

export function createClient() {
  if (typeof window === 'undefined') {
    // Nếu chạy trên server, luôn tạo instance mới (không lưu cache toàn cục server)
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  // Nếu đã khởi tạo trên client, dùng lại instance đó để tránh xung đột IndexedDB Lock
  if (supabaseBrowserClient) {
    return supabaseBrowserClient
  }

  supabaseBrowserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return supabaseBrowserClient
}
