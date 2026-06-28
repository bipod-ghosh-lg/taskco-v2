import { getSession } from '@/lib/session';
import { createTaskSchema, taskFilterSchema } from '@/schemas/task-schemas';
import { createTask, getTasksByProject } from '@/services/task.service';
import { success, failure, validationError } from '@/lib/api-response';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return failure('Unauthorized', 401);

  const { id: projectId } = await params;
  const body = await req.json();

  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    const details = parsed.error.issues.map(i => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    return validationError(details);
  }

  const task = await createTask(projectId, session.sub, parsed.data);
  if (!task) return failure('Not found', 404);

  return success({ task }, 201);
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return failure('Unauthorized', 401);

  const { id: projectId } = await params;
  const url = new URL(req.url);

  const parsedFilters = taskFilterSchema.safeParse({
    status: url.searchParams.get('status') ?? undefined,
    priority: url.searchParams.get('priority') ?? undefined,
  });
  if (!parsedFilters.success) {
    const details = parsedFilters.error.issues.map(i => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    return validationError(details);
  }

  const tasks = await getTasksByProject(projectId, session.sub, parsedFilters.data);
  if (tasks === null) return failure('Not found', 404);

  return success({ tasks });
}
