# TaskCo — Project Blueprint

## 1. Locked Decisions

| Concern | Decision |
|---|---|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS |
| Validation | Zod + React Hook Form |
| Icons | Lucide React |
| Backend | Next.js API routes only (no Express) |
| Database | PostgreSQL via Neon DB (`@neondatabase/serverless`) |
| Password hashing | `bcryptjs` |
| Auth mechanism | JWT via `jose`, stored in `httpOnly; SameSite=Strict` cookie named `token` |
| User scope | Single-user (no teams, no orgs) |
| API success envelope | `{ data: T }` |
| API error envelope | `{ error: string }` |
| API validation envelope | `{ error: string, details: { field: string, message: string }[] }` |
| Task statuses | `TODO` \| `IN_PROGRESS` \| `DONE` |
| Task priorities | `LOW` \| `MEDIUM` \| `HIGH` |
| Pages | `/login`, `/register`, `/dashboard`, `/projects`, `/projects/[id]` |
| File naming | kebab-case for files, PascalCase for components |
| DB columns | snake_case |
| Zod schemas | camelCase with `Schema` suffix (e.g. `createTaskSchema`) |
| Server Components | Call DB query functions directly — no HTTP fetch round-trip |
| Client Components | Mutate via `fetch()` then call `router.refresh()` |

---

## 2. Folder Structure

```
taskco-v2/
├── CLAUDE.md
├── .env.local                        # DATABASE_URL, JWT_SECRET
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Root layout (html, body, font)
│   │   ├── globals.css               # Tailwind base imports
│   │   │
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx          # /login — Server Component shell
│   │   │   └── register/
│   │   │       └── page.tsx          # /register — Server Component shell
│   │   │
│   │   ├── (app)/
│   │   │   ├── layout.tsx            # Protected layout — reads cookie, redirects if unauthed
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx          # /dashboard — summary stats, recent tasks
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx          # /projects — list all projects
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx      # /projects/[id] — project detail + tasks
│   │   │
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── register/
│   │       │   │   └── route.ts      # POST /api/auth/register
│   │       │   ├── login/
│   │       │   │   └── route.ts      # POST /api/auth/login
│   │       │   └── logout/
│   │       │       └── route.ts      # POST /api/auth/logout
│   │       ├── projects/
│   │       │   ├── route.ts          # GET /api/projects, POST /api/projects
│   │       │   └── [id]/
│   │       │       └── route.ts      # GET, PATCH, DELETE /api/projects/[id]
│   │       └── tasks/
│   │           ├── route.ts          # POST /api/tasks
│   │           └── [id]/
│   │               └── route.ts      # GET, PATCH, DELETE /api/tasks/[id]
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Label.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Select.tsx
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx         # Client Component
│   │   │   └── RegisterForm.tsx      # Client Component
│   │   ├── projects/
│   │   │   ├── ProjectCard.tsx
│   │   │   ├── ProjectList.tsx
│   │   │   ├── CreateProjectForm.tsx # Client Component
│   │   │   └── EditProjectForm.tsx   # Client Component
│   │   ├── tasks/
│   │   │   ├── TaskCard.tsx
│   │   │   ├── TaskList.tsx
│   │   │   ├── CreateTaskForm.tsx    # Client Component
│   │   │   ├── EditTaskForm.tsx      # Client Component
│   │   │   └── TaskStatusBadge.tsx
│   │   └── layout/
│   │       ├── Navbar.tsx
│   │       └── Sidebar.tsx
│   │
│   ├── lib/
│   │   ├── db.ts                     # Neon DB client singleton
│   │   ├── auth.ts                   # JWT sign / verify helpers (jose)
│   │   ├── session.ts                # Read current user from cookie (server-side)
│   │   └── api-response.ts           # success(), failure(), validationError() helpers
│   │
│   ├── db/
│   │   ├── schema.sql                # Full DDL (run once against Neon)
│   │   └── queries/
│   │       ├── users.ts              # createUser, getUserByEmail, getUserById
│   │       ├── projects.ts           # createProject, getProjects, getProjectById, updateProject, deleteProject
│   │       └── tasks.ts              # createTask, getTasksByProject, getTaskById, updateTask, deleteTask
│   │
│   ├── schemas/
│   │   ├── auth-schemas.ts           # loginSchema, registerSchema
│   │   ├── project-schemas.ts        # createProjectSchema, updateProjectSchema
│   │   └── task-schemas.ts           # createTaskSchema, updateTaskSchema
│   │
│   ├── types/
│   │   └── index.ts                  # User, Project, Task, TaskStatus, TaskPriority TS types
│   │
│   └── middleware.ts                 # Next.js middleware — JWT check, redirect unauthed requests
```

---

## 3. Database Schema SQL

```sql
-- src/db/schema.sql

CREATE TYPE task_status AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');
CREATE TYPE task_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH');

CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  password    TEXT NOT NULL,           -- bcrypt hash
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  status      task_status NOT NULL DEFAULT 'TODO',
  priority    task_priority NOT NULL DEFAULT 'MEDIUM',
  due_date    DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_user_id    ON tasks(user_id);
CREATE INDEX idx_tasks_status     ON tasks(status);
```

---

## 4. API Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | No | Create account, set JWT cookie |
| `POST` | `/api/auth/login` | No | Verify credentials, set JWT cookie |
| `POST` | `/api/auth/logout` | No | Clear JWT cookie |
| `GET` | `/api/projects` | Yes | List all projects for current user |
| `POST` | `/api/projects` | Yes | Create a project |
| `GET` | `/api/projects/[id]` | Yes | Get single project (owned by user) |
| `PATCH` | `/api/projects/[id]` | Yes | Update project name/description |
| `DELETE` | `/api/projects/[id]` | Yes | Delete project (cascades tasks) |
| `POST` | `/api/tasks` | Yes | Create a task in a project |
| `GET` | `/api/tasks/[id]` | Yes | Get single task |
| `PATCH` | `/api/tasks/[id]` | Yes | Update task fields |
| `DELETE` | `/api/tasks/[id]` | Yes | Delete task |

---

## 5. Auth Flow

### Register
1. Client posts `{ email, name, password }` to `POST /api/auth/register`.
2. Route validates with `registerSchema` (Zod).
3. Checks `getUserByEmail` — returns 409 if exists.
4. Hashes password with `bcryptjs.hash(password, 12)`.
5. Calls `createUser`, gets back the new user row.
6. Signs a JWT with `jose` (`{ sub: user.id, email }`), 7-day expiry.
7. Sets `Set-Cookie: token=<jwt>; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800`.
8. Returns `{ data: { id, email, name } }`.

### Login
1. Client posts `{ email, password }` to `POST /api/auth/login`.
2. Route validates with `loginSchema`.
3. Calls `getUserByEmail` — returns 401 if not found.
4. Compares with `bcryptjs.compare` — returns 401 if mismatch.
5. Signs JWT and sets cookie (same as register).
6. Returns `{ data: { id, email, name } }`.

### Logout
1. Client posts to `POST /api/auth/logout`.
2. Route sets `Set-Cookie: token=; HttpOnly; Max-Age=0` to clear cookie.
3. Returns `{ data: { ok: true } }`.

### Protected requests
- `middleware.ts` intercepts all `/(app)` routes and `/api/projects`, `/api/tasks`.
- Reads `token` cookie, calls `jose.jwtVerify`.
- On failure: redirects page requests to `/login`, returns 401 JSON for API requests.
- On success: forwards the request (payload available via `session.ts` on the server).

### Server-side session
`src/lib/session.ts` reads the `token` cookie via `next/headers` cookies(), verifies it with `jose`, and returns `{ userId, email }` or `null`. Used directly in Server Components and API routes.

---

## 6. Key Code Patterns

### DB Client (`src/lib/db.ts`)
```typescript
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);
export default sql;
```

### API Response Helpers (`src/lib/api-response.ts`)
```typescript
import { NextResponse } from 'next/server';

export const success = <T>(data: T, status = 200) =>
  NextResponse.json({ data }, { status });

export const failure = (error: string, status = 400) =>
  NextResponse.json({ error }, { status });

export const validationError = (details: { field: string; message: string }[]) =>
  NextResponse.json({ error: 'Validation failed', details }, { status: 422 });
```

### API Route — Zod Validation Pattern
```typescript
import { z } from 'zod';
import { createTaskSchema } from '@/schemas/task-schemas';
import { success, failure, validationError } from '@/lib/api-response';

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    const details = parsed.error.issues.map(i => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    return validationError(details);
  }
  // ... use parsed.data
}
```

### API Route — Auth Guard Pattern
```typescript
import { getSession } from '@/lib/session';
import { failure } from '@/lib/api-response';

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return failure('Unauthorized', 401);
  // session.userId is available
}
```

### Server Component — Direct DB Access
```typescript
// src/app/(app)/projects/page.tsx
import { getSession } from '@/lib/session';
import { getProjects } from '@/db/queries/projects';
import { redirect } from 'next/navigation';

export default async function ProjectsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const projects = await getProjects(session.userId);
  return <ProjectList projects={projects} />;
}
```

### Client Component — Mutation Pattern
```typescript
'use client';
import { useRouter } from 'next/navigation';

export function CreateProjectForm() {
  const router = useRouter();

  async function handleSubmit(data: CreateProjectInput) {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const { error } = await res.json();
      // surface error to user
      return;
    }
    router.refresh(); // re-runs Server Component data fetch
  }
}
```

### JWT Sign / Verify (`src/lib/auth.ts`)
```typescript
import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function signToken(payload: { sub: string; email: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload as { sub: string; email: string };
}
```

---

## 7. Build Order

### Phase 1 — Foundation
- Init Next.js 15 project (`npx create-next-app@latest`)
- Install all dependencies
- Configure Tailwind CSS
- Create `.env.local` with `DATABASE_URL` and `JWT_SECRET`
- Run `schema.sql` against Neon DB
- Implement `src/lib/db.ts`
- Implement `src/types/index.ts`
- Implement `src/lib/api-response.ts`

### Phase 2 — Auth Backend
- Implement `src/lib/auth.ts` (JWT sign/verify)
- Implement `src/lib/session.ts` (read cookie, verify)
- Write all Zod schemas in `src/schemas/`
- Write DB query functions in `src/db/queries/`
- Implement `src/middleware.ts`
- Implement `POST /api/auth/register`
- Implement `POST /api/auth/login`
- Implement `POST /api/auth/logout`

### Phase 3 — Auth UI
- Build `LoginForm.tsx` (React Hook Form + Zod)
- Build `RegisterForm.tsx`
- Build `/login` page
- Build `/register` page
- Build reusable UI primitives: `Button`, `Input`, `Label`, `Card`

### Phase 4 — Core APIs
- Implement `GET/POST /api/projects`
- Implement `GET/PATCH/DELETE /api/projects/[id]`
- Implement `POST /api/tasks`
- Implement `GET/PATCH/DELETE /api/tasks/[id]`

### Phase 5 — App Pages
- Build `(app)/layout.tsx` (protected layout with Navbar/Sidebar)
- Build `/dashboard` page (stats + recent tasks)
- Build `/projects` page + `CreateProjectForm`
- Build `/projects/[id]` page + `CreateTaskForm`, `EditTaskForm`, `TaskList`
- Add `Badge`, `Modal`, `Select`, `TaskStatusBadge` components

### Phase 6 — Polish
- Error boundaries and loading states (`loading.tsx`, `error.tsx`)
- Empty states for project/task lists
- Form validation UX (field-level errors)
- Responsive layout (mobile Sidebar)
- Review security checklist

---

## 8. Dependencies

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@neondatabase/serverless": "^0.10.0",
    "jose": "^5.0.0",
    "bcryptjs": "^2.4.3",
    "zod": "^3.23.0",
    "react-hook-form": "^7.52.0",
    "@hookform/resolvers": "^3.9.0",
    "lucide-react": "^0.400.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^20.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^15.0.0"
  }
}
```

---

## 9. Security Rules

| Rule | Rationale |
|---|---|
| `httpOnly` cookie only — never `localStorage` | Prevents XSS token theft |
| `SameSite=Strict` | Blocks CSRF from foreign origins |
| `Secure` flag in production | Cookie only sent over HTTPS |
| Passwords hashed with `bcryptjs` (cost 12) | Brute-force resistant |
| JWT secret minimum 32 random bytes | Prevents key guessing |
| All DB queries use parameterized `sql` tag | Prevents SQL injection |
| All protected API routes call `getSession()` first | Ensures auth check never skipped |
| Project/task ownership verified on every query | Prevents IDOR — always filter by `user_id` |
| Zod validates all incoming request bodies | Rejects malformed/oversized payloads |
| No user passwords returned in any API response | Leaks prevented at query level |
| `middleware.ts` protects `/(app)` routes globally | Defense-in-depth for page-level access |

### Ownership check pattern (MUST follow in every query)
```typescript
// Always scope queries to the authenticated user
const project = await getProjectById(id, session.userId);
// getProjectById must include WHERE id = $1 AND user_id = $2
if (!project) return failure('Not found', 404);
```

---

## 10. Verification Checklist

### Auth
- [ ] Register creates user, sets cookie, returns `{ data: { id, email, name } }`
- [ ] Login with wrong password returns 401
- [ ] Login with correct credentials sets cookie and redirects to `/dashboard`
- [ ] Logout clears cookie and redirects to `/login`
- [ ] Visiting `/dashboard` unauthenticated redirects to `/login`
- [ ] JWT cookie is `httpOnly` (not readable via `document.cookie`)

### Projects
- [ ] `POST /api/projects` without auth returns 401
- [ ] `POST /api/projects` with empty name returns 422 with `details`
- [ ] Created project appears in `GET /api/projects`
- [ ] `GET /api/projects/[id]` with another user's project ID returns 404
- [ ] `DELETE /api/projects/[id]` cascades and removes all tasks

### Tasks
- [ ] `POST /api/tasks` with invalid `status` value returns 422
- [ ] Task status cycles: TODO → IN_PROGRESS → DONE via `PATCH`
- [ ] Task priority defaults to `MEDIUM` if not provided
- [ ] Deleting a task does not delete the parent project
- [ ] `GET /api/tasks/[id]` from a different user returns 404

### UI / Pages
- [ ] `/projects` shows empty state when no projects exist
- [ ] `/projects/[id]` shows all tasks grouped or listed correctly
- [ ] Form validation errors display at field level
- [ ] `router.refresh()` updates the page after create/edit/delete without full reload
- [ ] Dashboard shows correct task counts per status

### Security
- [ ] No SQL built via string concatenation (all use parameterized `sql` tag)
- [ ] No raw passwords logged or returned
- [ ] All `PATCH`/`DELETE` routes verify ownership before acting
- [ ] `middleware.ts` matcher covers all app routes