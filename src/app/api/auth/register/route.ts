import { hash } from 'bcryptjs';
import { registerSchema } from '@/schemas/auth-schemas';
import { createUser, getUserByEmail } from '@/db/queries/users';
import { signToken } from '@/lib/auth';
import { success, failure, validationError } from '@/lib/api-response';

export async function POST(req: Request) {
  const body = await req.json();

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const details = parsed.error.issues.map(i => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    return validationError(details);
  }

  const { email, password, name } = parsed.data;

  const existing = await getUserByEmail(email);
  if (existing) return failure('Email already registered', 409);

  const passwordHash = await hash(password, 12);
  const user = await createUser(email, name, passwordHash);
  const token = await signToken({ sub: user.id, email: user.email });

  const response = success({ token, user });
  response.headers.set(
    'Set-Cookie',
    `token=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800`,
  );
  return response;
}
