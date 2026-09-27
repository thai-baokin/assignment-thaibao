# 🚀 TaskPulse - Task & Team Management Application

> **Assignment 1:** Technical Foundation, Database Setup (Prisma & Supabase), Task CRUD, and Vercel Deployment.

---

## 📌 Project Overview
**TaskPulse** is a modern web application built with Next.js (App Router), TypeScript, Tailwind CSS, Prisma ORM, and Supabase PostgreSQL. This project serves as the foundational milestone (Assignment 1) for the full Task & Team Management application continuing into Assignments 2 and 3.

---

## 🛠️ Tech Stack
- **Framework:** [Next.js](https://nextjs.org/) (App Router, TypeScript)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [Lucide Icons](https://lucide.dev/)
- **Database:** [PostgreSQL on Supabase](https://supabase.com/)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Version Control:** Git & GitHub
- **Deployment:** [Vercel](https://vercel.com/)
- **CI/CD:** GitHub Actions (Automated Lint & Build)

---

## 📊 Entity Relationship Diagram (ERD)

Below is the database relationship diagram representing the Prisma schema:

```mermaid
erDiagram
    User ||--o{ Team : "owns"
    User ||--o{ TeamMember : "belongs to"
    User ||--o{ Task : "assigned to"
    
    Team ||--o{ TeamMember : "has members"
    Team ||--o{ Task : "contains"

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
        String role
        DateTime joinedAt
    }

    Task {
        String id PK
        String title
        String description
        String status
        String priority
        DateTime dueDate
        String teamId FK "optional (Ass 2)"
        String assigneeId FK "optional (Ass 2)"
        DateTime createdAt
        DateTime updatedAt
    }
```

---

## ✨ Features Implemented (Assignment 1)

1. **Clean Project Structure & Tooling:**
   - App Router structure: `app/`, `components/`, `lib/`, `prisma/`.
   - Code styling configured with ESLint & Prettier.
   - `.env.example` template provided.
2. **Database & Schema:**
   - PostgreSQL hosted on Supabase.
   - Models: `User`, `Team`, `TeamMember`, `Task` with relational foreign keys.
   - Initial migration managed via `npx prisma migrate dev`.
3. **Public Task CRUD (No Authentication Needed):**
   - Create Task: Form with client-side validation (title required, description, status, priority, due date).
   - Read Tasks: Real-time list synced from PostgreSQL database.
   - Update Task: Modal editor to adjust details, plus quick-status toggle shortcuts.
   - Delete Task: Immediate deletion with confirmation dialog.
   - Real-time UI updates (no page reload necessary).
4. **Shared Layout & Navigation:**
   - Responsive Header/Navbar with placeholder links (`Home`, `Teams`, `Login`).
   - Dedicated "Coming Soon" teaser page for Teams (`/teams`).
   - Professional Footer with tech stack tags.
5. **Bonus Features:**
   - Status filtering (`All`, `To Do`, `In Progress`, `Done`).
   - Live keyword search bar.
   - GitHub Actions CI pipeline running lint & build.
   - Mermaid Entity Relationship Diagram (ERD).

---

## 🌐 API Route Handlers

| Method | Endpoint | Description | Request Body |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/tasks` | Get all tasks (ordered by newest) | None |
| **POST** | `/api/tasks` | Create a new task | `{ title, description?, status?, priority?, dueDate? }` |
| **PUT** | `/api/tasks/:id` | Update an existing task | `{ title?, description?, status?, priority?, dueDate? }` |
| **DELETE** | `/api/tasks/:id` | Delete a task by ID | None |

---

## 🚀 Getting Started Locally

### 1. Clone the repository
```bash
git clone <YOUR_GITHUB_REPO_URL>
cd "Ass1 SDN"
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Duplicate `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your Supabase connection strings:
```env
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

### 4. Run Prisma Migration & Generate Client
```bash
npx prisma migrate dev --name init
npx prisma generate
```

*(Optional) Launch Prisma Studio to inspect the database:*
```bash
npx prisma studio
```

### 5. Start the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Deployment to Vercel

1. Push your code to a public GitHub repository.
2. Go to [Vercel](https://vercel.com/) and click **"Add New Project"**.
3. Import your GitHub repository.
4. In the **Environment Variables** section, add:
   - `DATABASE_URL`
   - `DIRECT_URL`
5. Click **Deploy**. Vercel will automatically build and publish your application.
