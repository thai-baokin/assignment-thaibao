# TaskPulse - Task & Team Management App

> Assignment 3 & 4: Real-time Collaboration & Advanced Features.
> Built on the same repository and Vercel project as Assignments 1 and 2.

TaskPulse is a full-stack team workspace built with **Next.js 16 (App Router, TypeScript)**, **Tailwind CSS v4**, **Prisma 6.4.1**, **Supabase PostgreSQL**, and **Supabase Realtime**. It includes authentication, multi-team workspaces, a live Kanban board, persisted team chat, in-app notifications, an activity log, and a three-tier permission system.

---

## Submission Information

```text
Student ID: QE190108
Full Name: Nguyễn Thái Bảo
GitHub Repository URL: https://github.com/thai-baokin/assignment-thaibao
Deployed Website URL (Vercel): https://assignment-thaibao.vercel.app
Separate Backend URL (NestJS on Render) — write N/A if not used: N/A
Real-time mechanism used (Supabase Realtime / Socket.io / Pusher / Ably): Supabase Realtime (Broadcast + Presence)
Test Account 1 Email: admin@taskpulse.io
Test Account 1 Password: password123
Test Account 2 Email (must be on the SAME team as Account 1, to test real-time between two sessions): member@taskpulse.io
Test Account 2 Password: password123
Both test accounts are already email-verified / ready to log in immediately, with no confirmation link needed (Yes / No): Yes
Demo video link (YouTube/Drive/Loom, 2–3 minutes, showing live chat and live task updates across two sessions): [Add demo video link before submission]
```

Both test accounts are seeded into the same team. Authentication uses an HttpOnly cookie, so test the two accounts in **two separate browser profiles** (or one normal window and one incognito window). Switching accounts in the same profile intentionally syncs all tabs to the new session.

---

## Tech Stack

- **Frontend & API:** Next.js 16 (App Router, Route Handlers, Turbopack), React 19, TypeScript
- **Styling:** Tailwind CSS v4, Lucide Icons
- **Database:** PostgreSQL on Supabase (connection pooler + direct URL)
- **ORM:** Prisma 6.4.1
- **Auth:** JWT signed with `jose`, stored in an HttpOnly cookie (`taskpulse_token`); passwords hashed with `bcryptjs`
- **Real-time:** Supabase Realtime Broadcast channels + Presence
- **Route protection:** Next.js `proxy.ts` (formerly middleware)
- **Deployment:** Vercel
- **CI:** GitHub Actions (`lint` + `build`)

---

## Features

### Real-time team chat
- One chat room per team with persisted history (`Message` model).
- New messages are delivered instantly through the `team-chat-<teamId>` Supabase Realtime channel.
- Message bubbles distinguish the current user (right) from other members (left, with avatar and timestamp).
- Auto-scroll, Enter-to-send, typing indicator, online presence, and file/image attachments (max 1.5 MB).
- A 25-second polling fallback keeps history consistent if the WebSocket connection drops.

### Live task board
- Kanban columns: **To Do**, **In Progress**, **Done**, plus a table view.
- Task created, updated, or deleted events are broadcast on `team-tasks-<teamId>` and applied without a page refresh.
- One-click status transitions and live filters/search by status, priority, and assignee.

### Notifications
- In-app notification when a user is assigned a task (`ASSIGNED_TASK`) or added to a team (`ADDED_TO_TEAM`).
- Persisted in the `Notification` model and delivered live on `notifications:user-<userId>`.
- Navbar bell with unread badge, dropdown list, relative timestamps, mark-one/mark-all as read, click-to-navigate, audio chime, and browser desktop notifications.
- A 30-second polling fallback keeps the bell in sync.

### Activity log
- `ActivityLog` records team creation/update, member add/remove/role changes, and task create/update/delete.
- The **Activity** tab shows the latest 100 events with actor, action, and time.

### Three-tier roles and permissions
| Action | Owner | Admin | Member |
| --- | --- | --- | --- |
| Edit team information | Yes | Yes | No |
| Delete team | Yes | No | No |
| Invite members | Yes | Yes | No |
| Change member role | Yes | No | No |
| Remove members | Anyone except self | Members only | Only leave themselves |
| Create tasks | Yes | Yes | Yes |
| Edit any task | Yes | Yes | Own/assigned tasks only |
| Delete any task | Yes | Yes | Own/assigned tasks only |
| View team, chat, activity | Yes | Yes | Yes |

Permissions are enforced in **both** the Route Handlers (`lib/permissions.ts`) and the UI (hidden/disabled controls).

---

## Real-time Architecture

Server-side Route Handlers write to PostgreSQL first, then publish an event through the Supabase Realtime Broadcast REST API (`lib/realtime-broadcast.ts`). Connected browsers subscribe with `@supabase/supabase-js` and update local state when events arrive.

| Channel | Events | Used by |
| --- | --- | --- |
| `team-chat-<teamId>` | `new-message`, `typing`, presence sync | `components/TeamChat.tsx` |
| `team-tasks-<teamId>` | `task-created`, `task-updated`, `task-deleted` | `app/teams/[id]/page.tsx` |
| `team-members-<teamId>` | `member-updated`, `team-updated` | `app/teams/[id]/page.tsx` |
| `notifications:user-<userId>` | `new-notification` | `components/NotificationBell.tsx` |

Required environment variables:

```env
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
JWT_SECRET="your-jwt-secret-at-least-32-chars-long"
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR_SUPABASE_ANON_KEY]"
# Optional: used by server-side broadcasts; falls back to the anon key.
SUPABASE_SERVICE_ROLE_KEY=""
```

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new account
- `POST /api/auth/login` - Sign in and issue the HttpOnly session cookie
- `POST /api/auth/logout` - Clear the session cookie
- `GET /api/auth/me` - Current session and team memberships

### Teams
- `GET /api/teams` - Teams the current user belongs to
- `POST /api/teams` - Create a team (creator becomes Owner)
- `GET /api/teams/:id` - Team details with members, tasks, and owner
- `PUT /api/teams/:id` - Update team (Owner/Admin)
- `DELETE /api/teams/:id` - Delete team (Owner only)

### Members
- `POST /api/teams/:id/members` - Invite a registered user by email (Owner/Admin)
- `PATCH /api/teams/:id/members/:userId` - Change role `ADMIN`/`MEMBER` (Owner only)
- `DELETE /api/teams/:id/members/:userId` - Remove a member or leave the team (RBAC)

### Tasks
- `GET /api/teams/:id/tasks` - List team tasks (members)
- `POST /api/teams/:id/tasks` - Create a team task (members)
- `PUT /api/tasks/:id` - Update a task (RBAC)
- `DELETE /api/tasks/:id` - Delete a task (RBAC)
- `GET /api/tasks` and `POST /api/tasks` - Personal tasks used by the home page (from earlier assignments)

### Chat, notifications, activity
- `GET /api/teams/:id/messages` - Latest 100 messages (members)
- `POST /api/teams/:id/messages` - Send a message and broadcast it (members)
- `GET /api/notifications` - Notifications + unread count
- `PUT /api/notifications` - Mark all notifications as read
- `PUT /api/notifications/:id` - Mark one notification as read
- `GET /api/teams/:id/activity` - Latest 100 activity entries (members)

---

## Data Model

```mermaid
erDiagram
    User ||--o{ Team : "owns"
    User ||--o{ TeamMember : "memberships"
    User ||--o{ Task : "creates"
    User ||--o{ Task : "assigned"
    User ||--o{ Message : "sends"
    User ||--o{ Notification : "receives"
    User ||--o{ ActivityLog : "performs"

    Team ||--o{ TeamMember : "has members"
    Team ||--o{ Task : "contains tasks"
    Team ||--o{ Message : "chat history"
    Team ||--o{ ActivityLog : "activity trail"

    TeamMember {
        String id PK
        String teamId FK
        String userId FK
        String role "OWNER | ADMIN | MEMBER"
        DateTime joinedAt
    }

    Message {
        String id PK
        String content
        String teamId FK
        String senderId FK
        String attachmentUrl
        String attachmentName
        String attachmentType
        DateTime createdAt
    }

    Notification {
        String id PK
        String userId FK
        String type "ASSIGNED_TASK | ADDED_TO_TEAM"
        String title
        String message
        String relatedId
        Boolean read
        DateTime createdAt
    }

    ActivityLog {
        String id PK
        String teamId FK
        String userId FK
        String action
        String detail
        String metadata
        DateTime createdAt
    }
```

---

## Local Development

```bash
git clone https://github.com/thai-baokin/assignment-thaibao.git
cd "Ass1 SDN"
npm install
```

1. Create `.env` from `.env.example` and fill in the Supabase connection strings and Realtime keys.
2. Apply migrations and seed the two test accounts:

```bash
npx prisma migrate deploy
npx prisma db seed
```

3. Start the app:

```bash
npm run dev
```

4. Open http://localhost:3000.

Useful checks:

```bash
npm run lint
npm run build
```

### Multi-session real-time test

1. Open the deployed site in a normal window and log in as `admin@taskpulse.io`.
2. Open an incognito window (or a second browser profile) and log in as `member@taskpulse.io`.
3. Both accounts belong to the same seeded team. Open the team page in both windows.
4. Send a chat message in one window; it appears instantly in the other.
5. Create or move a task in one window; the Kanban board updates instantly in the other.
6. Assign a task to the other account to see the notification bell update live.

---

## Deployment

- The app is deployed on the same Vercel project as Assignments 1 and 2: https://assignment-thaibao.vercel.app
- Add all variables from `.env.example` to the Vercel project (Production + Preview).
- Supabase Realtime is enabled by default for public channels; no extra server is required.
- If a separate NestJS backend were used, it would be deployed to Render and configured with `DATABASE_URL`; this submission uses Next.js Route Handlers so that field is **N/A**.
