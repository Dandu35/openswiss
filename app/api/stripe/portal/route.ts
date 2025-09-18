import { NextRequest } from 'next/server';
import Stripe from 'stripe';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return json(500, { error: 'Falta STRIPE_SECRET_KEY' });

  const cookies = req.headers.get('cookie') || '';
  const cust = readCookie(cookies, 'os_cust');
  if (!cust) return json(401, { error: 'No hay cliente (compra primero o vuelve a iniciar sesión)' });

  const stripe = new Stripe(secret);
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  const session = await stripe.billingPortal.sessions.create({
    customer: cust,
    return_url: base,
  });

  return Response.redirect(session.url, 303);
}

function json(status: number, body: any) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
function readCookie(header: string, name: string) {
  return header.split(';').map(s => s.trim()).find(s => s.startsWith(name + '='))?.split('=')[1] || '';
}
