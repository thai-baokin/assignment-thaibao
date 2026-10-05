# 🚀 TaskPulse - Task & Team Management Application

> **Assignment 2:** Task & Team Management App: CRUD API with Authentication, Role-based Authorization (RBAC), and Kanban Workspace.

---

## 📌 Project Overview
**TaskPulse** is a full-featured Task & Team Management application built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4**, **Prisma ORM**, and **Supabase PostgreSQL**.

Extending from Assignment 1, Assignment 2 adds complete **User Authentication (JWT + HTTP-Only Cookies + Bcrypt)**, **Team Management & Member Invites**, **Role-Based Authorization (Owner vs Member)**, a **Full RESTful CRUD API (14+ endpoints)**, and an interactive **Kanban Board** with task filtering & search.

---

## 🔑 Test Accounts (For Submission Grading)

Pre-seeded accounts are readily available for immediate login and evaluation:

| Email | Password | Role | Team Permissions |
| :--- | :--- | :--- | :--- |
| **`admin@taskpulse.io`** | **`password123`** | **Owner** | Full rights: Edit/Delete team, invite/remove members, create/update/delete tasks |
| **`member@taskpulse.io`** | **`password123`** | **Member** | Create tasks, update status/details, delete only assigned/created tasks, leave team |

> 💡 **Quick Login:** On the `/login` page, you can click the **"Điền nhanh"** button to auto-fill the test account with 1 click.

---

## 🛠️ Tech Stack
- **Framework & Runtime:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack, React 19)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) & [Lucide Icons](https://lucide.dev/)
- **Database:** [PostgreSQL on Supabase](https://supabase.com/) (Connection Pooler + Direct URL)
- **ORM:** [Prisma 6.4](https://www.prisma.io/)
- **Authentication & Security:** JWT session via [`jose`](https://github.com/panva/jose) in HTTP-only cookies, password hashing with [`bcryptjs`](https://github.com/dcodeIO/bcrypt.js)
- **Routing Protection:** Next.js Edge Middleware
- **Deployment:** [Vercel](https://vercel.com/)
- **CI/CD:** GitHub Actions

---

## 📊 Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    User ||--o{ Team : "owns (TeamOwner)"
    User ||--o{ TeamMember : "belongs to (memberships)"
    User ||--o{ Task : "creates (createdTasks)"
    User ||--o{ Task : "assigned to (assignedTasks)"
    
    Team ||--o{ TeamMember : "has members"
    Team ||--o{ Task : "contains tasks"

    User {
        String id PK
        String name
        String email UK
        String password
        DateTime createdAt
        DateTime updatedAt
    }

    Team {
        String id PK
        String name
        String description
        String ownerId FK
        DateTime createdAt
        DateTime updatedAt
    }

    TeamMember {
        String id PK
        String teamId FK
        String userId FK
        String role "OWNER | MEMBER"
        DateTime joinedAt
    }

    Task {
        String id PK
        String title
        String description
        String status "TODO | IN_PROGRESS | DONE"
        String priority "LOW | MEDIUM | HIGH"
        DateTime dueDate
        String teamId FK
        String creatorId FK
        String assigneeId FK
        DateTime createdAt
        DateTime updatedAt
    }
```

---

## 🌐 RESTful API Endpoints

### 1. Authentication Endpoints
- `POST /api/auth/register` – Register a new user (`name`, `email`, `password`)
- `POST /api/auth/login` – Authenticate user and issue secure HTTP-Only cookie token
- `POST /api/auth/logout` – Clear auth session cookie
- `GET /api/auth/me` – Retrieve currently logged-in user profile & memberships

### 2. Team Management Endpoints
- `GET /api/teams` – List all teams the current user belongs to (with member & task counts)
- `POST /api/teams` – Create a new team (creator automatically becomes `OWNER`)
- `GET /api/teams/:id` – Get team details including members and tasks
- `PUT /api/teams/:id` – Update team name & description (**Owner only**)
- `DELETE /api/teams/:id` – Delete team and cascade related records (**Owner only**)

### 3. Team Member Endpoints
- `POST /api/teams/:id/members` – Add an existing user to team by email (**Owner only**)
- `DELETE /api/teams/:id/members/:userId` – Remove a member (**Owner only**) or leave team (Member self-removal)

### 4. Task Management Endpoints
- `GET /api/teams/:id/tasks` – List all tasks for a specific team
- `POST /api/teams/:id/tasks` – Create a task inside a team (Team members only, sets `creatorId`)
- `PUT /api/tasks/:id` – Update task status, priority, description, or assignee
- `DELETE /api/tasks/:id` – Delete a task (**RBAC enforced:** only Task Creator, Assignee, or Team Owner)

---

## ✨ Features Implemented

1. **Authentication & Session:**
   - Sign up with automatic validation and login.
   - Secure login with bcrypt hash verification and JWT in HttpOnly cookie.
   - Middleware protecting all `/teams/*` routes from unauthorized access.
   - User profile dropdown with quick logout and team counter.
2. **Team Workspace:**
   - Multi-team support: users can create, join, and switch between multiple teams.
   - Owner vs Member role differentiation.
   - Invite team members by registered email.
3. **Task & Workflow Management:**
   - Create, edit, and assign tasks to specific team members.
   - Colored visual badges for Priority (`HIGH`, `MEDIUM`, `LOW`) and Status (`TODO`, `IN_PROGRESS`, `DONE`).
   - Role-based deletion protection: strictly restricted to Creator, Assignee, or Team Owner.
4. **Bonus Features:**
   - **Kanban Board View:** 3-column workflow board with 1-click status transitions.
   - **Table View:** Compact list view with comprehensive details.
   - **Advanced Filters & Search:** Live search by title/description, filter by status, priority, and assignee (including "Assigned to Me" and "Unassigned").

---

## 🚀 Local Development Setup

1. **Clone repository & Install dependencies:**
   ```bash
   git clone <repo-url>
   cd "Ass1 SDN"
   npm install
   ```

2. **Configure Environment Variables (`.env`):**
   ```env
   DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
   JWT_SECRET="taskpulse-secure-jwt-secret-assignment-2-key-32chars"
   ```

3. **Synchronize Database & Seed Data:**
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

4. **Run Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.
