import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getProjectByIdAndUser } from '@/db/queries/projects';
import { getTasksByProject } from '@/db/queries/tasks';
import ProjectView from '@/components/tasks/ProjectView';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { id } = await params;

  const result = await getProjectByIdAndUser(id, session.sub);
  if (!result) notFound();

  const tasks = (await getTasksByProject(id, session.sub)) ?? [];

  return <ProjectView project={result.project} initialTasks={tasks} />;
}
