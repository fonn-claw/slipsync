import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import type { SessionData } from '@/lib/auth';

// Duplicate sessionOptions here because middleware runs in Edge runtime
// and cannot import from files that use cookies() from next/headers
const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'slipsync-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
  },
};

const roleRoutes: Record<string, string[]> = {
  '/admin': ['admin'],
  '/staff': ['admin', 'dock_staff'],
  '/boater': ['admin', 'boater'],
};

const roleLandings: Record<string, string> = {
  admin: '/admin/dashboard',
  dock_staff: '/staff/operations',
  boater: '/boater/my-bookings',
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes
  if (
    pathname === '/login' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const session = await getIronSession<SessionData>(
    request.cookies as any,
    sessionOptions,
  );

  // Not logged in -> login
  if (!session.isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect root to role landing
  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(roleLandings[session.role] || '/login', request.url),
    );
  }

  // Role check
  for (const [prefix, allowedRoles] of Object.entries(roleRoutes)) {
    if (pathname.startsWith(prefix)) {
      if (!allowedRoles.includes(session.role)) {
        return NextResponse.redirect(
          new URL(roleLandings[session.role] || '/login', request.url),
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
