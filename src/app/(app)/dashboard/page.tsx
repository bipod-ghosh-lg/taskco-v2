import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import ProjectList from '@/components/projects/ProjectList';

export const metadata = { title: 'Dashboard — TaskCo' };

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const projects = await prisma.project.findMany({
    where: { userId: session.sub },
    include: { _count: { select: { tasks: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-heading">Dashboard</h1>
        <p className="mt-1 text-body">All your projects in one place</p>
      </div>
      <ProjectList projects={projects} />
    </div>
  );
}
