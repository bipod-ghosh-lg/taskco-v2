# TaskCo — Project Blueprint

## 1. Locked Decisions

| Concern | Decision |
|---|---|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 |
| Validation | Zod + React Hook Form |
| Icons | Lucide React |
| Backend | Next.js API routes only (no Express) |
| Database | PostgreSQL via Prisma ORM (`@prisma/client` + `@prisma/adapter-pg` + `pg`) |
| ORM | Prisma — schema in `prisma/schema.prisma`, client in `src/generated/prisma/` |
| Client state | Redux Toolkit (`@reduxjs/toolkit` + `react-redux`) |
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
├── tsconfig.json
├── package.json
├── prisma/
│   └── schema.prisma                 # Prisma schema — source of truth for DB models
│
├── src/
│   ├── generated/
│   │   └── prisma/                   # Auto-generated Prisma client (do not edit)
│   │
│   ├── app/
│   │   ├── layout.tsx                # Root layout (html, body, font, Redux Provider)
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
│   │       │   ├── logout/
│   │       │   │   └── route.ts      # POST /api/auth/logout
│   │       │   └── me/
│   │       │       └── route.ts      # GET /api/auth/me
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
│   ├── store/
│   │   ├── index.ts                  # Redux store setup (configureStore)
│   │   ├── hooks.ts                  # Typed useAppDispatch / useAppSelector
│   │   └── slices/
│   │       ├── auth-slice.ts         # Current user state (id, email, name)
│   │       ├── projects-slice.ts     # Projects list + selected project
│   │       └── tasks-slice.ts        # Tasks list + filters (status, priority)
│   │
│   ├── lib/
│   │   ├── db.ts                     # Prisma client singleton (pg pool + adapter)
│   │   ├── auth.ts                   # JWT sign / verify helpers (jose)
│   │   ├── session.ts                # Read current user from cookie (server-side)
│   │   └── api-response.ts           # success(), failure(), validationError() helpers
│   │
│   ├── db/
│   │   ├── schema.sql                # Legacy DDL reference (Prisma is authoritative)
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

## 3. Database Schema (Prisma)

Schema lives in `prisma/schema.prisma`. Prisma is the source of truth — `src/db/schema.sql` is kept only as a legacy reference.

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

enum TaskStatus   { TODO IN_PROGRESS DONE }
enum TaskPriority { LOW MEDIUM HIGH }

model User {
  id        String    @id @default(cuid())
  email     String    @unique
  password  String
  name      String
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  projects  Project[]
  @@map("users")
}

model Project {
  id          String   @id @default(cuid())
  userId      String   @map("user_id")
  name        String
  description String?
  color       String   @default("#3b82f6")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tasks       Task[]
  @@map("projects")
}

model Task {
  id          String       @id @default(cuid())
  projectId   String       @map("project_id")
  userId      String       @map("user_id")
  title       String
  description String?
  status      TaskStatus   @default(TODO)
  priority    TaskPriority @default(MEDIUM)
  dueDate     DateTime?    @map("due_date")
  createdAt   DateTime     @default(now()) @map("created_at")
  updatedAt   DateTime     @updatedAt @map("updated_at")
  project     Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  @@map("tasks")
}
```

Key differences from the original SQL plan: IDs are `cuid()` strings (not UUIDs), `Project` has a `color` field, cascade deletes are handled by Prisma relations.

Useful commands:
```bash
npx prisma generate      # regenerate client after schema changes
npx prisma db push       # push schema to DB without a migration file (dev)
npx prisma migrate dev   # create and apply a named migration
npx prisma studio        # open DB browser UI
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
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrisma() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const prisma = globalForPrisma.prisma ?? createPrisma();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
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
import prisma from '@/lib/db';
import { redirect } from 'next/navigation';

export default async function ProjectsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const projects = await prisma.project.findMany({
    where: { userId: session.userId },
  });
  return <ProjectList projects={projects} />;
}
```

### Redux Store Setup (`src/store/index.ts`)
```typescript
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/auth-slice';
import projectsReducer from './slices/projects-slice';
import tasksReducer from './slices/tasks-slice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    projects: projectsReducer,
    tasks: tasksReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### Redux Usage Rule
Redux manages client-side UI state (optimistic updates, filter selections, active project). It does NOT replace server-side data fetching. Server Components still query Prisma directly. Client Components dispatch actions after a successful `fetch()` mutation and call `router.refresh()` to sync server state.

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
- Init Next.js 16 project (`npx create-next-app@latest`)
- Install all dependencies (including Prisma, pg, Redux Toolkit)
- Configure Tailwind CSS v4
- Create `.env.local` with `DATABASE_URL` and `JWT_SECRET`
- Set up `prisma/schema.prisma` and run `npx prisma db push`
- Implement `src/lib/db.ts` (Prisma singleton)
- Implement `src/types/index.ts`
- Implement `src/lib/api-response.ts`
- Set up Redux store in `src/store/` with typed hooks

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
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@prisma/client": "^7.0.0",
    "@prisma/adapter-pg": "^7.0.0",
    "pg": "^8.0.0",
    "@reduxjs/toolkit": "^2.0.0",
    "react-redux": "^9.0.0",
    "jose": "^6.0.0",
    "bcryptjs": "^3.0.0",
    "zod": "^4.0.0",
    "react-hook-form": "^7.52.0",
    "@hookform/resolvers": "^5.0.0",
    "lucide-react": "^1.0.0"
  },
  "devDependencies": {
    "prisma": "^7.0.0",
    "@types/bcryptjs": "^2.4.6",
    "@types/pg": "^8.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^16.0.0",
    "jest": "^30.0.0",
    "jest-environment-jsdom": "^30.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "ts-jest": "^29.0.0"
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
| All DB queries go through Prisma — no raw SQL string concat | Prevents SQL injection |
| All protected API routes call `getSession()` first | Ensures auth check never skipped |
| Project/task ownership verified on every query | Prevents IDOR — always filter by `user_id` |
| Zod validates all incoming request bodies | Rejects malformed/oversized payloads |
| No user passwords returned in any API response | Leaks prevented at query level |
| `middleware.ts` protects `/(app)` routes globally | Defense-in-depth for page-level access |

### Ownership check pattern (MUST follow in every query)
```typescript
// Always scope queries to the authenticated user — never find by id alone
const project = await prisma.project.findFirst({
  where: { id, userId: session.userId },
});
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
- [ ] No raw SQL — all queries go through Prisma
- [ ] No raw passwords logged or returned
- [ ] All `PATCH`/`DELETE` routes verify ownership before acting
- [ ] `middleware.ts` matcher covers all app routes