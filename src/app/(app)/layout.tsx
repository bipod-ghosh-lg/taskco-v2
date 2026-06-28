import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import prisma from '@/lib/db';
import Navbar from '@/components/layout/Navbar';
import AuthHydrator from '@/components/providers/AuthHydrator';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, email: true, name: true },
  });
  if (!user) redirect('/login');

  return (
    <div className="min-h-full bg-gray-50">
      <AuthHydrator user={user} />
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
