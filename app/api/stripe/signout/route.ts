import { NextRequest } from 'next/server';

export async function GET(_req: NextRequest) {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  const headers = new Headers();
  headers.set('Location', base);
  // Expira cookies
  ['os_pro', 'os_cust', 'os_sub'].forEach(name => {
    headers.append('Set-Cookie', `${name}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax; Secure`);
  });
  return new Response(null, { status: 302, headers });
}
