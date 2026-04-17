# 🍵 UniTEA — Nền tảng Quản lý Cửa hàng Thực Phẩm & Chat Realtime

![universaltea Logo](https://cmstest.lottemallwestlakehanoi.vn/storage/tenants/195/727909eb2bc36eb272c37e21458677a184601520.png)

## Tổng quan

**UniTEA** là một nền tảng quản lý cửa hàng thực phẩm / trà sữa toàn diện, kết hợp hệ thống **đặt món trực tuyến**, **đánh giá sản phẩm**, **quản lý đơn hàng** và **chat realtime** với khách hàng qua mã QR — tất cả trong một giải pháp serverless mạnh mẽ xây dựng trên Next.js 15 và Supabase.

---

## ✨ Tính năng nổi bật

### 🛒 Dành cho Khách hàng

| Tính năng | Mô tả |
|---|---|
| **Duyệt thực đơn** | Xem sản phẩm theo danh mục, tìm kiếm, sắp xếp theo giá/tên |
| **Đặt món** | Đặt món kèm ghi chú, xác nhận ngay lập tức qua realtime |
| **Lịch sử đơn hàng** | Theo dõi trạng thái đơn (pending → confirmed → completed / cancelled) |
| **Đánh giá sản phẩm** | Đánh giá 1-5 sao kèm bình luận cho đơn đã hoàn thành |
| **Chat realtime** | Nhắn tin với cửa hàng kèm hình ảnh, phản hồi tức thì |
| **Đăng nhập ẩn danh** | Không cần tạo tài khoản — quét QR là chat ngay (Supabase Anonymous Sign-in) |
| **Bảo vệ QR** | Mã QR có giới hạn thời gian (mặc định 3 tiếng) tránh lan truyền ngoài quán |

### 🏪 Dành cho Quản lý / Admin

| Tính năng | Mô tả |
|---|---|
| **Dashboard** | Thống kê tổng quan — doanh thu, đơn hàng, phiên hoạt động |
| **Quản lý món ăn** | CRUD đầy đủ: thêm, sửa, xóa, đánh dấu nổi bật, cập nhật tồn kho |
| **Quản lý danh mục** | Phân loại món ăn theo danh mục (Trà sữa, Bánh ngọt, v.v.) |
| **Quản lý đơn hàng** | Cập nhật trạng thái đơn (pending → confirmed → completed / cancelled) |
| **Quản lý đánh giá** | Xem và phản hồi đánh giá từ khách hàng |
| **Tạo mã QR** | Sinh mã QR cho từng bàn với nhãn tuỳ chỉnh, quản lý phiên hoạt động |
| **Panel chat Split-pane** | Vừa theo dõi danh sách phiên vừa phản hồi chat chi tiết |
| **Bảo mật RLS** | Row Level Security kiểm soát quyền truy cập ở cấp hàng (Row) |

---

## 🏛 Kiến trúc Hệ thống

```
Frontend (Next.js 15, React 19, Tailwind CSS 3)
        │
        ▼
  Supabase Platform (Serverless Backend)
  ┌─────────────────────────────────────────────┐
  │  PostgreSQL    │  Auth      │  Realtime     │
  │  Storage (Images) │  RLS (Row Level Security) │
  └─────────────────────────────────────────────┘
```

### Công nghệ sử dụng

| Lớp | Công nghệ |
|---|---|
| **Frontend Framework** | Next.js 15 (App Router) |
| **UI Library** | React 19, Tailwind CSS 3, Lucide React |
| **Backend** | Supabase (PostgreSQL, Auth, Realtime, Storage) |
| **State / Data Fetching** | TanStack Query v5 |
| **Virtualization** | TanStack Virtual (tối ưu danh sách tin nhắn) |
| **Validation** | Zod |
| **Testing** | Vitest (unit), Playwright (E2E) |
| **QR Code** | qrcode.react |
| **ID Generation** | nanoid |

---

## 📂 Cấu trúc thư mục

```
universal-tea/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── admin/               # Phân hệ Admin
│   │   │   ├── page.tsx         # Dashboard + QR Generator
│   │   │   ├── foods/           # Quản lý món ăn
│   │   │   ├── categories/     # Quản lý danh mục
│   │   │   ├── orders/          # Quản lý đơn hàng
│   │   │   ├── reviews/         # Quản lý đánh giá
│   │   │   ├── revenue/         # Thống kê doanh thu
│   │   │   ├── chat/            # Panel chat realtime
│   │   │   └── layout.tsx       # Layout admin (sidebar)
│   │   ├── home/                # Trang chủ
│   │   ├── thuc-pham/           # Catalog thực phẩm
│   │   │   ├── page.tsx         # Danh sách món theo danh mục
│   │   │   └── [slug]/page.tsx  # Chi tiết sản phẩm
│   │   ├── chat/                # Giao diện chat khách hàng
│   │   ├── history/             # Lịch sử đơn hàng & đánh giá
│   │   ├── login/               # Đăng nhập
│   │   └── api/                 # API routes (reviews, orders, chat...)
│   ├── components/
│   │   ├── admin/               # AdminChatPanel, FoodFormModal...
│   │   ├── auth/                # RoleGate, AuthGate
│   │   ├── chat/                # VirtualMessageList
│   │   ├── food/                # FoodCard, OrderForm
│   │   ├── layout/              # Header, Footer
│   │   └── reviews/            # StarRating
│   ├── hooks/                   # useFoodCatalog, useCategories, useMessages...
│   ├── lib/
│   │   ├── supabase/            # Client & Server Supabase helpers
│   │   │   └── selects.ts       # Shared SELECT field lists
│   │   ├── types.ts             # TypeScript interfaces
│   │   └── utils.ts             # Helper functions
│   ├── middleware.ts            # Next.js middleware (auth guard)
│   └── contexts/               # React contexts
├── supabase/
│   ├── migrations/              # 021 file SQL migration
│   └── config.toml              # Supabase CLI config
├── e2e/                         # Playwright E2E tests
├── docs/                        # Documentation
│   ├── performance-indexes.md
│   └── testing-guide.md
└── tailwind.config.ts
```

---

## 🗄 Database Schema (Supabase PostgreSQL)

| Bảng | Mục đích |
|---|---|
| `profiles` | Hồ sơ người dùng (full_name, avatar_url, role) |
| `user_roles` | Vai trò người dùng (STORE_ADMIN, v.v.) |
| `categories` | Danh mục món ăn |
| `foods` | Thông tin món ăn (tên, giá, mô tả, hình ảnh, tồn kho, nổi bật...) |
| `orders` | Đơn đặt hàng (user_id, food_id, quantity, status, total_price...) |
| `food_reviews` | Đánh giá sản phẩm (rating, comment, admin_reply...) |
| `chat_sessions` | Phiên chat giữa khách và cửa hàng |
| `chat_messages` | Tin nhắn trong chat (text, image_url...) |
| `visit_sessions` | Phiên truy cập QR (visit_token, table_label, expiration...) |

---

## 🚀 Triển khai Local

### Yêu cầu

- Node.js 18+
- Tài khoản **Supabase** (supabase.com)
- **Supabase CLI** (`npm install -g supabase`)

### Các bước

```bash
# 1. Clone dự án
git clone https://github.com/in4SECxMinDandy/Universal-Tea-Management.git
cd Universal-Tea-Management

# 2. Cài đặt dependencies
npm install

# 3. Thiết lập Supabase
npx supabase login
npx supabase link --project-ref [YOUR_PROJECT_ID]

# 4. Push database migrations (tự tạo tables, RLS, storage buckets)
npx supabase db push

# 5. Cấu hình biến môi trường
cp .env.example .env.local
# Điền SUPABASE_URL và SUPABASE_ANON_KEY vào .env.local

# 6. Chạy development server
npm run dev
```

Truy cập [http://localhost:3000](http://localhost:3000).

### Kích hoạt Anonymous Sign-in

Trên **Supabase Dashboard → Authentication → Providers**, bật **Anonymous Sign-ins** — đây là tính năng sống còn cho hệ thống QR Code Chat.

### Tạo tài khoản Admin

1. Đăng ký tài khoản thông thường trên trang `/login`
2. Trên **Supabase Dashboard → Table Editor → `user_roles`**, thêm một dòng gán role `STORE_ADMIN` cho tài khoản đó
3. Đăng nhập lại để truy cập `/admin`

---

## 🧪 Kiểm thử

```bash
# Unit tests (Vitest)
npm run test

# Unit tests với UI
npm run test:ui

# Coverage report
npm run test:coverage

# E2E tests (Playwright)
npm run test:e2e
```

Playwright tests nằm trong thư mục `e2e/` và document trong `docs/testing-guide.md`.

---

## 📊 Các trang chính

| Route | Mô tả |
|---|---|
| `/home` | Trang chủ — sản phẩm nổi bật |
| `/thuc-pham` | Danh sách món ăn theo danh mục |
| `/thuc-pham/[slug]` | Chi tiết sản phẩm + form đặt hàng |
| `/history` | Lịch sử đơn hàng + đánh giá |
| `/chat?visit_token=xxx` | Chat realtime (truy cập qua QR) |
| `/admin` | Dashboard — tạo QR, quản lý phiên |
| `/admin/foods` | CRUD món ăn |
| `/admin/categories` | Quản lý danh mục |
| `/admin/orders` | Quản lý đơn hàng |
| `/admin/reviews` | Phản hồi đánh giá khách |
| `/admin/revenue` | Thống kê doanh thu |
| `/admin/chat` | Panel chat split-pane |

---

## 🎨 Demo Screenshots

![Demo 1](https://github.com/user-attachments/assets/bf1863b8-332f-43e0-a769-f54d6a12a3f6)
![Demo 2](https://github.com/user-attachments/assets/bf742c56-2e5e-4a3d-8e09-36e552b410e8)
![Demo 3](https://github.com/user-attachments/assets/4abd6127-db38-4276-99b0-456fbd6e6f85)
![Demo 4](https://github.com/user-attachments/assets/c0aeb0cd-3e74-48bf-89dd-3f0ce1c3836a)
![Demo 5](https://github.com/user-attachments/assets/3d6a9390-c55e-4939-ac94-33cc74c4985f)
![Demo 6](https://github.com/user-attachments/assets/016ef7a9-6d0e-43d4-be2d-3bc0073abf3b)

---

## 📝 Giấy phép

Dự án được phát triển nội bộ bởi **in4SECxMinDandy**. Vui lòng liên hệ trước khi sao chép hoặc thương mại hoá.