import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

const PAGE_PATHS = ['/dashboard', '/projects'];
const API_PATHS = ['/api/projects', '/api/tasks'];

function isProtected(pathname: string): { type: 'page' | 'api' } | null {
  if (API_PATHS.some(p => pathname.startsWith(p))) return { type: 'api' };
  if (PAGE_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) return { type: 'page' };
  return null;
}

export async function middleware(req: NextRequest) {
  const match = isProtected(req.nextUrl.pathname);
  if (!match) return NextResponse.next();

  const token = req.cookies.get('token')?.value;

  if (!token) {
    if (match.type === 'api') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    await verifyToken(token);
    return NextResponse.next();
  } catch {
    if (match.type === 'api') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: [
    '/dashboard',
    '/projects',
    '/projects/:path*',
    '/api/projects',
    '/api/projects/:path*',
    '/api/tasks',
    '/api/tasks/:path*',
  ],
};
