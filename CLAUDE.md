# TaskCo

Next.js 16 (App Router) · Tailwind v4 · Neon PostgreSQL · JWT auth · Single-user task manager

## Stack
- **Frontend:** Next.js 16, Tailwind CSS v4, React Hook Form, Zod, Lucide React
- **Backend:** Next.js API routes, `@neondatabase/serverless`, `bcryptjs`, `jose`
- **Testing:** Jest + React Testing Library (`npm test`)

## Conventions
- Files: kebab-case · Components: PascalCase · DB columns: snake_case · Zod schemas: `camelCaseSchema`
- API responses: `{ data }` success · `{ error }` failure · `{ error, details[] }` validation (422)
- Server Components query DB directly — never `fetch('/api/...')` internally
- Client Components mutate via `fetch` then `router.refresh()`
- Cookie: `token` — `httpOnly; SameSite=Strict`

## Key Files
| Path | Purpose |
|---|---|
| `src/lib/db.ts` | Neon client singleton |
| `src/lib/auth.ts` | JWT sign/verify (jose, HS256, 7d) |
| `src/lib/session.ts` | Read `token` cookie → `{ sub, email }` or null |
| `src/lib/api-response.ts` | `success()` `failure()` `validationError()` |
| `src/middleware.ts` | Protect `/(app)` routes + `/api/projects` `/api/tasks` |
| `src/db/schema.sql` | DDL — already applied to Neon |
| `src/db/queries/` | `users.ts` `projects.ts` `tasks.ts` |
| `src/schemas/` | `auth-schemas.ts` `project-schemas.ts` `task-schemas.ts` |
| `src/types/index.ts` | `User` `Project` `Task` `TaskStatus` `TaskPriority` |

## API Routes
| Method | Path | Auth |
|---|---|---|
| POST | `/api/auth/register` | — |
| POST | `/api/auth/login` | — |
| POST | `/api/auth/logout` | — |
| GET/POST | `/api/projects` | ✓ |
| GET/PATCH/DELETE | `/api/projects/[id]` | ✓ |
| POST | `/api/tasks` | ✓ |
| GET/PATCH/DELETE | `/api/tasks/[id]` | ✓ |

## DB Schema (Neon — already applied)
```sql
CREATE TYPE task_status AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');
CREATE TYPE task_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH');
-- users(id, email, name, password, created_at, updated_at)
-- projects(id, user_id→users, name, description, created_at, updated_at)
-- tasks(id, project_id→projects, user_id→users, title, description, status, priority, due_date, created_at, updated_at)
```

## Security Rules
- `httpOnly` cookie — never localStorage
- All DB queries parameterized (no string concat)
- Every protected query: `WHERE id=$1 AND user_id=$2` (IDOR prevention)
- Passwords hashed bcrypt cost 12, never returned in responses
- Zod validates all request bodies

## Build Progress
- [x] Phase 1 — Foundation (Next.js, deps, DB schema, lib files, Jest)
- [ ] Phase 2 — Auth backend (jwt, session, schemas, queries, middleware, auth routes)
- [ ] Phase 3 — Auth UI (login/register forms + pages)
- [ ] Phase 4 — Core APIs (projects + tasks CRUD)
- [ ] Phase 5 — App pages (dashboard, projects, project detail)
- [ ] Phase 6 — Polish (loading states, empty states, error boundaries)

## Env
```
DATABASE_URL=  # Neon connection string
JWT_SECRET=    # 32+ random bytes
```
