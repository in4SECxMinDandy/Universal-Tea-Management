# UniTEA - Trà Sữa Thức Giấc

> Hệ thống quản lý cửa hàng F&B trực tuyến với trải nghiệm đặt hàng realtime, live chat qua QR và quản trị toàn diện.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)
![Supabase](https://img.shields.io/badge/Supabase-BaaS-3ecf8e)

## 📋 Giới thiệu

**UniTEA** là nền tảng quản lý cửa hàng đồ uống và thức ăn trực tuyến, được thiết kế dành cho các quán café, trà sữa và mô hình F&B nói chung. Dự án mang đến:

- **Khách hàng:** Trải nghiệm xem menu, đặt hàng, theo dõi đơn hàng realtime và trò chuyện trực tiếp với nhân viên qua mã QR tại bàn.
- **Quản trị viên:** Bộ công cụ quản lý toàn diện từ thực đơn, danh mục, đơn hàng, kho hàng đến live chat và tạo mã QR bàn.

## ✨ Tính năng

### 🧑‍💻 Khách hàng

| Tính năng | Mô tả |
|---|---|
| **Xem menu** | Duyệt sản phẩm theo danh mục, xem chi tiết hình ảnh, giá cả |
| **Đặt hàng** | Chọn số lượng, ghi chú, đặt hàng trực tiếp từ trang chi tiết |
| **Theo dõi đơn hàng** | Cập nhật trạng thái realtime (Chờ → Xác nhận → Hoàn thành / Hủy) |
| **Live Chat qua QR** | Quét QR tại bàn → trò chuyện ẩn danh với nhân viên, hỗ trợ gửi ảnh |
| **Đăng ký / Đăng nhập** | Email/mật khẩu, hỗ trợ Cloudflare Turnstile CAPTCHA |

### 👨‍💼 Quản trị viên

| Tính năng | Mô tả |
|---|---|
| **Dashboard** | Tổng quan, tạo mã QR bàn, quản lý phiên truy cập |
| **Quản lý thực đơn** | CRUD sản phẩm, upload ảnh, tìm kiếm, lọc, sắp xếp, soft-delete |
| **Quản lý danh mục** | Thêm/sửa danh mục, sắp xếp thứ tự, bật/tắt |
| **Quản lý đơn hàng** | Xem danh sách, lọc trạng thái, xác nhận/từ chối/hoàn thành |
| **Live Chat Panel** | Giao diện 2 panel, quản lý hội thoại realtime, gửi/nhận ảnh |
| **Tự động quản lý kho** | Trigger tự trừ kho khi đặt, hoàn kho khi hủy đơn |
| **Phân quyền RLS** | Row Level Security — khách chỉ thấy dữ liệu của mình, admin truy cập đầy đủ |

## 🛠️ Công nghệ

| Hạng mục | Công nghệ |
|---|---|
| **Frontend Framework** | Next.js 15 (App Router) |
| **UI Library** | React 19 |
| **Ngôn ngữ** | TypeScript |
| **Styling** | Tailwind CSS 3.4 |
| **Icons** | Lucide React |
| **QR Code** | qrcode.react |
| **Backend / BaaS** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth (email/password + anonymous) |
| **Realtime** | Supabase Realtime (WebSockets) |
| **Storage** | Supabase Storage Buckets (food-images, chat-images) |
| **CAPTCHA** | Cloudflare Turnstile (optional) |
| **Utility** | clsx, tailwind-merge, nanoid |

## 📁 Cấu trúc dự án

```
UniTEA/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout (Header + Footer)
│   │   ├── page.tsx                  # Trang chủ (Hero + Featured)
│   │   ├── globals.css               # Global styles
│   │   ├── error.tsx                 # Error boundary
│   │   ├── loading.tsx               # Loading component
│   │   │
│   │   ├── login/page.tsx            # Đăng ký / Đăng nhập khách hàng
│   │   ├── adminlogin/page.tsx       # Đăng nhập quản trị viên
│   │   │
│   │   ├── thuc-pham/                # Menu thực phẩm
│   │   │   ├── page.tsx              # Danh sách + lọc danh mục
│   │   │   └── [slug]/page.tsx       # Chi tiết + form đặt hàng
│   │   │
│   │   ├── history/page.tsx          # Lịch sử đơn hàng (realtime)
│   │   ├── chat/                     # Live Chat khách hàng
│   │   │   ├── page.tsx
│   │   │   └── ChatContent.tsx
│   │   ├── gioi-thieu/page.tsx       # Trang giới thiệu
│   │   │
│   │   ├── admin/                    # Panel quản trị (role-gated)
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              # Dashboard (QR + Sessions)
│   │   │   ├── foods/page.tsx        # CRUD thực đơn
│   │   │   ├── categories/page.tsx   # Quản lý danh mục
│   │   │   ├── orders/page.tsx       # Quản lý đơn hàng
│   │   │   └── chat/page.tsx         # Live Chat Panel
│   │   │
│   │   └── api/debug/log/route.ts    # Debug API
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   ├── food/
│   │   │   ├── FoodCard.tsx
│   │   │   └── OrderForm.tsx
│   │   ├── admin/
│   │   │   ├── FoodFormModal.tsx
│   │   │   └── AdminChatPanel.tsx
│   │   └── auth/
│   │       ├── TurnstileBox.tsx
│   │       └── RoleGate.tsx
│   │
│   └── lib/
│       ├── types.ts                  # TypeScript interfaces
│       ├── utils.ts                  # Utilities (cn, formatPrice, formatTime)
│       └── supabase/
│           ├── client.ts             # Browser Supabase client
│           └── server.ts             # Server-side Supabase client
│
├── supabase/
│   ├── migrations/                   # 17 migrations (001-017)
│   ├── config.toml
│   └── seed.sql                      # Dữ liệu mẫu
│
├── public/                           # Static assets
├── package.json
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── eslint.config.mjs
├── postcss.config.js
├── .env.example                      # Mẫu biến môi trường
└── README.md
```

## 🗄️ Cơ sở dữ liệu

### Bảng dữ liệu

| Bảng | Mô tả |
|---|---|
| `roles` | Định nghĩa vai trò (`STORE_ADMIN`, `USER`) |
| `profiles` | Hồ sơ người dùng, liên kết `auth.users(id)` |
| `user_roles` | Ánh xạ user ↔ role (many-to-many) |
| `food_categories` | Danh mục sản phẩm (tên, slug, ảnh, thứ tự, trạng thái) |
| `foods` | Sản phẩm (tên, slug, mô tả, giá, ảnh, kho, danh mục, soft-delete) |
| `visit_sessions` | Phiên truy cập QR (token, nhãn bàn, thời gian hết hạn, trạng thái) |
| `chat_sessions` | Phiên trò chuyện (liên kết user + visit session, trạng thái) |
| `chat_messages` | Tin nhắn (session_id, người gửi, nội dung, ảnh, đã đọc) |
| `orders` | Đơn hàng (user, sản phẩm, số lượng, ghi chú, tổng tiền, trạng thái) |

### Database Functions & Triggers

| Function / Trigger | Chức năng |
|---|---|
| `has_role(uid, role_name)` | Kiểm tra vai trò người dùng |
| `has_valid_visit_session(uid)` | Kiểm tra phiên QR hợp lệ |
| `handle_new_user()` | Tự tạo profile + gán `USER` role khi đăng ký |
| `update_updated_at()` | Tự cập nhật timestamp khi sửa food/profile |
| `set_deleted_at()` | Soft-delete foods |
| `set_visit_expires_at()` | Tự tính thời gian hết hạn phiên QR |
| `update_chat_session_last_message()` | Cập nhật `last_message_at` khi có tin mới |
| `handle_order_stock()` | **Trigger:** Tự trừ kho khi đặt, hoàn kho khi hủy |

### Storage Buckets

| Bucket | Mô tả | Giới hạn |
|---|---|---|
| `food-images` | Ảnh sản phẩm thực đơn | Public |
| `chat-images` | Ảnh đính kèm tin nhắn chat | 5MB, Public |

### Security

Tất cả bảng đều bật **Row Level Security (RLS)** với policies đảm bảo:
- Người dùng chỉ truy cập dữ liệu của chính mình
- `STORE_ADMIN` có quyền truy cập toàn bộ
- Khách ẩn danh chỉ truy cập chat session tương ứng với QR đã quét

## 🚀 Cài đặt & Chạy dự án

### Yêu cầu

- Node.js 18+
- npm / yarn / pnpm
- Tài khoản Supabase (hoặc Supabase local)

### 1. Clone dự án

```bash
git clone https://github.com/in4SECxMinDandy/UniTEA.git
cd UniTEA
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình môi trường

Tạo file `.env.local` từ `.env.example`:

```bash
cp .env.example .env.local
```

Điền thông tin Supabase:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Cloudflare Turnstile (optional)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-turnstile-site-key
```

> **Lấy thông tin Supabase:** Vào Supabase Dashboard → Project Settings → API

### 4. Chạy migrations

```bash
# Nếu dùng Supabase CLI
npx supabase db push

# Hoặc chạy thủ công qua SQL Editor trong Supabase Dashboard
# Copy nội dung các file trong supabase/migrations/ và chạy theo thứ tự
```

### 5. Khởi chạy development server

```bash
npm run dev
```

Mở trình duyệt, truy cập [http://localhost:3000](http://localhost:3000)

## 🗺️ Sơ đồ routes

| Route | Truy cập | Mô tả |
|---|---|---|
| `/` | Public | Trang chủ — Hero + sản phẩm nổi bật |
| `/gioi-thieu` | Public | Trang giới thiệu cửa hàng |
| `/thuc-pham` | Public | Menu — danh sách + lọc theo danh mục |
| `/thuc-pham/[slug]` | Public | Chi tiết sản phẩm + form đặt hàng |
| `/login` | Public | Đăng ký / Đăng nhập khách hàng |
| `/history` | Authenticated | Lịch sử đơn hàng (realtime) |
| `/chat` | Auth / Anonymous (QR) | Live chat với nhân viên |
| `/adminlogin` | Public | Đăng nhập quản trị viên |
| `/admin` | `STORE_ADMIN` | Dashboard — tạo QR, quản lý phiên |
| `/admin/foods` | `STORE_ADMIN` | CRUD thực đơn |
| `/admin/categories` | `STORE_ADMIN` | Quản lý danh mục |
| `/admin/orders` | `STORE_ADMIN` | Quản lý đơn hàng |
| `/admin/chat` | `STORE_ADMIN` | Live Chat Panel |

## 📦 Scripts

| Command | Mô tả |
|---|---|
| `npm run dev` | Chạy development server (port 3000) |
| `npm run build` | Build production |
| `npm run start` | Chạy production server |
| `npm run lint` | Chạy ESLint kiểm tra code |

## 🔐 Phân quyền

```
┌─────────────────────────────────────────────────┐
│                  STORE_ADMIN                     │
│  ┌───────────────────────────────────────────┐  │
│  │  Dashboard / QR / Sessions                │  │
│  │  CRUD Foods & Categories                  │  │
│  │  Quản lý đơn hàng                         │  │
│  │  Live Chat Panel                          │  │
│  │  Xem toàn bộ dữ liệu                      │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│                     USER                        │
│  ┌───────────────────────────────────────────┐  │
│  │  Xem menu, đặt hàng                       │  │
│  │  Theo dõi đơn hàng của mình               │  │
│  │  Lịch sử đơn hàng                         │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│                ANONYMOUS (QR Guest)              │
│  ┌───────────────────────────────────────────┐  │
│  │  Quét QR → Chat với nhân viên             │  │
│  │  Không cần tài khoản                      │  │
│  │  Phiên bị khóa nếu admin dừng session     │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

## 🔄 Luồng nghiệp vụ

### Đặt hàng & Quản lý kho

```
1. Khách chọn sản phẩm → Đặt hàng (số lượng, ghi chú)
2. Đơn hàng tạo → Trigger tự động trừ kho
3. Trạng thái: pending → confirmed → completed
4. Nếu admin từ chối (cancelled) → Trigger hoàn kho
```

### Live Chat qua QR

```
1. Admin tạo QR code cho bàn → Khách quét
2. Hệ thống tạo anonymous session + chat session
3. Khách nhắn tin (text + ảnh)
4. Admin nhận tin nhắn tại /admin/chat → Phản hồi
5. Admin có thể dừng phiên → Khách không thể nhắn tiếp
```

## 📝 License

Dự án mã nguồn mở, sử dụng cho mục đích học tập và thương mại.

---

<p align="center">
  <em>UniTEA — Kết nối khách hàng & cửa hàng F&B theo cách thông minh hơn.</em>
</p>
