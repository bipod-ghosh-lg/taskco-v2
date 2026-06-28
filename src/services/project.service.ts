import prisma from '@/lib/db';
import type { CreateProjectInput, UpdateProjectInput } from '@/schemas/project-schemas';

export async function listProjects(userId: string) {
  return prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createProject(userId: string, data: CreateProjectInput) {
  return prisma.project.create({
    data: {
      userId,
      name: data.name,
      description: data.description,
      ...(data.color ? { color: data.color } : {}),
    },
  });
}

export async function getProject(id: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id, userId },
    include: { _count: { select: { tasks: true } } },
  });
  if (!project) return null;

  const { _count, ...rest } = project;
  return { project: rest, taskCount: _count.tasks };
}

export async function updateProject(id: string, userId: string, data: UpdateProjectInput) {
  const existing = await prisma.project.findFirst({ where: { id, userId } });
  if (!existing) return null;
  return prisma.project.update({ where: { id }, data });
}

export async function deleteProject(id: string, userId: string) {
  const existing = await prisma.project.findFirst({ where: { id, userId } });
  if (!existing) return null;
  await prisma.project.delete({ where: { id } });
  return true;
}
