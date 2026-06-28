import sql from '@/lib/db';
import { User } from '@/types';

export async function createUser(
  email: string,
  name: string,
  passwordHash: string,
): Promise<User> {
  const rows = await sql`
    INSERT INTO users (email, name, password)
    VALUES (${email}, ${name}, ${passwordHash})
    RETURNING id, email, name, created_at, updated_at
  `;
  return rows[0] as User;
}

export async function getUserByEmail(
  email: string,
): Promise<(User & { password: string }) | null> {
  const rows = await sql`
    SELECT id, email, name, password, created_at, updated_at
    FROM users
    WHERE email = ${email}
  `;
  return (rows[0] as User & { password: string }) ?? null;
}

export async function getUserById(id: string): Promise<User | null> {
  const rows = await sql`
    SELECT id, email, name, created_at, updated_at
    FROM users
    WHERE id = ${id}
  `;
  return (rows[0] as User) ?? null;
}
