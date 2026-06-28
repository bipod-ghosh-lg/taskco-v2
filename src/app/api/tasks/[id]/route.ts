import { getSession } from '@/lib/session';
import { updateTaskSchema } from '@/schemas/task-schemas';
import { updateTask, deleteTask } from '@/services/task.service';
import { success, failure, validationError } from '@/lib/api-response';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return failure('Unauthorized', 401);

  const { id } = await params;
  const body = await req.json();

  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    const details = parsed.error.issues.map(i => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    return validationError(details);
  }

  const task = await updateTask(id, session.sub, parsed.data);
  if (!task) return failure('Not found', 404);

  return success({ task });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return failure('Unauthorized', 401);

  const { id } = await params;
  const result = await deleteTask(id, session.sub);
  if (!result) return failure('Not found', 404);

  return success({ deleted: true });
}
