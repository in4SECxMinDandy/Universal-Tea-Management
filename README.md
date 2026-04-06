# Universal-Tea-Management

![UniTEA Logo](https://cmstest.lottemallwestlakehanoi.vn/storage/tenants/195/727909eb2bc36eb272c37e21458677a184601520.png)

## UniTEA - Nền tảng Nâng Tầm Trải Nghiệm Khách Hàng F&B

Giải pháp tối ưu hóa thao tác gọi món, phản hồi và chăm sóc khách hàng dựa trên QR Code, dành riêng cho các mô hình cà phê, trà sữa, và nhà hàng cỡ vừa và nhỏ.

## 🎯 Tầm nhìn dự án

UniTEA được thiết kế để giải quyết bài toán giao tiếp giữa khách hàng và nhân viên trong một cửa hàng F&B có diện tích hoặc số luợng bàn lớn. Bằng cách sử dụng mã QR duy nhất cho từng bàn, khách hàng có thể quét để trực tiếp nhắn tin (gọi thêm món, lấy thêm giấy, v.v.) tới nhân viên quản lý mà không cần phải gọi to hay chờ đợi.

Sự khác biệt của UniTEA là **chú trọng vào trải nghiệm không rào cản**: Khách hàng không cần tải App, không cần đăng ký tài khoản. Chỉ cần quẹt QR là có thể chat ngay lập tức với cửa hàng theo thời gian thực (Realtime).

---

## ✨ Chức năng Cốt lõi & Luồng Người dùng

### 1. Dành cho Khách hàng (Trải nghiệm Không ma sát)

- **Truy cập ẩn danh**: Nhờ tính năng Supabase Anonymous Sign-in, khách hàng quét QR và có ngay một phiên (session) định danh dưới nền hệ thống mà không cần điền bất kỳ thông tin nào.
- **Chat Realtime**: Nhắn tin với nhân viên và thấy phản hồi ngay lập tức, không cần làm mới trang.
- **Đình kèm hình ảnh**: Cho phép gửi hình ảnh minh họa (ví dụ: ly nước bị thiếu topping) kích thước lên tới 5MB, xử lý qua Supabase Storage tiên tiến.
- **Lưu trữ phiên (Session Persistence)**: Giữ thông tin cuộc trò chuyện ngay cả khi vô tình tắt trình duyệt hay reload trang nhờ cơ chế lưu ID trong `sessionStorage`.
- **Bảo vệ mã QR**: QR code có giới hạn thời gian (mặc định 3 tiếng) nhằm tránh việc mã bị lan truyền ra ngoài ngoài khung giờ khách đang ngồi tại quán.

### 2. Dành cho Nhân viên / Quản lý (Trang Admin Dashboard)

- **Tạo mã QR tự động**: Quản lý có thể sinh ra mã QR cho từng phiên khách (Ví dụ: "Bàn 15", "Tầng 2 - Góc cửa sổ").
- **Giao diện phân chia theo màn hình Split-pane**: Giúp nhân viên vừa theo dõi chi tiết danh sách bàn đang có yêu cầu (Panel trái) vừa phản hồi chat chi tiết (Panel phải). Có responsive tốt trên thiết bị di động.
- **Cảnh báo phiên chờ (Pulse UI)**: Hiển thị nổi bật số lượng phiên chat đang mở cần xử lý.
- **Chủ động đóng phiên chat**: Nhân viên có thể chốt/đóng kết nối khi đã phục vụ xong, giúp dọn dẹp các yêu cầu cũ khỏi luồng làm việc.

---

## 🏛 Kiến trúc Hệ thống

UniTEA được phát triển dựa trên **Stack Serverless linh hoạt**:

- **Font-end**: [Next.js 15](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [Tailwind CSS 3](https://tailwindcss.com/).
  - Tối ưu hóa UI/UX với `lucide-react` và các tiện ích như `tailwind-merge`/`clsx`.
  - Phân quyền trang thông qua Middleware cấp độ Component (`RoleGate`, `AuthGate`).
- **Back-end Serverless**: [Supabase](https://supabase.com) đảm trách toàn bộ trọng trách backend.
  - **Database (PostgreSQL)**: Xây dựng các Table (Profiles, Chat Sessions, Chat Messages, Foods).
  - **Auth**: Cấu hình xác thực với cả dạng Password (cho quản trị) và Anonymous (cho khách hàng).
  - **Realtime**: Subscription cơ sở dữ liệu `postgres_changes` cho kênh Chat, kết hợp Fallback cơ chế Polling (5s) nếu websocket bị mất kết nối mạng.
  - **Storage**: Tạo Bucket riêng biệt có định tuyến bảo vệ cấp Table thông qua RLS (Row Level Security).
  - **Bảo mật RLS Toàn diện**: Áp dụng chặt chẽ cho từng hàng (Row) dựa vào `auth.uid()` hoặc hàm kiểm tra vai trò `has_role()`.

---

## 📂 Tổ chức Thư mục & Mã nguồn

```text
UniTEA/
├── src/
│   ├── app/                      # Cấu trúc Route theo NextJS App Router
│   │   ├── admin/                # Phân hệ Admin (Mã QR, Chat Panel, Quản lý món ăn)
│   │   ├── chat/                 # Phân hệ Nhắn tin (Chứa ChatContent logic mạnh mẽ)
│   │   ├── login/                # Route đăng nhập
│   │   ├── ...                   # Các Route tĩnh khác (Trang chủ, v.v)
│   ├── components/               # Giao diện đóng gói có thể dùng lại
│   │   ├── admin/                # VD: AdminChatPanel.tsx, FoodFormModal.tsx
│   │   ├── auth/                 # VD: RoleGate (bảo vệ các component chỉ dành cho Admin)
│   │   ...
│   ├── lib/
│   │   └── supabase/             # Logic trích xuất Client Supabase (SSR & Browser)
│   ├── middleware.ts             # Lớp middleware kiểm tra Auth/Cookie NextJS
├── supabase/
│   ├── migrations/               # Các script SQL từ v001 tới v009 quy định Schema và RLS
│   └── config.toml               # Cấu hình Local Supabase CLI
├── tailwind.config.ts            # Hệ thống design tokens và colors
└── ...
```

---

## 🛠 Hướng dẫn Triển khai & Phát triển Local

### 1. Cài đặt ban đầu

Cần chắc chắn bạn đã có sẵn tài khoản **Supabase** và máy tính có cài **Node.js 18+**, **Supabase CLI**.

```bash
# Clone dự án & Cài đặt gói NPM
git clone https://github.com/in4SECxMinDandy/Universal-Tea-Management.git
cd Universal-Tea-Management
npm install
```

### 2. Thiết lập Supabase Project

1. Tạo một project trên Supabase.com
2. Ở phần **Authentication -> Configuration -> Providers**, bạn tìm và **BẬT (Enable) "Anonymous Sign-ins"**. (Tính năng sống còn cho QR Code Chat).
3. Đăng nhập Supabase CLI vào project để đẩy các lược đồ (Schema) lên base mới:

```bash
npx supabase login
npx supabase link --project-ref [YOUR_PROJECT_ID]
npx supabase db push
```

*(Thao tác `db push` sẽ tự khởi tạo Tables, RLS, Storage Buckets, Roles và kích hoạt Realtime cho bạn nhờ thư mục `migrations` có sẵn.)*

### 3. Biến môi trường

Đổi tên tệp `.env.example` thành `.env.local` và cài đặt 2 biến số:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_ANON_KEY_HERE]
```

### 4. Chạy dự án

```bash
npm run dev
```

### 5. Demo

![Demo 1](https://github.com/user-attachments/assets/bf1863b8-332f-43e0-a769-f54d6a12a3f6)
![Demo 2](https://github.com/user-attachments/assets/bf742c56-2e5e-4a3d-8e09-36e552b410e8)
![Demo 3](https://github.com/user-attachments/assets/4abd6127-db38-4276-99b0-456fbd6e6f85)
![Demo 4](https://github.com/user-attachments/assets/c0aeb0cd-3e74-48bf-89dd-3f0ce1c3836a)
![Demo 5](https://github.com/user-attachments/assets/3d6a9390-c55e-4939-ac94-33cc74c4985f)
![Demo 6](https://github.com/user-attachments/assets/016ef7a9-6d0e-43d4-be2d-3bc0073abf3b)

Truy cập hệ thống ở [http://localhost:3000](http://localhost:3000).

*Ghi chú nhỏ: Hãy dùng trình duyệt để Signup một account, sau đó trên Supabase Editor (Web), chèn tay dòng User Profile đó thành Role **`STORE_ADMIN`** thông qua Table `user_roles` để có quyền cao nhất truy cập `/admin`.*

---

## 📝 Giấy phép

Được triển khai độc quyền dưới tư cách dự án nội bộ. Vui lòng liên hệ nhóm phát triển trước khi sao chép và thương mại hoá. Thay đổi và phát triển bởi [in4SECxMinDandy].