# TaskCo

A single-user task manager built as a full-stack Next.js 16 application. One account per deployment. No OAuth, no teams, no real-time updates, no file uploads, no email verification, and no CI/CD pipeline.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 with CSS custom properties |
| State | Redux Toolkit — client UI state only |
| Forms | React Hook Form + Zod |
| ORM | Prisma 7 with `@prisma/adapter-pg` |
| Database | PostgreSQL (tested on Neon; any PostgreSQL 14+ works) |
| Auth | JWT via `jose` (HS256, 7-day expiry), stored in `httpOnly` cookie |
| Password hashing | `bcryptjs` at cost 12 |
| Testing | Jest + React Testing Library |

## Prerequisites

- Node.js 20 or later
- npm
- A PostgreSQL database (connection string ready)
- A `JWT_SECRET` of at least 32 random bytes — generate one with `openssl rand -base64 32`

## Setup

```bash
git clone <repo-url>
cd taskco-v2
npm install
```

Create `.env.local` at the project root:

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your-32-plus-byte-random-secret
```

Apply the schema to your database:

```bash
npx prisma migrate dev
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root redirects to `/login` if unauthenticated or `/dashboard` if a valid `token` cookie is present.

## API Routes

All routes under `/api/projects` and `/api/tasks` require a valid `token` cookie. Auth routes are public.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create account; sets `httpOnly` JWT cookie |
| POST | `/api/auth/login` | — | Verify credentials; sets `httpOnly` JWT cookie |
| POST | `/api/auth/logout` | — | Clears the `token` cookie |
| GET | `/api/projects` | ✓ | List all projects owned by the authenticated user |
| POST | `/api/projects` | ✓ | Create a project (`name` required, `description` and `color` optional) |
| GET | `/api/projects/[id]` | ✓ | Get a single project with task count |
| PATCH | `/api/projects/[id]` | ✓ | Update project fields |
| DELETE | `/api/projects/[id]` | ✓ | Delete project and all its tasks (cascade) |
| GET | `/api/projects/[id]/tasks` | ✓ | List tasks; supports `?status=` and `?priority=` query filters |
| POST | `/api/projects/[id]/tasks` | ✓ | Create a task under a project |
| PATCH | `/api/tasks/[id]` | ✓ | Update task fields (status, priority, title, description, dueDate) |
| DELETE | `/api/tasks/[id]` | ✓ | Delete a task |

All success responses wrap data in `{ data: ... }`. All error responses return `{ error: string }`. Validation failures return 422 with `{ error: string, details: [{ field, message }] }`.

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/       # Login page
│   ├── (auth)/register/    # Register page
│   ├── (app)/dashboard/    # Dashboard — lists all projects (Server Component)
│   ├── (app)/projects/[id] # Project detail — task list with status/priority filters
│   └── api/                # Next.js route handlers (see API Routes above)
├── components/
│   ├── auth/               # LoginForm, RegisterForm
│   ├── layout/             # Navbar with user avatar initial
│   ├── projects/           # ProjectList, CreateProjectForm
│   ├── tasks/              # ProjectView (filters + task list), CreateTaskForm
│   ├── providers/          # StoreProvider (Redux), AuthHydrator (seeds auth slice from server)
│   └── ui/                 # Button, Input, Label, Card primitives
├── db/queries/             # Prisma query functions (users.ts, projects.ts, tasks.ts)
├── lib/
│   ├── auth.ts             # JWT sign/verify (jose)
│   ├── session.ts          # Reads token cookie → session payload or null
│   ├── access.ts           # canAccessProject ownership helper
│   ├── db.ts               # Prisma singleton (pg pool + adapter)
│   └── api-response.ts     # success(), failure(), validationError() helpers
├── schemas/                # Zod schemas for auth, projects, tasks
├── services/               # Business logic layer (project.service.ts, task.service.ts)
├── store/                  # Redux store, slices (auth, projects, tasks), typed hooks
├── types/                  # Shared TypeScript types (User, Project, Task, enums)
└── middleware.ts           # Protects /(app) pages and /api/projects /api/tasks
```

## Database Schema

Three models: `User`, `Project`, `Task`. All IDs are `cuid()` strings. Cascade deletes: deleting a user removes their projects; deleting a project removes its tasks.

```
User
  id, email (unique), password (bcrypt), name, created_at, updated_at

Project
  id, user_id (FK → User), name, description?, color (default #3b82f6), created_at, updated_at

Task
  id, project_id (FK → Project), user_id, title, description?,
  status (TODO|IN_PROGRESS|DONE), priority (LOW|MEDIUM|HIGH),
  due_date?, created_at, updated_at
```

## Running Tests

```bash
npm test               # run all tests once
npm run test:watch     # watch mode
npm run test:coverage  # with coverage report
```

Tests cover auth routes (register, login, me), project ownership isolation, and task CRUD with filter and ownership cases. The Prisma client is fully mocked — tests do not require a database connection.

## Known Limitations

- **No rate limiting** on auth endpoints. A caller can submit unlimited login attempts. This requires an external layer (reverse proxy, edge middleware with IP counter) and was not implemented.
- **Open registration.** Anyone with network access to the deployment can create an account. There is no invite system or registration lockdown.
- **Stateless JWT.** Tokens cannot be revoked before the 7-day expiry. Logout clears the cookie client-side but the token remains valid if captured elsewhere.
- **No `Secure` flag in development.** The `token` cookie uses `SameSite=Strict` but not `Secure`. In production the cookie must be served over HTTPS and the `Secure` flag should be added.
