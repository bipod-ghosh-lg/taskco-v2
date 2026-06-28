import { success } from '@/lib/api-response';

export async function POST() {
  const response = success({ ok: true });
  response.headers.set(
    'Set-Cookie',
    'token=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0',
  );
  return response;
}
