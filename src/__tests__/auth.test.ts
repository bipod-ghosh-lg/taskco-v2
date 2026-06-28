/**
 * Auth route tests — call Next.js route handlers directly with a mock Request.
 * DB and JWT are mocked so tests run without network or ESM dependencies.
 * @jest-environment node
 */

// Mock jose (ESM-only) before any imports that use it
jest.mock('@/lib/auth', () => ({
  signToken: jest.fn().mockResolvedValue('mock.jwt.token'),
  verifyToken: jest.fn().mockResolvedValue({ sub: 'user-123', email: 'alice@example.com' }),
}));

jest.mock('@/db/queries/users', () => ({
  getUserByEmail: jest.fn(),
  createUser: jest.fn(),
  getUserById: jest.fn(),
}));

jest.mock('@/lib/session', () => ({
  getSession: jest.fn(),
}));

import { POST as register } from '@/app/api/auth/register/route';
import { POST as login } from '@/app/api/auth/login/route';
import { GET as me } from '@/app/api/auth/me/route';
import { getUserByEmail, createUser, getUserById } from '@/db/queries/users';
import { getSession } from '@/lib/session';

const mockGetUserByEmail = getUserByEmail as jest.MockedFunction<typeof getUserByEmail>;
const mockCreateUser = createUser as jest.MockedFunction<typeof createUser>;
const mockGetUserById = getUserById as jest.MockedFunction<typeof getUserById>;
const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;

// ── helpers ───────────────────────────────────────────────────────────────────

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const NOW = new Date();
const FAKE_USER = {
  id: 'user-123',
  email: 'alice@example.com',
  name: 'Alice',
  createdAt: NOW,
  updatedAt: NOW,
};

// bcrypt hash of "secret123" (cost 4 — precomputed for speed)
const HASHED_PASSWORD = '$2b$04$W3wzapg6TmNPn8.u5LExLuJer1AhRHESRzpseYL6o9GnViEU3/pzm';

// ── register ──────────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  beforeEach(() => jest.clearAllMocks());

  it('success: returns token and user', async () => {
    mockGetUserByEmail.mockResolvedValue(null);
    mockCreateUser.mockResolvedValue(FAKE_USER);

    const res = await register(makeRequest({ email: 'alice@example.com', password: 'secret123', name: 'Alice' }));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.data.token).toBeUndefined();
    expect(body.data.user).toMatchObject({ id: 'user-123', email: 'alice@example.com', name: 'Alice' });
    expect(body.data.user).toHaveProperty('createdAt');
  });

  it('success: user object never contains password or passwordHash', async () => {
    mockGetUserByEmail.mockResolvedValue(null);
    mockCreateUser.mockResolvedValue(FAKE_USER);

    const res = await register(makeRequest({ email: 'alice@example.com', password: 'secret123', name: 'Alice' }));
    const { data } = await res.json();

    expect(data.user.password).toBeUndefined();
    expect(data.user.passwordHash).toBeUndefined();
  });

  it('success: httpOnly cookie is set', async () => {
    mockGetUserByEmail.mockResolvedValue(null);
    mockCreateUser.mockResolvedValue(FAKE_USER);

    const res = await register(makeRequest({ email: 'alice@example.com', password: 'secret123', name: 'Alice' }));

    expect(res.headers.get('set-cookie')).toMatch(/token=.+; HttpOnly/);
  });

  it('422: missing email', async () => {
    const res = await register(makeRequest({ password: 'secret123', name: 'Alice' }));
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body.error).toBeTruthy();
  });

  it('422: missing password', async () => {
    const res = await register(makeRequest({ email: 'alice@example.com', name: 'Alice' }));
    expect(res.status).toBe(422);
  });

  it('422: missing name', async () => {
    const res = await register(makeRequest({ email: 'alice@example.com', password: 'secret123' }));
    expect(res.status).toBe(422);
  });

  it('422: invalid email format — details point to email field', async () => {
    const res = await register(makeRequest({ email: 'not-an-email', password: 'secret123', name: 'Alice' }));
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body.details.some((d: { field: string }) => d.field === 'email')).toBe(true);
  });

  it('409: duplicate email', async () => {
    mockGetUserByEmail.mockResolvedValue({ ...FAKE_USER, password: HASHED_PASSWORD });

    const res = await register(makeRequest({ email: 'alice@example.com', password: 'secret123', name: 'Alice' }));
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toMatch(/registration failed/i);
  });

  it('security: password sent to createUser is hashed, not plaintext', async () => {
    mockGetUserByEmail.mockResolvedValue(null);
    mockCreateUser.mockResolvedValue(FAKE_USER);

    await register(makeRequest({ email: 'alice@example.com', password: 'secret123', name: 'Alice' }));

    // Third arg to createUser is the hash
    const storedHash = mockCreateUser.mock.calls[0][2] as string;
    expect(storedHash).not.toBe('secret123');
    expect(storedHash).toMatch(/^\$2[ab]\$/);
  });
});

// ── login ─────────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('success: returns token and user', async () => {
    mockGetUserByEmail.mockResolvedValue({ ...FAKE_USER, password: HASHED_PASSWORD });

    const res = await login(makeRequest({ email: 'alice@example.com', password: 'secret123' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.token).toBeUndefined();
    expect(body.data.user).toMatchObject({ id: 'user-123', email: 'alice@example.com', name: 'Alice' });
    expect(body.data.user).toHaveProperty('createdAt');
  });

  it('success: user object never contains password or passwordHash', async () => {
    mockGetUserByEmail.mockResolvedValue({ ...FAKE_USER, password: HASHED_PASSWORD });

    const res = await login(makeRequest({ email: 'alice@example.com', password: 'secret123' }));
    const { data } = await res.json();

    expect(data.user.password).toBeUndefined();
    expect(data.user.passwordHash).toBeUndefined();
  });

  it('401: wrong password', async () => {
    mockGetUserByEmail.mockResolvedValue({ ...FAKE_USER, password: HASHED_PASSWORD });

    const res = await login(makeRequest({ email: 'alice@example.com', password: 'wrongpassword' }));
    expect(res.status).toBe(401);
  });

  it('401: email not found', async () => {
    mockGetUserByEmail.mockResolvedValue(null);

    const res = await login(makeRequest({ email: 'nobody@example.com', password: 'secret123' }));
    expect(res.status).toBe(401);
  });

  it('422: missing email', async () => {
    const res = await login(makeRequest({ password: 'secret123' }));
    expect(res.status).toBe(422);
  });

  it('422: missing password', async () => {
    const res = await login(makeRequest({ email: 'alice@example.com' }));
    expect(res.status).toBe(422);
  });
});

// ── me ────────────────────────────────────────────────────────────────────────

describe('GET /api/auth/me', () => {
  beforeEach(() => jest.clearAllMocks());

  it('success: returns 200 with id, email, name, createdAt', async () => {
    mockGetSession.mockResolvedValue({ sub: 'user-123', email: 'alice@example.com' });
    mockGetUserById.mockResolvedValue(FAKE_USER);

    const res = await me(new Request('http://localhost/api/auth/me', { method: 'GET' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toMatchObject({ id: 'user-123', email: 'alice@example.com', name: 'Alice' });
    expect(body.data).toHaveProperty('createdAt');
  });

  it('401: getSession returns null', async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await me(new Request('http://localhost/api/auth/me', { method: 'GET' }));
    expect(res.status).toBe(401);
  });

  it('404: getUserById returns null', async () => {
    mockGetSession.mockResolvedValue({ sub: 'user-123', email: 'alice@example.com' });
    mockGetUserById.mockResolvedValue(null);

    const res = await me(new Request('http://localhost/api/auth/me', { method: 'GET' }));
    expect(res.status).toBe(404);
  });

  it('security: response data.password is undefined', async () => {
    mockGetSession.mockResolvedValue({ sub: 'user-123', email: 'alice@example.com' });
    mockGetUserById.mockResolvedValue(FAKE_USER);

    const res = await me(new Request('http://localhost/api/auth/me', { method: 'GET' }));
    const body = await res.json();

    expect(body.data.password).toBeUndefined();
  });
});
