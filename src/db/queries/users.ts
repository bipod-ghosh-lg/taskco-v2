import prisma from '@/lib/db';
import type { User } from '@/generated/prisma/client';

export async function createUser(
  email: string,
  name: string,
  passwordHash: string,
): Promise<Omit<User, 'password'>> {
  return prisma.user.create({
    data: { email, name, password: passwordHash },
    select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
  });
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}

export async function getUserById(id: string): Promise<Omit<User, 'password'> | null> {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
  });
}
