import { getSession } from '@/lib/session';
import { createProjectSchema } from '@/schemas/project-schemas';
import { listProjects, createProject } from '@/services/project.service';
import { success, failure, validationError } from '@/lib/api-response';

export async function GET() {
  const session = await getSession();
  if (!session) return failure('Unauthorized', 401);

  const projects = await listProjects(session.sub);
  return success({ projects });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return failure('Unauthorized', 401);

  const body = await req.json();

  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    const details = parsed.error.issues.map(i => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    return validationError(details);
  }

  const project = await createProject(session.sub, parsed.data);
  return success({ project }, 201);
}
