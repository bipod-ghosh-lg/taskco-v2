# TaskCo

Next.js 16 (App Router) · Tailwind v4 · PostgreSQL (Neon) · Prisma ORM · JWT auth · Single-user task manager

## Stack
- **Frontend:** Next.js 16, Tailwind CSS v4, React Hook Form, Zod, Lucide React, Redux Toolkit
- **Backend:** Next.js API routes, Prisma (`@prisma/client` + `@prisma/adapter-pg`), `pg`, `bcryptjs`, `jose`
- **Testing:** Jest + React Testing Library (`npm test`)

## Conventions
- Files: kebab-case · Components: PascalCase · DB columns: snake_case · Zod schemas: `camelCaseSchema`
- API responses: `{ data }` success · `{ error }` failure · `{ error, details[] }` validation (422)
- Server Components query DB directly — never `fetch('/api/...')` internally
- Client Components mutate via `fetch` then `router.refresh()`
- Cookie: `token` — `httpOnly; SameSite=Strict` — always use `credentials: 'include'` on fetch, never Authorization header
- Redux manages client UI state only — Server Components still query Prisma directly

## Key Files
| Path | Purpose |
|---|---|
| `src/lib/db.ts` | Prisma client singleton (pg pool + adapter) |
| `src/lib/auth.ts` | JWT sign/verify (jose, HS256, 7d) |
| `src/lib/session.ts` | Read `token` cookie → `{ sub, email }` or null |
| `src/lib/api-response.ts` | `success()` `failure()` `validationError()` |
| `src/middleware.ts` | Protect `/(app)` routes + `/api/projects` `/api/tasks` |
| `prisma/schema.prisma` | Prisma schema — source of truth for DB models |
| `src/generated/prisma/` | Auto-generated Prisma client (do not edit) |
| `src/db/schema.sql` | Legacy DDL reference (Prisma migrations are authoritative) |
| `src/db/queries/` | `users.ts` `projects.ts` `tasks.ts` |
| `src/schemas/` | `auth-schemas.ts` `project-schemas.ts` `task-schemas.ts` |
| `src/types/index.ts` | `User` `Project` `Task` `TaskStatus` `TaskPriority` |
| `src/store/index.ts` | Redux store (`auth` + `projects` + `tasks` slices) |
| `src/store/hooks.ts` | Typed `useAppDispatch` / `useAppSelector` |
| `src/store/slices/` | `auth-slice.ts` `projects-slice.ts` `tasks-slice.ts` |
| `src/components/providers/StoreProvider.tsx` | `'use client'` Redux Provider wrapper |

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

## DB Schema (Prisma — `prisma/schema.prisma`)
- Provider: `postgresql` via `pg` pool + `@prisma/adapter-pg`
- IDs: `cuid()` strings (not serial ints)
- Enums: `TaskStatus` (TODO, IN_PROGRESS, DONE) · `TaskPriority` (LOW, MEDIUM, HIGH)
- Models: `User` · `Project` (has `color` field, `#3b82f6` default) · `Task`
- Relations: User→Projects (cascade delete) · Project→Tasks (cascade delete)
- Timestamps mapped to `snake_case` columns (`created_at`, `updated_at`)

Useful commands:
```bash
npx prisma generate     # regenerate client after schema changes
npx prisma db push      # push schema to DB (dev)
npx prisma migrate dev  # create & apply a named migration
```

## Design System (Tailwind — use these tokens everywhere, never deviate)

| Token | Class | Used for |
|---|---|---|
| Page background | `bg-gray-50` | App shell, page wrappers |
| Card | `bg-white rounded-lg shadow-sm border border-gray-200 p-6` | Project cards, task cards, form containers |
| Primary button | `bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2` | Submit, create |
| Danger button | `bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2` | Delete |
| Heading | `text-gray-900 font-semibold` | Page titles, card titles |
| Body text | `text-gray-600` | Descriptions, secondary content |
| Muted text | `text-gray-400 text-sm` | Dates, meta info |
| Filter active | `bg-blue-600 text-white rounded-lg px-3 py-1.5 text-sm` | Active filter button |
| Filter inactive | `bg-white border border-gray-200 text-gray-700 rounded-lg px-3 py-1.5 text-sm` | Inactive filter button |

### Priority badges
| Priority | Class |
|---|---|
| HIGH | `bg-red-100 text-red-800` |
| MEDIUM | `bg-yellow-100 text-yellow-800` |
| LOW | `bg-green-100 text-green-800` |

### Status badges
| Status | Class |
|---|---|
| TODO | `bg-gray-100 text-gray-800` |
| IN_PROGRESS | `bg-blue-100 text-blue-800` |
| DONE | `bg-green-100 text-green-800` |

### Project preset colors
`#3b82f6` · `#10b981` · `#f59e0b` · `#ef4444` · `#8b5cf6` · `#ec4899`

## Security Rules
- `httpOnly` cookie — never localStorage
- All DB queries parameterized (no string concat)
- Every protected query: `WHERE id=$1 AND user_id=$2` (IDOR prevention)
- Passwords hashed bcrypt cost 12, never returned in responses
- Zod validates all request bodies

## Build Progress
- [x] Phase 1 — Foundation (Next.js, deps, DB schema, lib files, Jest)
- [x] Phase 2 — Auth backend (jwt, session, schemas, queries, middleware, auth routes)
- [x] Phase 3 — Auth UI (login/register forms + pages)
- [x] Phase 4 — Core APIs (projects CRUD — tasks CRUD pending)
- [ ] Phase 5 — App pages (dashboard, projects, project detail) + Redux store
- [ ] Phase 6 — Polish (loading states, empty states, error boundaries)

## Env
```
DATABASE_URL=  # PostgreSQL connection string (Neon or local)
JWT_SECRET=    # 32+ random bytes
```
