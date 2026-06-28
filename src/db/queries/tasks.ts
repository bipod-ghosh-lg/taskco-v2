import prisma from '@/lib/db';
import type { TaskStatus, TaskPriority } from '@/generated/prisma/enums';
import type { CreateTaskInput, UpdateTaskInput } from '@/schemas/task-schemas';

export async function createTask(projectId: string, userId: string, data: CreateTaskInput) {
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { userId: true } });
  if (!project || project.userId !== userId) return null;

  return prisma.task.create({
    data: {
      projectId,
      userId,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    },
  });
}

export async function getTasksByProject(
  projectId: string,
  userId: string,
  filters?: { status?: TaskStatus; priority?: TaskPriority },
) {
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { userId: true } });
  if (!project || project.userId !== userId) return null;

  return prisma.task.findMany({
    where: {
      projectId,
      status: filters?.status,
      priority: filters?.priority,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getTaskById(id: string, userId: string) {
  const task = await prisma.task.findUnique({
    where: { id },
    include: { project: { select: { userId: true } } },
  });
  if (!task || task.project.userId !== userId) return null;
  const { project: _, ...rest } = task;
  return rest;
}

export async function updateTask(id: string, userId: string, data: UpdateTaskInput) {
  const task = await prisma.task.findUnique({
    where: { id },
    include: { project: { select: { userId: true } } },
  });
  if (!task || task.project.userId !== userId) return null;

  return prisma.task.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate !== undefined ? new Date(data.dueDate) : undefined,
    },
  });
}

export async function deleteTask(id: string, userId: string) {
  const task = await prisma.task.findUnique({
    where: { id },
    include: { project: { select: { userId: true } } },
  });
  if (!task || task.project.userId !== userId) return null;

  await prisma.task.delete({ where: { id } });
  return true;
}
