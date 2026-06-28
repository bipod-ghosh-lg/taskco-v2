import { getSession } from '@/lib/session';
import { getUserById } from '@/db/queries/users';
import { success, failure } from '@/lib/api-response';

export async function GET() {
  const session = await getSession();
  if (!session) return failure('Unauthorized', 401);

  const user = await getUserById(session.sub);
  if (!user) return failure('Not found', 404);

  return success({ id: user.id, email: user.email, name: user.name, createdAt: user.createdAt });
}
