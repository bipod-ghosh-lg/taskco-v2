import { compare } from 'bcryptjs';
import { loginSchema } from '@/schemas/auth-schemas';
import { getUserByEmail } from '@/db/queries/users';
import { signToken } from '@/lib/auth';
import { success, failure, validationError } from '@/lib/api-response';

export async function POST(req: Request) {
  const body = await req.json();

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    const details = parsed.error.issues.map(i => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    return validationError(details);
  }

  const { email, password } = parsed.data;

  const userWithPassword = await getUserByEmail(email);
  if (!userWithPassword) return failure('Invalid email or password', 401);

  const valid = await compare(password, userWithPassword.password);
  if (!valid) return failure('Invalid email or password', 401);

  const { password: _, ...user } = userWithPassword;
  const token = await signToken({ sub: user.id, email: user.email });

  const response = success({ token, user });
  response.headers.set(
    'Set-Cookie',
    `token=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800`,
  );
  return response;
}
