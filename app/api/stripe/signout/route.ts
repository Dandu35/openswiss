import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

function baseFromReq(req: NextRequest) {
  const host = req.headers.get('host') || 'localhost:3000';
  const proto = (req.headers.get('x-forwarded-proto') || 'https').split(',')[0];
  return `${proto}://${host}`;
}

function delCookie(name: string, isProd: boolean) {
  const attrs = `Path=/; HttpOnly; SameSite=Lax${isProd ? '; Secure' : ''}`;
  return `${name}=; Max-Age=0; ${attrs}`;
}

export async function GET(req: NextRequest) {
  const base = baseFromReq(req);
  const isProd = process.env.NODE_ENV === 'production';
  const headers = new Headers();
  headers.append('Set-Cookie', delCookie('os_pro', isProd));
  headers.append('Set-Cookie', delCookie('os_cust', isProd));
  headers.append('Set-Cookie', delCookie('os_sub', isProd));
  headers.set('Location', base);
  return new Response(null, { status: 302, headers });
}
