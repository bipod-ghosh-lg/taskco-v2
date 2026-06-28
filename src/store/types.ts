// Serializable versions of Prisma models safe for Redux store.
// Dates are ISO strings instead of Date objects.

export interface SerializedProject {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface SerializedTask {
  id: string;
  projectId: string;
  userId: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export function serializeProject(p: {
  id: string; userId: string; name: string; description: string | null;
  color: string; createdAt: Date | string; updatedAt: Date | string;
}): SerializedProject {
  return {
    id: p.id,
    userId: p.userId,
    name: p.name,
    description: p.description,
    color: p.color,
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
    updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt,
  };
}

export function serializeTask(t: {
  id: string; projectId: string; userId: string; title: string;
  description: string | null; status: string; priority: string;
  dueDate: Date | string | null; createdAt: Date | string; updatedAt: Date | string;
}): SerializedTask {
  return {
    id: t.id,
    projectId: t.projectId,
    userId: t.userId,
    title: t.title,
    description: t.description,
    status: t.status as SerializedTask['status'],
    priority: t.priority as SerializedTask['priority'],
    dueDate: t.dueDate instanceof Date ? t.dueDate.toISOString() : t.dueDate,
    createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
    updatedAt: t.updatedAt instanceof Date ? t.updatedAt.toISOString() : t.updatedAt,
  };
}
