/**
 * Project ownership tests — route handlers called directly, service layer mocked.
 * Verifies that User B cannot read, update, or delete User A's projects.
 * @jest-environment node
 */

jest.mock('@/lib/auth', () => ({
  signToken: jest.fn().mockResolvedValue('mock.jwt.token'),
  verifyToken: jest.fn(),
}));

jest.mock('@/lib/session', () => ({
  getSession: jest.fn(),
}));

jest.mock('@/services/project.service', () => ({
  createProject: jest.fn(),
  listProjects: jest.fn(),
  getProject: jest.fn(),
  updateProject: jest.fn(),
  deleteProject: jest.fn(),
}));

jest.mock('@/db/queries/users', () => ({
  getUserByEmail: jest.fn(),
  createUser: jest.fn(),
  getUserById: jest.fn(),
}));

import { POST as createProjectRoute, GET as listProjectsRoute } from '@/app/api/projects/route';
import {
  GET as getProject,
  PATCH as patchProject,
  DELETE as deleteProject,
} from '@/app/api/projects/[id]/route';
import { getSession } from '@/lib/session';
import {
  createProject,
  listProjects,
  getProject as getProjectService,
  updateProject,
  deleteProject as deleteProjectService,
} from '@/services/project.service';
import { createUser, getUserByEmail } from '@/db/queries/users';

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockListProjects = listProjects as jest.MockedFunction<typeof listProjects>;
const mockGetProject = getProjectService as jest.MockedFunction<typeof getProjectService>;
const mockUpdateProject = updateProject as jest.MockedFunction<typeof updateProject>;
const mockDeleteProject = deleteProjectService as jest.MockedFunction<typeof deleteProjectService>;
const mockCreateProject = createProject as jest.MockedFunction<typeof createProject>;
const mockCreateUser = createUser as jest.MockedFunction<typeof createUser>;
const mockGetUserByEmail = getUserByEmail as jest.MockedFunction<typeof getUserByEmail>;

// ── fixtures ──────────────────────────────────────────────────────────────────

const NOW = new Date();

const USER_A = { id: 'user-a-id', email: 'usera@example.com', name: 'User A', createdAt: NOW, updatedAt: NOW };
const USER_B = { id: 'user-b-id', email: 'userb@example.com', name: 'User B', createdAt: NOW, updatedAt: NOW };

const PROJECT_A = {
  id: 'project-a-id',
  userId: USER_A.id,
  name: 'Alpha Project',
  description: null,
  color: '#3b82f6',
  createdAt: NOW,
  updatedAt: NOW,
};

function makePostRequest(url: string, body: unknown) {
  return new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeIdRequest(method: string, id: string, body?: unknown) {
  return new Request(`http://localhost/api/projects/${id}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

// ── setup: User A registers and creates a project ────────────────────────────

beforeAll(async () => {
  // Register User A
  mockGetUserByEmail.mockResolvedValue(null);
  mockCreateUser.mockResolvedValue(USER_A);
  const { POST: reg } = await import('@/app/api/auth/register/route');
  await reg(makePostRequest('http://localhost/api/auth/register', {
    email: USER_A.email, name: USER_A.name, password: 'Secret1234!',
  }));

  // Register User B
  mockGetUserByEmail.mockResolvedValue(null);
  mockCreateUser.mockResolvedValue(USER_B);
  await reg(makePostRequest('http://localhost/api/auth/register', {
    email: USER_B.email, name: USER_B.name, password: 'Secret1234!',
  }));

  // User A creates a project
  mockGetSession.mockResolvedValue({ sub: USER_A.id, email: USER_A.email });
  mockCreateProject.mockResolvedValue(PROJECT_A);
  await createProjectRoute(makePostRequest('http://localhost/api/projects', { name: PROJECT_A.name }));
});

beforeEach(() => jest.clearAllMocks());

// ── ownership tests ───────────────────────────────────────────────────────────

describe('Project ownership isolation', () => {
  it("User B's project list is empty", async () => {
    mockGetSession.mockResolvedValue({ sub: USER_B.id, email: USER_B.email });
    mockListProjects.mockResolvedValue([]);

    const res = await listProjectsRoute();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.projects).toHaveLength(0);
    expect(mockListProjects).toHaveBeenCalledWith(USER_B.id);
  });

  it('User B gets 404 on GET /projects/:id for User A project', async () => {
    mockGetSession.mockResolvedValue({ sub: USER_B.id, email: USER_B.email });
    mockGetProject.mockResolvedValue(null);

    const res = await getProject(
      makeIdRequest('GET', PROJECT_A.id),
      { params: Promise.resolve({ id: PROJECT_A.id }) },
    );

    expect(res.status).toBe(404);
    expect(mockGetProject).toHaveBeenCalledWith(PROJECT_A.id, USER_B.id);
  });

  it('User B gets 404 on PATCH /projects/:id for User A project', async () => {
    mockGetSession.mockResolvedValue({ sub: USER_B.id, email: USER_B.email });
    mockUpdateProject.mockResolvedValue(null);

    const res = await patchProject(
      makeIdRequest('PATCH', PROJECT_A.id, { name: 'Hijacked' }),
      { params: Promise.resolve({ id: PROJECT_A.id }) },
    );

    expect(res.status).toBe(404);
    expect(mockUpdateProject).toHaveBeenCalledWith(PROJECT_A.id, USER_B.id, { name: 'Hijacked' });
  });

  it('User B gets 404 on DELETE /projects/:id for User A project', async () => {
    mockGetSession.mockResolvedValue({ sub: USER_B.id, email: USER_B.email });
    mockDeleteProject.mockResolvedValue(null);

    const res = await deleteProject(
      makeIdRequest('DELETE', PROJECT_A.id),
      { params: Promise.resolve({ id: PROJECT_A.id }) },
    );

    expect(res.status).toBe(404);
    expect(mockDeleteProject).toHaveBeenCalledWith(PROJECT_A.id, USER_B.id);
  });
});
