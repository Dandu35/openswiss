import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const cookies = req.headers.get('cookie') || '';
  const pro = readCookie(cookies, 'os_pro') === '1';
  const customer = readCookie(cookies, 'os_cust') || null;
  const sub = readCookie(cookies, 'os_sub') || null;

  return new Response(JSON.stringify({ pro, customer, subscription: sub }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function readCookie(header: string, name: string) {
  return header.split(';').map(s => s.trim()).find(s => s.startsWith(name + '='))?.split('=')[1] || '';
}
