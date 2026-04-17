# UniTEA — ROADMAP Dự Án

> ⚠️ **Lưu ý:** File này cập nhật liên tục trong quá trình phát triển. Mỗi mục có trạng thái rõ ràng: `[x]` = hoàn tất, `[-]` = đang làm, `[ ]` = chưa bắt đầu.

---

## 📋 Tổng Quan

| Thông tin | Chi tiết |
|---|---|
| **Tên dự án** | UniTEA — Nền tảng Quản lý Cửa hàng Thực Phẩm & Chat Realtime |
| **Nền tảng** | Web App (Next.js 15 + Supabase) |
| **Mô hình kinh doanh** | Cửa hàng trà sữa/thực phẩm: đặt món online, chat realtime qua QR Code |
| **Repo** | [github.com/in4SECxMinDandy/Universal-Tea-Management](https://github.com/in4SECxMinDandy/Universal-Tea-Management) |
| **Tech Stack** | Next.js 15 · React 19 · Tailwind CSS 3 · Supabase · TanStack Query v5 · Vitest · Playwright |
| **Trạng thái hiện tại** | ✅ **Core hoàn tất** — Hệ thống hoạt động đầy đủ: catalog, đặt món, đơn hàng, đánh giá, chat QR |

---

## ✅ Phase 0 — Nền tảng & Khởi tạo

> **Trạng thái:** ✅ Hoàn tất

### 0.1 Setup dự án
- [x] Cài đặt Next.js 15 + TypeScript
- [x] Cấu hình Tailwind CSS + design tokens
- [x] Tích hợp Supabase (Auth, Database, Storage, Realtime)
- [x] Cài đặt ESLint + Prettier

### 0.2 Database Schema
- [x] Bảng `profiles` — Hồ sơ người dùng
- [x] Bảng `user_roles` — Phân quyền (STORE_ADMIN)
- [x] Bảng `categories` — Danh mục món ăn
- [x] Bảng `foods` — Sản phẩm (tên, giá, hình ảnh, mô tả, tồn kho, nổi bật...)
- [x] Bảng `orders` — Đơn hàng (user_id, food_id, quantity, status, total_price...)
- [x] Bảng `chat_sessions` + `chat_messages` — Chat realtime
- [x] Bảng `visit_sessions` — Phiên QR code
- [x] Bảng `food_reviews` — Đánh giá sản phẩm
- [x] RLS (Row Level Security) toàn diện
- [x] Trigger tự động giảm tồn kho khi đặt hàng

### 0.3 Authentication
- [x] Đăng ký / Đăng nhập (password auth)
- [x] Anonymous Sign-in (khách quét QR không cần đăng ký)
- [x] Middleware bảo vệ route `/admin`
- [x] RoleGate component phân quyền

### 0.4 Seed Data
- [x] Dữ liệu mẫu danh mục + món ăn

---

## ✅ Phase 1 — Tính năng Cốt lõi (Core)

> **Trạng thái:** ✅ Hoàn tất

### 1.1 Dành cho Khách hàng
- [x] **Duyệt thực đơn** — `/thuc-pham` — lọc theo danh mục
- [x] **Chi tiết sản phẩm** — `/thuc-pham/[slug]` — hình ảnh, mô tả, giá, tồn kho
- [x] **Đặt món** — OrderForm với ghi chú, cập nhật tồn kho realtime
- [x] **Lịch sử đơn hàng** — `/history` — xem trạng thái pending → confirmed → completed/cancelled
- [x] **Đánh giá sản phẩm** — 1-5 sao + bình luận cho đơn đã hoàn thành
- [x] **Phản hồi đánh giá** — Admin trả lời đánh giá khách

### 1.2 Dành cho Admin
- [x] **Dashboard** — `/admin` — tạo QR code, quản lý phiên hoạt động
- [x] **CRUD món ăn** — `/admin/foods` — thêm, sửa, xóa, đánh dấu nổi bật
- [x] **Quản lý danh mục** — `/admin/categories`
- [x] **Quản lý đơn hàng** — `/admin/orders` — cập nhật trạng thái
- [x] **Quản lý đánh giá** — `/admin/reviews` — phản hồi đánh giá
- [x] **Thống kê doanh thu** — `/admin/revenue`
- [x] **Panel chat split-pane** — `/admin/chat` — theo dõi + phản hồi chat

### 1.3 Chat Realtime (QR Code)
- [x] **Tạo mã QR** — Admin sinh QR cho từng bàn với nhãn tuỳ chỉnh
- [x] **Quản lý phiên QR** — kích hoạt/vô hiệu hoá/hết hạn tự động
- [x] **Chat realtime** — `/chat?visit_token=xxx` — gửi tin nhắn + hình ảnh
- [x] **Fallback polling** — 5s polling khi websocket mất kết nối
- [x] **Virtual scroll** — TanStack Virtual tối ưu danh sách tin nhắn dài
- [x] **Anonymous guest identity** — Tự động gán tên khách khi chat

---

## 🔄 Phase 2 — Mở rộng tính năng

> **Trạng thái:** ⏳ Đang phát triển / Chưa bắt đầu

### 2.1 Giỏ hàng (Cart)
- [ ] **Giỏ hàng multi-item** — Thêm nhiều món, cập nhật số lượng
- [ ] **Lưu giỏ hàng** — sessionStorage cho khách chưa đăng nhập
- [ ] **Wishlist** — Lưu sản phẩm yêu thích (với session hoặc tài khoản)

### 2.2 Tìm kiếm & Bộ lọc
- [ ] **Tìm kiếm toàn văn** — Tìm theo tên, mô tả
- [ ] **Bộ lọc nâng cao** — Lọc theo giá, chỉ hiển thị còn hàng
- [ ] **Sắp xếp** — Theo giá tăng/giảm, mới nhất

### 2.3 Quản lý Khách hàng (Admin)
- [ ] **Danh sách khách hàng** — Xem thông tin khách đã đặt hàng
- [ ] **Lịch sử mua hàng** — Xem đơn hàng của từng khách
- [ ] **Phân loại khách hàng** — VIP, thường, mới...

### 2.4 Khuyến mãi & Banner
- [ ] **Mã giảm giá** — Tạo & quản lý coupon (phần trăm hoặc giảm cố định)
- [ ] **Banner trang chủ** — Quản lý banner khuyến mãi
- [ ] **Sản phẩm khuyến mãi** — Badge "Giảm giá", "% off"

### 2.5 Thông báo Email
- [ ] **Email xác nhận đơn hàng** — Gửi tự động khi đặt hàng thành công
- [ ] **Email thông báo trạng thái** — Khi đơn được confirmed / completed

---

## 📊 Phase 3 — Analytics & Tối ưu

> **Trạng thái:** ⏳ Đang phát triển / Chưa bắt đầu

### 3.1 Dashboard Analytics (Admin)
- [x] **Thống kê doanh thu** — Tổng doanh thu, top món bán chạy
- [-] **Biểu đồ doanh thu** — Theo ngày/tuần/tháng (cần thêm thư viện biểu đồ)
- [ ] **Tỷ lệ chuyển đổi** — Lượt xem → Đặt hàng → Hoàn thành

### 3.2 Tối ưu Hiệu suất
- [x] **ISR (Incremental Static Regeneration)** — Trang chủ cache 60s
- [-] **Skeleton loading** — Hiển thị skeleton khi đang tải
- [ ] **Service Worker / PWA** — Offline mode cơ bản
- [ ] **Performance monitoring** — Lighthouse, Core Web Vitals

### 3.3 SEO
- [ ] **SEO On-page** — Meta tags, Open Graph, sitemap.xml, robots.txt
- [ ] **Structured data (JSON-LD)** — Schema.org cho sản phẩm
- [ ] **Social sharing** — Nút chia sẻ sản phẩm

### 3.4 Bảo mật & RLS
- [x] **RLS toàn diện** — Áp dụng cho tất cả bảng
- [x] **Rate limiting** — Giới hạn rate trên API orders
- [x] **Input validation** — Zod schemas
- [ ] **HTTPS** — Đảm bảo SSL (Vercel tự động)

---

## 🎨 Phase 4 — UI/UX Nâng cao & Trải nghiệm

> **Trạng thái:** ⏳ Đang phát triển / Chưa bắt đầu

### 4.1 UI/UX
- [-] **Animation micro-interactions** — Hover effects, page transitions, add-to-cart animation
- [ ] **Dark mode** — Hỗ trợ chế độ tối cho giao diện
- [ ] **Zoom ảnh sản phẩm** — Hover/click để phóng to chi tiết
- [ ] **Lightbox gallery** — Xem ảnh sản phẩm phóng to, slideshow

### 4.2 Thanh toán
- [ ] **VNPay / MoMo / ZaloPay** — Tích hợp thanh toán online
- [ ] **COD mặc định** — Thanh toán khi nhận hàng
- [ ] **Quản lý thanh toán (Admin)** — Trạng thái thanh toán, hoàn tiền

### 4.3 Chat Nâng cao
- [ ] **Template tin nhắn** — Mẫu trả lời nhanh cho nhân viên
- [ ] **Gửi ảnh sản phẩm qua chat** — Nhân viên gửi ảnh cho khách
- [ ] **Zalo OA / Facebook Messenger** — Tích hợp chatbot tự động

---

## 🌏 Phase 5 — Triển khai & Mở rộng

> **Trạng thái:** ⏳ Chưa bắt đầu

### 5.1 Triển khai Production
- [ ] **Hosting Vercel** — Thiết lập production environment
- [ ] **CI/CD** — GitHub Actions auto-deploy khi push lên main
- [ ] **Domain & SSL** — Đăng ký domain, cấu hình SSL
- [ ] **E2E Tests** — Playwright tests cho tất cả luồng chính

### 5.2 Mở rộng
- [ ] **Multi-vendor** — Một admin quản lý nhiều chi nhánh
- [ ] **API Documentation** — Swagger/OpenAPI cho bên thứ ba
- [ ] **i18n (Đa ngôn ngữ)** — Tiếng Việt, Tiếng Anh
- [ ] **Mobile App** — Flutter hoặc React Native (tươ lai)

### 5.3 Vận hành & Bảo trì
- [ ] **Backup database** — Tự động backup Supabase hàng ngày
- [ ] **Sentry / Monitoring** — Tracking lỗi production
- [ ] **Hướng dẫn sử dụng** — Viết documentation cho admin và khách hàng

---

## 🧪 Kiểm thử

- [x] **Unit tests (Vitest)** — `npm run test`
- [x] **E2E tests (Playwright)** — `npm run test:e2e`
- [x] **Coverage report** — `npm run test:coverage`
- [ ] **Snapshot tests** — UI regression tests
- [ ] **API tests** — Kiểm thử API routes

---

## 📌 Chuyển đổi nếu cần (Universal Tea → CeramicShop / khác)

> Dưới đây là mapping nếu dự án được chuyển đổi sang mô hình kinh doanh khác.

| Module hiện tại | Thay thế thành | Ghi chú |
|---|---|---|
| `foods` table | `ceramics` table | Thêm cột material, dimensions, weight |
| `thuc-pham/` | `/shop/` hoặc `/cua-hang/` | Đổi tên route |
| `FoodFormModal` | `CeramicFormModal` | Cập nhật fields phù hợp |
| `admin/foods/` | `admin/ceramics/` | Đổi tên route |
| `OrderForm` | Giữ nguyên logic | Tái sử dụng form đặt hàng |
| QR Code Chat | Giữ nguyên hệ thống | Chỉ thay đổi nội dung mẫu chat |
| Supabase URL/Key | Giữ nguyên | Không cần thay đổi |

---

## ✅ Checklist Tổng kết

- [x] **Phase 0 hoàn tất** — Setup, database, auth, seed data
- [x] **Phase 1 hoàn tất** — Core: catalog, đặt món, đơn hàng, đánh giá, chat QR, admin dashboard
- [ ] **Phase 2 hoàn tất** — Giỏ hàng, wishlist, tìm kiếm, khuyến mãi, email
- [ ] **Phase 3 hoàn tất** — Analytics, SEO, PWA, bảo mật nâng cao
- [ ] **Phase 4 hoàn tất** — UI cao cấp, thanh toán online, chat nâng cao
- [ ] **Phase 5 hoàn tất** — Deploy, monitoring, bảo trì
- [x] **E2E Tests** — Playwright tests cho luồng chính
- [x] **Documentation** — README, ROADMAP, testing guide

---

> 💡 **Tip:** Dự án đã hoàn tất Phase 0 & 1. Tiếp theo nên ưu tiên Phase 2 (giỏ hàng + wishlist) và Phase 3 (SEO + skeleton loading). Mỗi tuần nên review lại và cập nhật trạng thái.