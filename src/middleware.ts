import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const authUser = process.env.AUTH_USER;
  const authPass = process.env.AUTH_PASSWORD;

  // Skip auth if credentials not configured (local dev)
  if (!authUser || !authPass) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get('authorization');

  if (authHeader) {
    const [scheme, encoded] = authHeader.split(' ');
    if (scheme === 'Basic' && encoded) {
      const decoded = atob(encoded);
      const [user, pass] = decoded.split(':');
      if (user === authUser && pass === authPass) {
        return NextResponse.next();
      }
    }
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="MapTrack Integrator"',
    },
  });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks|api/cron).*)',
  ],
};
