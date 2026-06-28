# TaskCo v1

## Summary

This PR delivers a complete, production-shaped single-user task manager built on Next.js 16 (App Router), PostgreSQL via Prisma, and JWT cookie auth. It covers the full vertical slice from database schema through API routes to server-rendered pages and a Redux-backed client UI — plus a security hardening pass that addressed account enumeration, JWT exposure in response bodies, missing input bounds, unvalidated color values, and ownership checks that filtered in application code instead of at the database level.

## Features

**Auth**
- `POST /api/auth/register` — creates an account, hashes the password with bcrypt (cost 12), issues a 7-day JWT stored exclusively in an `httpOnly; SameSite=Strict` cookie; JWT is never returned in the response body
- `POST /api/auth/login` — verifies credentials with constant-time comparison; returns the same error message whether the email is unknown or the password is wrong
- `POST /api/auth/logout` — clears the cookie with `Max-Age=0`
- Next.js middleware blocks `/(app)` pages and `/api/projects` + `/api/tasks` for unauthenticated requests

**Projects CRUD**
- Full GET / POST / PATCH / DELETE on `/api/projects` and `/api/projects/[id]`
- Every query filters by `userId` at the database level — no fetch-then-compare in application code
- Project color is validated as a 6-digit hex string (`#rrggbb`) via Zod before reaching the DB

**Tasks CRUD**
- `POST /api/projects/[id]/tasks` and `GET /api/projects/[id]/tasks` with optional `?status=` and `?priority=` query filters (validated via `z.nativeEnum`)
- `PATCH /api/tasks/[id]` and `DELETE /api/tasks/[id]`
- Ownership enforced through `findFirst({ where: { id, project: { userId } } })` — a task belonging to another user's project returns 404, not 403, to avoid confirming resource existence

**Frontend**
- Server Components on dashboard and project detail pages query Prisma directly — no internal `fetch` calls
- Client Components (`ProjectList`, `ProjectView`, `CreateProjectForm`, `CreateTaskForm`) mutate via `fetch` + `router.refresh()`
- Redux Toolkit manages client-side UI state (`auth`, `projects`, `tasks` slices); all dates are serialized to ISO strings before entering the store
- `AuthHydrator` — a null-rendering client component — seeds the Redux auth slice from the server-rendered layout without breaking the Server Component boundary
- Inline task status cycling (TODO → IN_PROGRESS → DONE) with optimistic update and rollback on failure
- Status and priority filter bar with active/inactive state reflected in Redux

**Security hardening applied in this PR**
- Removed JWT from register/login response bodies; cookie is the sole token carrier
- Generic `'Registration failed'` replaces the email-existence-revealing message
- `.max()` bounds on all string inputs: email (254), password (72), name (100), project name (100), task title (200), descriptions (1000)
- Hex color format enforced by Zod regex before any DB write
- All ownership checks use database-level `userId` filtering (`findFirst`/`findUnique` with `where: { id, userId }`) — no post-fetch comparisons in application code
- `JWT_SECRET` absence throws at module load time rather than silently producing a zero-byte signing key
- `.claudeignore` added to exclude `.env`, `.env.local`, `*.pem`, `*.key`

## Setup

```bash
npm install
# create .env.local with:
# DATABASE_URL=postgresql://...
# JWT_SECRET=<32+ random bytes — generate with: openssl rand -base64 32>
npx prisma migrate dev
npm run dev
```

## Testing Checklist

Work through these steps manually after running `npm run dev`:

- [ ] **Register** — go to `/register`, create a new account, confirm redirect to `/dashboard`
- [ ] **Login** — log out, go to `/login`, sign in with the same credentials, confirm redirect to `/dashboard`
- [ ] **Wrong password** — attempt login with an incorrect password; confirm the error message does not reveal whether the email exists
- [ ] **Create a project** — click "New Project" on the dashboard, fill in name and optional description, confirm the project card appears in the grid
- [ ] **Create a task** — open the project, click "New Task", fill in title and set a priority; confirm the task appears in the list
- [ ] **Filter by status** — click "To Do", "In Progress", and "Done" filter buttons; confirm only matching tasks are shown
- [ ] **Filter by priority** — click "HIGH", "MEDIUM", "LOW"; confirm filtering works independently and in combination with status filters
- [ ] **Clear filters** — when no tasks match, click "Clear filters"; confirm all tasks return
- [ ] **Toggle task status** — click the status cycle button on a task; confirm it moves TODO → IN_PROGRESS → DONE → TODO optimistically and persists on reload
- [ ] **Delete a task** — click "Delete" on a task; confirm it disappears immediately
- [ ] **Ownership isolation** — register a second account in a private/incognito window; attempt to access the first user's project URL directly (e.g. `/projects/<id>`); confirm a 404 or redirect, not the project data
- [ ] **Run tests** — `npm test` should report 41 tests passing across 4 suites with no failures

## Known Limitations

- **No rate limiting** on `/api/auth/login` or `/api/auth/register`. Brute-force protection requires an external layer (reverse proxy, Vercel edge config, or a Redis-backed counter) and is not implemented.
- **Open registration.** Any visitor can create an account. No invite gate exists.
- **Stateless JWT, no revocation.** Logout clears the cookie but cannot invalidate the token. A captured token remains valid for up to 7 days.
- **No `Secure` cookie flag.** Should be added for any production deployment served over HTTPS.
