import { getSession } from '@/lib/session';
import { updateProjectSchema } from '@/schemas/project-schemas';
import { getProject, updateProject, deleteProject } from '@/services/project.service';
import { success, failure, validationError } from '@/lib/api-response';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return failure('Unauthorized', 401);

  const { id } = await params;
  const result = await getProject(id, session.sub);
  if (!result) return failure('Not found', 404);

  return success({ project: result.project, taskCount: result.taskCount });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return failure('Unauthorized', 401);

  const { id } = await params;
  const body = await req.json();

  const parsed = updateProjectSchema.safeParse(body);
  if (!parsed.success) {
    const details = parsed.error.issues.map(i => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    return validationError(details);
  }

  const project = await updateProject(id, session.sub, parsed.data);
  if (!project) return failure('Not found', 404);

  return success({ project });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return failure('Unauthorized', 401);

  const { id } = await params;
  const result = await deleteProject(id, session.sub);
  if (!result) return failure('Not found', 404);

  return success({ deleted: true });
}
