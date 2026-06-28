'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector } from '@/store/hooks';
import Button from '@/components/ui/Button';

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
}

export default function Navbar() {
  const router = useRouter();
  const user = useAppSelector(state => state.auth.user);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    router.push('/login');
  }

  return (
    <nav className="border-b border-border bg-surface">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="text-lg font-semibold text-heading">
          TaskCo
        </Link>

        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
                {initials(user.name)}
              </div>
              <span className="text-sm font-medium text-subtle">{user.name}</span>
            </div>
          )}
          <Button variant="secondary" onClick={handleLogout} className="py-1.5 text-xs">
            Sign out
          </Button>
        </div>
      </div>
    </nav>
  );
}
