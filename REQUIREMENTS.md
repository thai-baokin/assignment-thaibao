# 📋 Assignment 1 – Task & Team Management App
> **Chủ đề:** Project Setup, Prisma & Deployment  
> **Mục tiêu:** Xây dựng nền tảng kỹ thuật cho ứng dụng quản lý công việc và nhóm (Task & Team Management), kết nối database Supabase qua Prisma, làm tính năng CRUD Task công khai và deploy lên Vercel.

---

## 🛠️ 1. Tech Stack
- **Framework:** Next.js 16 (App Router, TypeScript)
- **Styling:** Tailwind CSS v4 + Lucide Icons
- **Database:** PostgreSQL (Supabase Free Tier)
- **ORM:** Prisma v6.4.1
- **Version Control:** Git & GitHub (Public Repo)
- **Hosting / Deployment:** Vercel

---

## 📌 2. Bảng Đối Soát Yêu Cầu (Checklist)

### 1. Khởi tạo dự án (Project Initialization)
- [x] Khởi tạo Next.js với App Router và TypeScript.
- [x] Cấu trúc thư mục chuẩn:
  - `app/` (các trang & API Route Handlers)
  - `components/` (các thành phần UI tái sử dụng: Navbar, Footer, TaskCard, TaskForm, TaskEditModal, TaskFilter)
  - `lib/` (Prisma client singleton `lib/prisma.ts`, `lib/types.ts`)
  - `prisma/` (`schema.prisma`, `migrations/`, `seed.ts`)
- [x] Cài đặt & cấu hình ESLint và Prettier (`.prettierrc`, `.prettierignore`, script `lint` và `format`).
- [x] Tạo file `.env.example` chứa danh sách các biến môi trường cần thiết (không chứa secret thật).

### 2. Quản lý mã nguồn (Git & GitHub)
- [x] Khởi tạo Git repo (`git init`).
- [x] Cấu hình `.gitignore` chuẩn (loại trừ `node_modules`, `.env*`, ngoại trừ `!.env.example`, `.next`, v.v.).
- [x] Commit khởi tạo ban đầu với commit message rõ ràng (`chore: initial project setup...`).
- [x] Đạt tối thiểu **5 commits** có ý nghĩa rõ ràng trong suốt quá trình làm bài:
  - *Hiện có **8 commits** chuẩn Git convention:*
    1. `dcbca6b` - chore: initial project setup with Next.js, TypeScript, Tailwind CSS and Prettier
    2. `e65f89a` - feat(db): configure Prisma schema with User, Team, TeamMember and Task models
    3. `0b3fd8b` - feat(api): implement task CRUD route handlers with Prisma
    4. `122d9cb` - feat(ui): create responsive layout, Navbar, Footer and Teams preview page
    5. `600cd2b` - feat(tasks): build homepage with Task CRUD form, cards, modal editor and filters
    6. `078c50f` - docs: add comprehensive README with ERD diagram, requirements, and CI pipeline
    7. `1bdebb3` - feat(db): add initial migration sql for supabase
    8. `b63cfd0` - feat(db): add database seed script with sample tasks and user
- [x] Đẩy code lên GitHub repository: [https://github.com/thai-baokin/assignment-thaibao](https://github.com/thai-baokin/assignment-thaibao).

### 3. Database & Cấu hình Prisma (Supabase)
- [x] Tạo project PostgreSQL miễn phí trên **Supabase** (`jlamzcmlnibagxpqnoiu`).
- [x] Cài đặt & khởi tạo Prisma (`prisma` và `@prisma/client` v6.4.1).
- [x] Cấu hình `DATABASE_URL` (port 6543) và `DIRECT_URL` (port 5432) kết nối Supabase trong `.env`.
- [x] Định nghĩa đầy đủ các model trong `prisma/schema.prisma`:
  - **User:** `id`, `name`, `email`, `password`, `createdAt`, `updatedAt`, quan hệ với Team, TeamMember, Task
  - **Team:** `id`, `name`, `description`, `ownerId`, `createdAt`, `updatedAt`, quan hệ với User, TeamMember, Task
  - **TeamMember:** `id`, `teamId`, `userId`, `role`, `joinedAt` (bảng liên kết User & Team kèm unique `[teamId, userId]`)
  - **Task:** `id`, `title`, `description`, `status`, `priority`, `dueDate`, `teamId` (optional), `assigneeId` (optional), `createdAt`, `updatedAt`
- [x] Chạy migration lần đầu: `npx prisma migrate dev --name init` (Migration `20260927130458_init` đã áp dụng lên Supabase).
- [x] Thêm dữ liệu mẫu: Đã chạy `prisma/seed.ts` tạo 1 User và 3 Task mẫu (`TODO`, `IN_PROGRESS`, `DONE`) vào database.

### 4. Giao diện & Layout (Homepage)
- [x] Layout dùng chung (Header + Footer) trên mọi trang (`app/layout.tsx`).
- [x] Thanh điều hướng (Navbar) với các liên kết:
  - `Home` (`/`)
  - `Teams` (`/teams` - trang placeholder "Coming Soon" cho Assignment 2)
  - `Login` (placeholder kèm thông báo popover)
- [x] Trang chủ (`/`):
  - Phần giới thiệu ngắn về ứng dụng (Tên app, mô tả, thẻ badge Assignment 1, thống kê nhanh).
  - Khu vực hiển thị và quản lý danh sách Task.
- [x] Giao diện Responsive (hiển thị mượt mà trên cả Mobile và Desktop).

### 5. Quản lý Task CRUD (Không cần xác thực)
- [x] **API Route Handlers (Next.js):**
  - `GET /api/tasks`: Lấy toàn bộ danh sách tasks từ database (sắp xếp theo `createdAt: desc`).
  - `POST /api/tasks`: Tạo task mới (validate dữ liệu đầu vào).
  - `PUT /api/tasks/[id]`: Cập nhật task theo ID (title, description, status, priority, dueDate).
  - `DELETE /api/tasks/[id]`: Xóa task theo ID.
- [x] **Giao diện Client (Homepage):**
  - Form tạo task mới (bắt buộc nhập Title, cho phép nhập Description, Status, Priority, Due Date).
  - Bảng/danh sách hiển thị tất cả tasks lấy trực tiếp từ database Supabase.
  - Nút **Sửa (Edit)** cho từng task (mở modal chỉnh sửa dữ liệu).
  - Nút **Xóa (Delete)** cho từng task (kèm confirm trước khi xóa).
  - Tự động cập nhật lại danh sách trên UI sau khi Thêm/Sửa/Xóa (không cần reload cả trang web).

---

## 🌟 3. Tính Năng Điểm Cộng (Bonus Features)
- [x] **Client-side validation:** Kiểm tra dữ liệu nhập (báo lỗi màu đỏ nếu để trống Title).
- [x] **Filter trạng thái:** Bộ lọc theo Status (`All`, `To Do`, `In Progress`, `Done`) hiển thị số lượng theo thời gian thực.
- [x] **Tìm kiếm thời gian thực:** Thanh tìm kiếm task theo tiêu đề và mô tả.
- [x] **CI Pipeline:** File `.github/workflows/ci.yml` tự động chạy `lint` và `build` khi có commit mới.
- [x] **ERD Diagram:** Sơ đồ quan hệ thực thể (Mermaid Diagram) chi tiết trong file `README.md`.
- [x] **UI trau chuốt:** Thiết kế hiện đại, typography Inter, gradient, badge trạng thái và độ ưu tiên rõ ràng.

---

## 🚀 4. Triển Khai (Deployment)
- [ ] Deploy dự án lên nền tảng **Vercel** *(Bước thao tác của bạn)*.
- [ ] Thêm các biến môi trường (`DATABASE_URL`, `DIRECT_URL`) vào phần Environment Variables trên Vercel.
- [ ] Kiểm tra đảm bảo trang web chạy ổn định trên link Vercel live.

---

## 📄 5. Sản Phẩm Nộp Bài (Deliverables)
Tạo file tài liệu nộp bài định dạng Word (`<MSSV>_Ass1.docx` hoặc `<MSSV>_Ass1.doc`):
1. **Link GitHub Repository:** Chế độ Public, có đầy đủ source code và lịch sử commit (hiện có 8 commits).
2. **Link website live trên Vercel:** Truy cập được trực tiếp, không yêu cầu đăng nhập.
3. **Mô tả & Hình ảnh minh chứng:**
   - Ảnh chụp trích xuất `schema.prisma`.
   - Ảnh chụp giao diện các bảng dữ liệu đã được tạo thành công trên **Supabase Table Editor** (hoặc Prisma Studio).
