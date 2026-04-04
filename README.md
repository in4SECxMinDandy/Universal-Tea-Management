# UniTEA - Ứng dụng Quản lý Cửa hàng F&B

UniTEA là một ứng dụng web hiện đại dành cho cửa hàng thực phẩm và đồ uống (F&B), được xây dựng bằng [Next.js](https://nextjs.org/) App Router, [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/) để thiết kế giao diện, và [Supabase](https://supabase.com/) cho backend mở rộng và xác thực người dùng.

## 🚀 Tính năng nổi bật

- **Giao diện hiện đại (Modern UI)**: Được thiết kế với Tailwind CSS, biểu tượng `lucide-react`, và `clsx`/`tailwind-merge` cho các class động, mang lại trải nghiệm người dùng mượt mà và đẹp mắt.
- **Backend mạnh mẽ (Robust Backend)**: Tích hợp với Supabase (`@supabase/supabase-js`, `@supabase/ssr`) để quản lý cơ sở dữ liệu, xác thực, và Server-Side Rendering (SSR).
- **Hỗ trợ quét mã QR (QR Code Support)**: Tích hợp khả năng tạo mã QR nhanh chóng cho từng bàn (`qrcode.react`), giúp khách hàng dễ dàng truy cập và tương tác.
- **Chat trực tuyến cho Khách hàng & Quản trị viên (Realtime Chat)**:
  - Khách hàng có thể quét mã QR tại bàn để chat trực tiếp với cửa hàng **mà không cần đăng nhập** (sử dụng tính năng Anonymous Sign-in của Supabase).
  - Nhân viên/Quản lý sử dụng trang Admin để phản hồi khách hàng theo thời gian thực (Supabase Realtime).
  - Hỗ trợ gửi hình ảnh trong chat được tải lên an toàn qua Supabase Storage.
  - Lưu trữ phiên trò chuyện liền mạch, khách hàng không bị mất tin nhắn ngay cả khi tải lại trang (lưu giữ session).
- **Bảo mật chặt chẽ (RLS - Row Level Security)**: Cơ sở dữ liệu và lưu trữ (Storage) được cấu hình bảo mật hoàn toàn với các chính sách RLS, đảm bảo khách hàng ẩn danh và quản lý có quyền hạn chính xác.
- **An toàn kiểu dữ liệu (Type Safety)**: Được xây dựng hoàn toàn bằng TypeScript.
- **Hiệu suất cao (Performance)**: Tận dụng các tính năng mới nhất của Next.js 15, React 19 và tiến trình build được tối ưu hóa.

## 🛠️ Công nghệ sử dụng

- **Framework**: [Next.js](https://nextjs.org) (v15+)
- **Thư viện UI**: [React](https://react.dev) (v19)
- **Styling**: [Tailwind CSS](https://tailwindcss.com) (v3) + PostCSS + Autoprefixer
- **Icons**: [Lucide React](https://lucide.dev/)
- **Cơ sở dữ liệu & Xác thực**: [Supabase](https://supabase.com) (PostgreSQL, Auth, Storage, Realtime)
- **Ngôn ngữ**: [TypeScript](https://www.typescriptlang.org/)

## 📂 Cấu trúc dự án

- `src/app`: Chứa các trang và layout theo kiến trúc App Router của Next.js.
  - `/admin`: Trang quản trị (Dashboard, Quản lý Chat, Thực đơn).
  - `/chat`: Giao diện chat cho khách hàng quét mã QR.
- `src/components`: Các component React UI có thể tái sử dụng.
- `src/lib`: Hàm tiện ích, Supabase clients (cho cả client và server), và helper.
- `src/middleware.ts`: Middleware của Next.js để xử lý xác thực và bảo vệ các routes yêu cầu đăng nhập.
- `supabase`: Các tệp cấu hình Supabase, migrations SQL (thiết lập schema, RLS, Storage, Realtime).

## 💻 Hướng dẫn chạy dự án (Getting Started)

### Yêu cầu hệ thống

- Node.js (phiên bản v18 trở lên)
- npm, yarn, hoặc pnpm
- Một dự án trên [Supabase](https://supabase.com/)

### Cài đặt

1. **Clone dự án:**
   ```bash
   git clone https://github.com/in4SECxMinDandy/UniTEA.git
   cd UniTEA
   ```

2. **Cài đặt các gói phụ thuộc:**
   ```bash
   npm install
   ```

3. **Cấu hình biến môi trường:**
   Tạo một tệp `.env.local` ở thư mục gốc dựa trên `.env.example` và điền credentials Supabase của bạn:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
   *Lưu ý: Để tính năng chat bằng QR hoạt động, cần bật "Anonymous Sign-ins" trong bảng phân quyền (Authentication > Providers) trên Supabase Dashboard.*

4. **Chạy server phát triển:**
   ```bash
   npm run dev
   ```

5. Mở [http://localhost:3000](http://localhost:3000) trên trình duyệt để sử dụng ứng dụng.
   - Truy cập `/admin` để vào trang tạo mã QR và quản lý chat (cần đăng nhập tài khoản ADMIN).

## 📜 Các lệnh kịch bản (Scripts)

- `npm run dev`: Chạy ứng dụng ở chế độ phát triển (development).
- `npm run build`: Build ứng dụng để chuẩn bị triển khai lên môi trường production.
- `npm run start`: Khởi chạy ứng dụng với bản build đã tạo (production).
- `npm run lint`: Chạy ESLint để kiểm tra chất lượng code.

## 📝 Giấy phép (License)

Dự án này là mã nguồn đóng và được sử dụng cho mục đích nội bộ.
