📋 Assignment 1 – Task & Team Management App

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

- [X] Khởi tạo Next.js với App Router và TypeScript.
- [X] Cấu trúc thư mục chuẩn:
  - `app/` (các trang & API Route Handlers)
  - `components/` (các thành phần UI tái sử dụng: Navbar, Footer, TaskCard, TaskForm, TaskEditModal, TaskFilter)
  - `lib/` (Prisma client singleton `lib/prisma.ts`, `lib/types.ts`)
  - `prisma/` (`schema.prisma`, `migrations/`, `seed.ts`)
- [X] Cài đặt & cấu hình ESLint và Prettier (`.prettierrc`, `.prettierignore`, script `lint` và `format`).
- [X] Tạo file `.env.example` chứa danh sách các biến môi trường cần thiết (không chứa secret thật).

### 2. Quản lý mã nguồn (Git & GitHub)

- [X] Khởi tạo Git repo (`git init`).
- [X] Cấu hình `.gitignore` chuẩn (loại trừ `node_modules`, `.env*`, ngoại trừ `!.env.example`, `.next`, v.v.).
- [X] Commit khởi tạo ban đầu với commit message rõ ràng (`chore: initial project setup...`).
- [X] Đạt tối thiểu **5 commits** có ý nghĩa rõ ràng trong suốt quá trình làm bài:
  - *Hiện có **8 commits** chuẩn Git convention:*
    1. `dcbca6b` - chore: initial project setup with Next.js, TypeScript, Tailwind CSS and Prettier
    2. `e65f89a` - feat(db): configure Prisma schema with User, Team, TeamMember and Task models
    3. `0b3fd8b` - feat(api): implement task CRUD route handlers with Prisma
    4. `122d9cb` - feat(ui): create responsive layout, Navbar, Footer and Teams preview page
    5. `600cd2b` - feat(tasks): build homepage with Task CRUD form, cards, modal editor and filters
    6. `078c50f` - docs: add comprehensive README with ERD diagram, requirements, and CI pipeline
    7. `1bdebb3` - feat(db): add initial migration sql for supabase
    8. `b63cfd0` - feat(db): add database seed script with sample tasks and user
- [X] Đẩy code lên GitHub repository: [https://github.com/thai-baokin/assignment-thaibao](https://github.com/thai-baokin/assignment-thaibao).

### 3. Database & Cấu hình Prisma (Supabase)

- [X] Tạo project PostgreSQL miễn phí trên **Supabase** (`jlamzcmlnibagxpqnoiu`).
- [X] Cài đặt & khởi tạo Prisma (`prisma` và `@prisma/client` v6.4.1).
- [X] Cấu hình `DATABASE_URL` (port 6543) và `DIRECT_URL` (port 5432) kết nối Supabase trong `.env`.
- [X] Định nghĩa đầy đủ các model trong `prisma/schema.prisma`:
  - **User:** `id`, `name`, `email`, `password`, `createdAt`, `updatedAt`, quan hệ với Team, TeamMember, Task
  - **Team:** `id`, `name`, `description`, `ownerId`, `createdAt`, `updatedAt`, quan hệ với User, TeamMember, Task
  - **TeamMember:** `id`, `teamId`, `userId`, `role`, `joinedAt` (bảng liên kết User & Team kèm unique `[teamId, userId]`)
  - **Task:** `id`, `title`, `description`, `status`, `priority`, `dueDate`, `teamId` (optional), `assigneeId` (optional), `createdAt`, `updatedAt`
- [X] Chạy migration lần đầu: `npx prisma migrate dev --name init` (Migration `20260927130458_init` đã áp dụng lên Supabase).
- [X] Thêm dữ liệu mẫu: Đã chạy `prisma/seed.ts` tạo 1 User và 3 Task mẫu (`TODO`, `IN_PROGRESS`, `DONE`) vào database.

### 4. Giao diện & Layout (Homepage)

- [X] Layout dùng chung (Header + Footer) trên mọi trang (`app/layout.tsx`).
- [X] Thanh điều hướng (Navbar) với các liên kết:
  - `Home` (`/`)
  - `Teams` (`/teams` - trang placeholder "Coming Soon" cho Assignment 2)
  - `Login` (placeholder kèm thông báo popover)
- [X] Trang chủ (`/`):
  - Phần giới thiệu ngắn về ứng dụng (Tên app, mô tả, thẻ badge Assignment 1, thống kê nhanh).
  - Khu vực hiển thị và quản lý danh sách Task.
- [X] Giao diện Responsive (hiển thị mượt mà trên cả Mobile và Desktop).

### 5. Quản lý Task CRUD (Không cần xác thực)

- [X] **API Route Handlers (Next.js):**
  - `GET /api/tasks`: Lấy toàn bộ danh sách tasks từ database (sắp xếp theo `createdAt: desc`).
  - `POST /api/tasks`: Tạo task mới (validate dữ liệu đầu vào).
  - `PUT /api/tasks/[id]`: Cập nhật task theo ID (title, description, status, priority, dueDate).
  - `DELETE /api/tasks/[id]`: Xóa task theo ID.
- [X] **Giao diện Client (Homepage):**
  - Form tạo task mới (bắt buộc nhập Title, cho phép nhập Description, Status, Priority, Due Date).
  - Bảng/danh sách hiển thị tất cả tasks lấy trực tiếp từ database Supabase.
  - Nút **Sửa (Edit)** cho từng task (mở modal chỉnh sửa dữ liệu).
  - Nút **Xóa (Delete)** cho từng task (kèm confirm trước khi xóa).
  - Tự động cập nhật lại danh sách trên UI sau khi Thêm/Sửa/Xóa (không cần reload cả trang web).

---

## 🌟 3. Tính Năng Điểm Cộng (Bonus Features)

- [X] **Client-side validation:** Kiểm tra dữ liệu nhập (báo lỗi màu đỏ nếu để trống Title).
- [X] **Filter trạng thái:** Bộ lọc theo Status (`All`, `To Do`, `In Progress`, `Done`) hiển thị số lượng theo thời gian thực.
- [X] **Tìm kiếm thời gian thực:** Thanh tìm kiếm task theo tiêu đề và mô tả.
- [X] **CI Pipeline:** File `.github/workflows/ci.yml` tự động chạy `lint` và `build` khi có commit mới.
- [X] **ERD Diagram:** Sơ đồ quan hệ thực thể (Mermaid Diagram) chi tiết trong file `README.md`.
- [X] **UI trau chuốt:** Thiết kế hiện đại, typography Inter, gradient, badge trạng thái và độ ưu tiên rõ ràng.

---

## 🚀 4. Triển Khai (Deployment)

- [X] Deploy dự án lên nền tảng **Vercel** *(Bước thao tác của bạn)*.
- [X] Thêm các biến môi trường (`DATABASE_URL`, `DIRECT_URL`) vào phần Environment Variables trên Vercel.
- [X] Kiểm tra đảm bảo trang web chạy ổn định trên link Vercel live.

---

## 📄 5. Sản Phẩm Nộp Bài (Deliverables - Assignment 1)

1. **Link GitHub Repository:** Chế độ Public, có đầy đủ source code và lịch sử commit: [https://github.com/thai-baokin/assignment-thaibao](https://github.com/thai-baokin/assignment-thaibao).
2. **Link website live trên Vercel:** Truy cập được trực tiếp, không yêu cầu đăng nhập: [https://assignment-thaibao.vercel.app](https://assignment-thaibao.vercel.app).
3. **Mô tả & Hình ảnh minh chứng:**
   - Ảnh chụp trích xuất `schema.prisma`.
   - Ảnh chụp giao diện các bảng dữ liệu đã được tạo thành công trên **Supabase Table Editor** (hoặc Prisma Studio).

---

# 🚀 Assignment 2 – Task & Team Management App: CRUD API with Authentication

> **Mục tiêu:** Kế thừa từ Assignment 1 (cùng repository GitHub & dự án Vercel). Xây dựng ứng dụng hoàn chỉnh cho phép người dùng đăng ký, đăng nhập (JWT & HTTP-Only cookies), tạo và chuyển đổi nhiều nhóm làm việc, mời thành viên qua email, phân quyền vai trò (Owner vs Member, quyền xóa task theo RBAC), phát triển đầy đủ 13+ RESTful CRUD Route Handlers và giao diện bảng Kanban tương tác.

---

## 🛠️ 1. Tech Stack (Assignment 2)

- **Frontend & API:** Next.js 16 (App Router, Route Handlers, TypeScript)
- **Styling:** Tailwind CSS v4 + Lucide Icons
- **Database:** PostgreSQL (Supabase Free Tier)
- **ORM:** Prisma v6.4.1
- **Auth & Security:** JWT qua thư viện `jose`, lưu trữ trong HttpOnly Cookie (`taskpulse_token`), mật khẩu mã hóa với `bcryptjs`
- **Route Protection:** Next.js Edge Middleware (`middleware.ts`)
- **Hosting / Deployment:** Vercel

---

## 📌 2. Bảng Đối Soát Yêu Cầu Assignment 2 (Checklist)

### 1. Kế thừa & Cấu trúc dự án

- [X] Tiếp tục phát triển trên cùng GitHub repository và Vercel project của Assignment 1 (không tạo project mới từ đầu).
- [X] Giữ nguyên tính tương thích với trang chủ (`/`) và các model dữ liệu đã tạo ở Assignment 1.

### 2. Xác thực người dùng (Authentication)

- [X] **Đăng ký tài khoản (`/register`):** Hỗ trợ nhập Họ tên, Email, Mật khẩu (validate >= 6 ký tự, email hợp lệ).
- [X] **Đăng nhập (`/login`):** Xác thực mật khẩu đã hash với `bcryptjs`, cấp JWT token và lưu vào HttpOnly cookie an toàn.
- [X] **Đăng xuất (`POST /api/auth/logout`):** Nút đăng xuất tại Navbar và Dropdown profile, tự động dọn dẹp cookie phiên.
- [X] **Bảo vệ Route (Middleware):** Khách chưa đăng nhập chỉ được xem trang chủ (`/`), trang đăng nhập (`/login`) và đăng ký (`/register`). Mọi trang nhóm (`/teams/*`) đều yêu cầu đăng nhập.
- [X] **Tài khoản kiểm thử cho người chấm:**
  - `admin@taskpulse.io` / `password123` (Owner)
  - `member@taskpulse.io` / `password123` (Member)
  - Có nút **"Điền nhanh"** 1 chạm trên trang Login.

### 3. Quản lý Nhóm (Team Model & Management)

- [X] Model `Team` đầy đủ các trường: `name` (bắt buộc), `description` (tùy chọn), quan hệ `owner` (`ownerId`), quan hệ `members` (`TeamMember[]`), `tasks` (`Task[]`).
- [X] Khi tạo nhóm mới (`POST /api/teams`), người tạo tự động trở thành **Owner** của nhóm.
- [X] Owner có quyền mời thành viên vào nhóm bằng email (`POST /api/teams/:id/members`).
- [X] Owner có quyền xóa thành viên khỏi nhóm; thành viên thường có thể tự chọn "Rời nhóm" (`DELETE /api/teams/:id/members/:userId`).
- [X] Mỗi thành viên có vai trò rõ ràng: `OWNER` hoặc `MEMBER`.
- [X] Một người dùng có thể tham gia nhiều nhóm khác nhau và chuyển đổi dễ dàng trên trang Dashboard nhóm (`/teams`).

### 4. Quản lý Công việc trong Nhóm (Task Model & Management)

- [X] Model `Task` đầy đủ các trường: `title`, `description`, `status` (`TODO`, `IN_PROGRESS`, `DONE`), `priority` (`LOW`, `MEDIUM`, `HIGH`), `dueDate`, `teamId`, `creatorId`, `assigneeId`.
- [X] Bất kỳ thành viên nào trong nhóm cũng có quyền tạo task mới trong nhóm đó (`POST /api/teams/:id/tasks`).
- [X] Task có thể được phân công cho một thành viên cụ thể trong nhóm (assignee).
- [X] Thành viên nhóm có quyền cập nhật chi tiết task, trạng thái và độ ưu tiên (`PUT /api/tasks/:id`).
- [X] **Phân quyền xóa task (RBAC):** Chỉ người tạo task (Creator), người được phân công (Assignee), hoặc Trưởng nhóm (Owner) mới có quyền xóa task (`DELETE /api/tasks/:id`).

### 5. Danh sách 13 API Endpoints (CRUD)

- [X] `POST /api/auth/register` – Đăng ký người dùng mới
- [X] `POST /api/auth/login` – Đăng nhập và nhận session/token
- [X] `GET /api/teams` – Lấy danh sách nhóm người dùng hiện tại tham gia
- [X] `POST /api/teams` – Tạo nhóm mới
- [X] `GET /api/teams/:id` – Lấy thông tin chi tiết nhóm (bao gồm thành viên & công việc)
- [X] `PUT /api/teams/:id` – Cập nhật thông tin nhóm (Chỉ Owner)
- [X] `DELETE /api/teams/:id` – Xóa nhóm (Chỉ Owner)
- [X] `POST /api/teams/:id/members` – Thêm thành viên vào nhóm bằng email (Chỉ Owner)
- [X] `DELETE /api/teams/:id/members/:userId` – Xóa thành viên khỏi nhóm (Owner hoặc thành viên tự rời)
- [X] `GET /api/teams/:id/tasks` – Lấy danh sách công việc của nhóm
- [X] `POST /api/teams/:id/tasks` – Tạo công việc mới trong nhóm (Thành viên nhóm)
- [X] `PUT /api/tasks/:id` – Cập nhật thông tin công việc
- [X] `DELETE /api/tasks/:id` – Xóa công việc (Chỉ Creator, Assignee hoặc Owner)
- [X] *Bổ sung:* `POST /api/auth/logout` – Đăng xuất và xóa cookie
- [X] *Bổ sung:* `GET /api/auth/me` – Lấy thông tin phiên đăng nhập hiện tại

### 6. Giao diện người dùng (UI)

- [X] Form Đăng ký, Form Đăng nhập và nút Đăng xuất.
- [X] Trang Dashboard liệt kê tất cả nhóm mà người dùng tham gia (`/teams`).
- [X] Modal "Tạo Nhóm Mới" và Tab quản lý thành viên nhóm.
- [X] Trang chi tiết nhóm hiển thị danh sách task linh hoạt (chuyển đổi giữa **Bảng Kanban** và **Table View**).
- [X] Modal tạo và cập nhật công việc (tiêu đề, mô tả, trạng thái, độ ưu tiên, người làm, hạn chót).
- [X] Hiển thị trực quan trạng thái và độ ưu tiên với huy hiệu màu (Colored Badges).
- [X] Thanh Navigation menu phản ánh trạng thái người dùng đăng nhập và số lượng nhóm.

### 7. Tính năng điểm cộng (Bonus Features)

- [X] **Bảng Kanban tương tác:** Hiển thị 3 cột công việc (To Do, In Progress, Done) với các nút chuyển nhanh trạng thái 1-chạm (`← To Do`, `In Progress`, `Done ✓`).
- [X] **Bộ lọc & Tìm kiếm đa tiêu chí:** Tìm kiếm từ khóa theo thời gian thực kết hợp lọc theo Status, Priority và Assignee ("Công việc của tôi", "Chưa phân công", hoặc từng thành viên cụ thể).
- [X] **Mời thành viên theo email:** Modal mời thành viên trực tiếp theo email đã đăng ký.

---

## 📌 3. Bảng Đối Soát Yêu Cầu Assignment 3 & 4 (Checklist Hoàn Thành)

### 1. Trò chuyện nhóm thời gian thực (Real-time Team Chat)
- [X] Mỗi nhóm có riêng một phòng chat (`Phòng trò chuyện nhóm`).
- [X] Thành viên trong nhóm có thể gửi và xem tin nhắn văn bản tức thì.
- [X] Tin nhắn được lưu trữ đầy đủ trong CSDL thông qua model `Message` (`senderId`, `content`, `teamId`, `createdAt`).
- [X] Tin nhắn mới xuất hiện theo thời gian thực (không cần reload/F5) cho mọi thành viên đang online thông qua **Supabase Realtime Broadcast**.
- [X] Giao diện Chat Panel hiện đại tích hợp ngay trong trang chi tiết nhóm:
  - Lịch sử tin nhắn cuộn tự động (auto-scroll to bottom).
  - Bong bóng tin nhắn phân biệt của "Tôi" (căn phải) và các thành viên khác (căn trái kèm Avatar và thời gian).
  - Ô nhập liệu tin nhắn hỗ trợ gõ nhanh bằng phím Enter.
- [X] **Tính năng điểm cộng (Bonus Features):**
  - **Typing Indicator:** Hiển thị thời gian thực `● ● ● [Tên] đang soạn tin nhắn...` khi có thành viên đang gõ.
  - **Online Presence:** Hiển thị số lượng và danh sách thành viên đang online trong phòng chat.

### 2. Cập nhật Bảng công việc thời gian thực (Real-time Task Board Updates)
- [X] Khi một thành viên tạo công việc mới (`POST /api/teams/:id/tasks`), task mới xuất hiện ngay trên bảng Kanban của các thành viên khác.
- [X] Khi một thành viên chuyển trạng thái (Cần làm -> Đang làm -> Hoàn thành) hoặc chỉnh sửa task, sự thay đổi được phản ánh tức thì trên màn hình của tất cả thành viên khác.
- [X] Khi xóa công việc, thẻ công việc lập tức biến mất trên mọi màn hình mà không cần refresh trang.
- [X] Cơ chế Realtime đồng bộ trên kênh `team-room-${teamId}` của Supabase Realtime Channel.

### 3. Hệ thống Thông báo (In-App Notifications)
- [X] Người dùng nhận được thông báo in-app khi được phân công công việc mới (`ASSIGNED_TASK`).
- [X] Người dùng nhận được thông báo in-app khi được thêm vào nhóm mới (`ADDED_TO_TEAM`).
- [X] Thông báo được lưu trữ bền vững trong database (`Notification` model: `userId`, `type`, `title`, `message`, `relatedId`, `read`, `createdAt`).
- [X] **Notification Bell trên Navbar:**
  - Biểu tượng chiếc chuông thanh lịch kèm badge đỏ báo số lượng thông báo chưa đọc.
  - Dropdown menu danh sách thông báo gần đây với icon phân loại trực quan và thời gian tương đối.
  - Nút "Đã đọc tất cả" và click vào từng thông báo để đánh dấu đã đọc (`PUT /api/notifications/:id`).
  - Tự động chuyển hướng đến nhóm hoặc công việc liên quan khi bấm vào thông báo.
  - Thông báo xuất hiện theo thời gian thực (Realtime notification channel `notifications:user-${userId}`) kèm hiệu ứng âm thanh nhẹ Web Audio API.

### 4. Hệ thống Phân quyền nâng cao (Advanced Role & Permission System - 3 Roles)
- [X] Hệ thống phân quyền 3 cấp độ:
  - 👑 **Owner (Trưởng nhóm):** Toàn quyền kiểm soát — quản lý thành viên, thay đổi vai trò (thăng Admin/hạ Member), xóa nhóm, xóa bất kỳ task nào.
  - 🛡️ **Admin (Quản trị viên):** Quản lý thành viên (mời thành viên, xóa thành viên thường), quản lý tất cả task (tạo, sửa, xóa bất kỳ task nào trong nhóm), nhưng **không được xóa nhóm**.
  - 👤 **Member (Thành viên):** Tạo và quản lý công việc do mình tạo hoặc được phân công cho mình; xem mọi thông tin khác trong nhóm.
- [X] **Bảo vệ chặt chẽ ở cả Server-side (API Checks) và Client-side (UI):**
  - `DELETE /api/teams/:id`: Chỉ duy nhất Owner mới có quyền xóa nhóm (Admin/Member bị chặn 403).
  - `PUT /api/teams/:id`: Chỉ Owner và Admin mới có quyền sửa thông tin nhóm.
  - `POST /api/teams/:id/members`: Cả Owner và Admin đều được mời thành viên; chỉ Owner mới được chỉ định vai trò Admin khi mời.
  - `PATCH /api/teams/:id/members/:userId`: Chỉ duy nhất Owner mới có quyền thay đổi vai trò thành viên (Admin <-> Member).
  - `DELETE /api/teams/:id/members/:userId`: Owner xóa được bất kỳ ai trừ chính mình; Admin chỉ xóa được Member thường; Member chỉ có quyền tự rời nhóm.
  - `DELETE /api/tasks/:id`: Owner và Admin xóa được bất kỳ task nào; Member chỉ xóa được task do mình tạo hoặc được phân công.
  - `PUT /api/tasks/:id`: Owner và Admin sửa được mọi task; Member chỉ sửa được task do mình phụ trách/tạo ra.
- [X] **Giao diện Quản lý Thành viên (Member Management Screen):**
  - Hiển thị vai trò của từng thành viên với huy hiệu và icon phân biệt rõ ràng (👑 Trưởng nhóm, 🛡️ Quản trị viên, 👤 Thành viên).
  - Hiển thị nút đổi vai trò `Thăng Admin / Hạ thành viên` độc quyền cho Trưởng nhóm.
  - Ẩn/hiện các nút thao tác xóa theo đúng ma trận quyền hạn.

### 5. Danh sách 18 API Endpoints
- [X] `POST /api/auth/register` – Đăng ký tài khoản
- [X] `POST /api/auth/login` – Đăng nhập
- [X] `POST /api/auth/logout` – Đăng xuất
- [X] `GET /api/auth/me` – Phiên đăng nhập
- [X] `GET /api/teams` – Danh sách nhóm
- [X] `POST /api/teams` – Tạo nhóm
- [X] `GET /api/teams/:id` – Chi tiết nhóm
- [X] `PUT /api/teams/:id` – Cập nhật nhóm (Owner, Admin)
- [X] `DELETE /api/teams/:id` – Xóa nhóm (Chỉ Owner)
- [X] `POST /api/teams/:id/members` – Mời thành viên (Owner, Admin)
- [X] `PATCH /api/teams/:id/members/:userId` – Đổi vai trò thành viên (Chỉ Owner)
- [X] `DELETE /api/teams/:id/members/:userId` – Xóa thành viên / Rời nhóm (RBAC)
- [X] `GET /api/teams/:id/tasks` – Danh sách task nhóm
- [X] `POST /api/teams/:id/tasks` – Tạo task nhóm
- [X] `PUT /api/tasks/:id` – Sửa task (RBAC)
- [X] `DELETE /api/tasks/:id` – Xóa task (RBAC)
- [X] `GET /api/teams/:id/messages` – Lấy lịch sử chat nhóm
- [X] `POST /api/teams/:id/messages` – Gửi tin nhắn nhóm (Realtime)
- [X] `GET /api/notifications` – Danh sách thông báo in-app
- [X] `PUT /api/notifications` – Đánh dấu tất cả thông báo đã đọc
- [X] `PUT /api/notifications/:id` – Đánh dấu một thông báo đã đọc

---

## 📄 4. Submission Information (Dành cho nộp bài Assignment 3 & 4)

```text
Student Name: Nguyễn Thái Bảo
Student ID: QE190108
GitHub Repository URL: https://github.com/thai-baokin/assignment-thaibao
Deployed Website URL: https://assignment-thaibao.vercel.app
Test Account 1 (Owner): admin@taskpulse.io / password123

Test Account 2 (Member): bao@taskpulse.io / password123
Additional Notes: Assignment 3 & 4 extends Assignment 2 on the same codebase. Key additions include:
1. Real-time Team Chat with persisted message history, typing indicators, and online presence via Supabase Realtime Broadcast.
2. Live-updating Kanban task board across multiple users without page refresh.
3. In-app notifications with Navbar bell dropdown, unread counter, audio chime, and event triggers for task assignment and team invitations.
4. Advanced 3-tier Role-Based Access Control (Owner, Admin, Member) enforced strictly on both Next.js Route Handlers and UI components.
```

