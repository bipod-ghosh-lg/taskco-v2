/**
 * Task route tests — route handlers called directly, DB and auth mocked.
 * @jest-environment node
 */

jest.mock('@/lib/auth', () => ({
  signToken: jest.fn().mockResolvedValue('mock.jwt.token'),
  verifyToken: jest.fn(),
}));

jest.mock('@/lib/session', () => ({
  getSession: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    task: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    project: {
      findFirst: jest.fn(),
    },
  },
}));

import { POST as createTaskRoute, GET as listTasksRoute } from '@/app/api/projects/[id]/tasks/route';
import { PATCH as patchTaskRoute, DELETE as deleteTaskRoute } from '@/app/api/tasks/[id]/route';
import { getSession } from '@/lib/session';
import prisma from '@/lib/db';

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockProjectFindFirst = prisma.project.findFirst as jest.MockedFunction<typeof prisma.project.findFirst>;
const mockTaskCreate = prisma.task.create as jest.MockedFunction<typeof prisma.task.create>;
const mockTaskFindMany = prisma.task.findMany as jest.MockedFunction<typeof prisma.task.findMany>;
const mockTaskFindFirst = prisma.task.findFirst as jest.MockedFunction<typeof prisma.task.findFirst>;
const mockTaskUpdate = prisma.task.update as jest.MockedFunction<typeof prisma.task.update>;
const mockTaskDelete = prisma.task.delete as jest.MockedFunction<typeof prisma.task.delete>;

// ── fixtures ──────────────────────────────────────────────────────────────────

const NOW = new Date();
const SESSION_A = { sub: 'user-a-id', email: 'usera@example.com' };
const SESSION_B = { sub: 'user-b-id', email: 'userb@example.com' };

const FAKE_PROJECT = {
  id: 'project-a-id',
  userId: 'user-a-id',
  name: 'Project A',
  description: null,
  color: '#3b82f6',
  createdAt: NOW,
  updatedAt: NOW,
};

const FAKE_TASK = {
  id: 'task-id-1',
  projectId: 'project-a-id',
  userId: 'user-a-id',
  title: 'Fix the bug',
  description: null,
  status: 'TODO' as const,
  priority: 'MEDIUM' as const,
  dueDate: null,
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

function makeGetRequest(url: string) {
  return new Request(url, { method: 'GET' });
}

function makeIdRequest(method: string, id: string, body?: unknown) {
  return new Request(`http://localhost/api/tasks/${id}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

const PROJECT_PARAMS = (id = 'project-a-id') => ({ params: Promise.resolve({ id }) });
const TASK_PARAMS = (id = 'task-id-1') => ({ params: Promise.resolve({ id }) });

beforeEach(() => jest.clearAllMocks());

// ── POST /api/projects/:id/tasks ──────────────────────────────────────────────

describe('POST /api/projects/:id/tasks', () => {
  it('201: creates a task and returns correct shape', async () => {
    mockGetSession.mockResolvedValue(SESSION_A);
    mockProjectFindFirst.mockResolvedValue(FAKE_PROJECT);
    mockTaskCreate.mockResolvedValue(FAKE_TASK);

    const res = await createTaskRoute(
      makePostRequest('http://localhost/api/projects/project-a-id/tasks', { title: 'Fix the bug' }),
      PROJECT_PARAMS(),
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.data.task).toMatchObject({ id: 'task-id-1', title: 'Fix the bug', status: 'TODO', priority: 'MEDIUM' });
    expect(body.data.task).toHaveProperty('createdAt');
  });

  it('422: missing title returns validation error', async () => {
    mockGetSession.mockResolvedValue(SESSION_A);

    const res = await createTaskRoute(
      makePostRequest('http://localhost/api/projects/project-a-id/tasks', { description: 'No title here' }),
      PROJECT_PARAMS(),
    );
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body.details.some((d: { field: string }) => d.field === 'title')).toBe(true);
  });

  it('422: invalid status value returns validation error', async () => {
    mockGetSession.mockResolvedValue(SESSION_A);

    const res = await createTaskRoute(
      makePostRequest('http://localhost/api/projects/project-a-id/tasks', { title: 'Task', status: 'INVALID' }),
      PROJECT_PARAMS(),
    );

    expect(res.status).toBe(422);
  });

  it('401: unauthenticated request returns 401', async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await createTaskRoute(
      makePostRequest('http://localhost/api/projects/project-a-id/tasks', { title: 'Task' }),
      PROJECT_PARAMS(),
    );

    expect(res.status).toBe(401);
  });

  it('404: task on another user\'s project returns 404', async () => {
    mockGetSession.mockResolvedValue(SESSION_B);
    mockProjectFindFirst.mockResolvedValue(null);

    const res = await createTaskRoute(
      makePostRequest('http://localhost/api/projects/project-a-id/tasks', { title: 'Hijack' }),
      PROJECT_PARAMS(),
    );

    expect(res.status).toBe(404);
  });
});

// ── GET /api/projects/:id/tasks ───────────────────────────────────────────────

describe('GET /api/projects/:id/tasks', () => {
  it('200: returns all tasks with no filters', async () => {
    mockGetSession.mockResolvedValue(SESSION_A);
    mockProjectFindFirst.mockResolvedValue(FAKE_PROJECT);
    mockTaskFindMany.mockResolvedValue([FAKE_TASK]);

    const res = await listTasksRoute(
      makeGetRequest('http://localhost/api/projects/project-a-id/tasks'),
      PROJECT_PARAMS(),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.tasks).toHaveLength(1);
    expect(body.data.tasks[0]).toMatchObject({ id: 'task-id-1' });
  });

  it('200: ?status=TODO returns only TODO tasks', async () => {
    mockGetSession.mockResolvedValue(SESSION_A);
    mockProjectFindFirst.mockResolvedValue(FAKE_PROJECT);
    mockTaskFindMany.mockResolvedValue([FAKE_TASK]);

    const res = await listTasksRoute(
      makeGetRequest('http://localhost/api/projects/project-a-id/tasks?status=TODO'),
      PROJECT_PARAMS(),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mockTaskFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: 'TODO' }) }),
    );
  });

  it('200: ?priority=HIGH passes HIGH priority filter', async () => {
    mockGetSession.mockResolvedValue(SESSION_A);
    mockProjectFindFirst.mockResolvedValue(FAKE_PROJECT);
    mockTaskFindMany.mockResolvedValue([]);

    const res = await listTasksRoute(
      makeGetRequest('http://localhost/api/projects/project-a-id/tasks?priority=HIGH'),
      PROJECT_PARAMS(),
    );

    expect(res.status).toBe(200);
    expect(mockTaskFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ priority: 'HIGH' }) }),
    );
  });

  it('200: ?status=TODO&priority=HIGH ANDs both filters', async () => {
    mockGetSession.mockResolvedValue(SESSION_A);
    mockProjectFindFirst.mockResolvedValue(FAKE_PROJECT);
    mockTaskFindMany.mockResolvedValue([]);

    const res = await listTasksRoute(
      makeGetRequest('http://localhost/api/projects/project-a-id/tasks?status=TODO&priority=HIGH'),
      PROJECT_PARAMS(),
    );

    expect(res.status).toBe(200);
    expect(mockTaskFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: 'TODO', priority: 'HIGH' }) }),
    );
  });

  it('404: another user\'s project returns 404', async () => {
    mockGetSession.mockResolvedValue(SESSION_B);
    mockProjectFindFirst.mockResolvedValue(null);

    const res = await listTasksRoute(
      makeGetRequest('http://localhost/api/projects/project-a-id/tasks'),
      PROJECT_PARAMS(),
    );

    expect(res.status).toBe(404);
  });
});

// ── PATCH /api/tasks/:id ──────────────────────────────────────────────────────

describe('PATCH /api/tasks/:id', () => {
  it('200: partial update returns updated task', async () => {
    mockGetSession.mockResolvedValue(SESSION_A);
    mockTaskFindFirst.mockResolvedValue(FAKE_TASK);
    mockTaskUpdate.mockResolvedValue({ ...FAKE_TASK, title: 'Updated title' });

    const res = await patchTaskRoute(
      makeIdRequest('PATCH', 'task-id-1', { title: 'Updated title' }),
      TASK_PARAMS(),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.task.title).toBe('Updated title');
  });

  it('422: invalid status value returns 422', async () => {
    mockGetSession.mockResolvedValue(SESSION_A);

    const res = await patchTaskRoute(
      makeIdRequest('PATCH', 'task-id-1', { status: 'NOT_VALID' }),
      TASK_PARAMS(),
    );

    expect(res.status).toBe(422);
  });

  it('404: another user\'s task returns 404', async () => {
    mockGetSession.mockResolvedValue(SESSION_B);
    mockTaskFindFirst.mockResolvedValue(null);

    const res = await patchTaskRoute(
      makeIdRequest('PATCH', 'task-id-1', { title: 'Hijack' }),
      TASK_PARAMS(),
    );

    expect(res.status).toBe(404);
  });

  it('401: unauthenticated request returns 401', async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await patchTaskRoute(
      makeIdRequest('PATCH', 'task-id-1', { title: 'x' }),
      TASK_PARAMS(),
    );

    expect(res.status).toBe(401);
  });
});

// ── DELETE /api/tasks/:id ─────────────────────────────────────────────────────

describe('DELETE /api/tasks/:id', () => {
  it('200: returns { data: { deleted: true } }', async () => {
    mockGetSession.mockResolvedValue(SESSION_A);
    mockTaskFindFirst.mockResolvedValue(FAKE_TASK);
    mockTaskDelete.mockResolvedValue(FAKE_TASK);

    const res = await deleteTaskRoute(
      makeIdRequest('DELETE', 'task-id-1'),
      TASK_PARAMS(),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.deleted).toBe(true);
  });

  it('404: another user\'s task returns 404', async () => {
    mockGetSession.mockResolvedValue(SESSION_B);
    mockTaskFindFirst.mockResolvedValue(null);

    const res = await deleteTaskRoute(
      makeIdRequest('DELETE', 'task-id-1'),
      TASK_PARAMS(),
    );

    expect(res.status).toBe(404);
  });

  it('401: unauthenticated request returns 401', async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await deleteTaskRoute(
      makeIdRequest('DELETE', 'task-id-1'),
      TASK_PARAMS(),
    );

    expect(res.status).toBe(401);
  });
});
