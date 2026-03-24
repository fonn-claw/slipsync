import { describe, it, expect } from 'vitest';

// Extract the pure role-checking logic from middleware for unit testing.
// The actual middleware depends on Next.js runtime, so we test the logic directly.

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

type MiddlewareResult =
  | { action: 'next' }
  | { action: 'redirect'; url: string };

function checkRouteAccess(
  pathname: string,
  session: { isLoggedIn: boolean; role?: string } | null,
): MiddlewareResult {
  // Public routes
  if (
    pathname === '/login' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico'
  ) {
    return { action: 'next' };
  }

  // Not logged in -> login
  if (!session || !session.isLoggedIn) {
    return { action: 'redirect', url: '/login' };
  }

  // Redirect root to role landing
  if (pathname === '/') {
    return {
      action: 'redirect',
      url: roleLandings[session.role!] || '/login',
    };
  }

  // Role check
  for (const [prefix, allowedRoles] of Object.entries(roleRoutes)) {
    if (pathname.startsWith(prefix)) {
      if (!allowedRoles.includes(session.role!)) {
        return {
          action: 'redirect',
          url: roleLandings[session.role!] || '/login',
        };
      }
    }
  }

  return { action: 'next' };
}

describe('Middleware Route Protection', () => {
  it('unauthenticated request to /admin/dashboard redirects to /login', () => {
    const result = checkRouteAccess('/admin/dashboard', null);
    expect(result).toEqual({ action: 'redirect', url: '/login' });
  });

  it('unauthenticated request to /staff/operations redirects to /login', () => {
    const result = checkRouteAccess('/staff/operations', {
      isLoggedIn: false,
    });
    expect(result).toEqual({ action: 'redirect', url: '/login' });
  });

  it('boater accessing /admin/dashboard redirects to /boater/my-bookings', () => {
    const result = checkRouteAccess('/admin/dashboard', {
      isLoggedIn: true,
      role: 'boater',
    });
    expect(result).toEqual({
      action: 'redirect',
      url: '/boater/my-bookings',
    });
  });

  it('dock_staff accessing /admin/dashboard redirects to /staff/operations', () => {
    const result = checkRouteAccess('/admin/dashboard', {
      isLoggedIn: true,
      role: 'dock_staff',
    });
    expect(result).toEqual({
      action: 'redirect',
      url: '/staff/operations',
    });
  });

  it('admin accessing /admin/dashboard passes through', () => {
    const result = checkRouteAccess('/admin/dashboard', {
      isLoggedIn: true,
      role: 'admin',
    });
    expect(result).toEqual({ action: 'next' });
  });

  it('staff accessing /staff/operations passes through', () => {
    const result = checkRouteAccess('/staff/operations', {
      isLoggedIn: true,
      role: 'dock_staff',
    });
    expect(result).toEqual({ action: 'next' });
  });

  it('admin accessing /staff/operations passes through (admin has access everywhere)', () => {
    const result = checkRouteAccess('/staff/operations', {
      isLoggedIn: true,
      role: 'admin',
    });
    expect(result).toEqual({ action: 'next' });
  });

  it('boater accessing /boater/my-bookings passes through', () => {
    const result = checkRouteAccess('/boater/my-bookings', {
      isLoggedIn: true,
      role: 'boater',
    });
    expect(result).toEqual({ action: 'next' });
  });

  it('request to /login passes through without auth', () => {
    const result = checkRouteAccess('/login', null);
    expect(result).toEqual({ action: 'next' });
  });

  it('authenticated user at / redirects to role landing', () => {
    expect(
      checkRouteAccess('/', { isLoggedIn: true, role: 'admin' }),
    ).toEqual({ action: 'redirect', url: '/admin/dashboard' });

    expect(
      checkRouteAccess('/', { isLoggedIn: true, role: 'dock_staff' }),
    ).toEqual({ action: 'redirect', url: '/staff/operations' });

    expect(
      checkRouteAccess('/', { isLoggedIn: true, role: 'boater' }),
    ).toEqual({ action: 'redirect', url: '/boater/my-bookings' });
  });

  it('dock_staff cannot access /boater routes', () => {
    const result = checkRouteAccess('/boater/my-bookings', {
      isLoggedIn: true,
      role: 'dock_staff',
    });
    expect(result).toEqual({
      action: 'redirect',
      url: '/staff/operations',
    });
  });

  it('boater cannot access /staff routes', () => {
    const result = checkRouteAccess('/staff/operations', {
      isLoggedIn: true,
      role: 'boater',
    });
    expect(result).toEqual({
      action: 'redirect',
      url: '/boater/my-bookings',
    });
  });
});
