import prisma from '@/lib/db';
import type { UpdateProjectInput } from '@/schemas/project-schemas';

export async function createProject(userId: string, name: string, description?: string, color?: string) {
  return prisma.project.create({
    data: { userId, name, description, ...(color ? { color } : {}) },
  });
}

export async function getProjectsByUser(userId: string) {
  return prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getProjectByIdAndUser(id: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: { _count: { select: { tasks: true } } },
  });
  if (!project || project.userId !== userId) return null;
  const { _count, ...rest } = project;
  return { project: rest, taskCount: _count.tasks };
}

export async function updateProject(id: string, userId: string, data: UpdateProjectInput) {
  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) return null;
  return prisma.project.update({ where: { id }, data });
}

export async function deleteProject(id: string, userId: string) {
  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) return null;
  await prisma.project.delete({ where: { id } });
  return true;
}
