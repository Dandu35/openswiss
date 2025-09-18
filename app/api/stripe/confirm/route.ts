import { NextRequest } from 'next/server';
import Stripe from 'stripe';

export async function GET(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const url = new URL(req.url);
  const sessionId = url.searchParams.get('session_id');
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  if (!secret || !sessionId) return redirectWithCookie(base, null, 'Faltan datos');

  const stripe = new Stripe(secret, { apiVersion: '2024-06-20' });
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const ok = session.status === 'complete' || session.payment_status === 'paid';

  return redirectWithCookie(base, ok ? '1' : null);
}

function redirectWithCookie(base: string, pro: string | null, msg?: string) {
  const headers = new Headers();
  headers.set('Location', `${base}${msg ? `/?msg=${encodeURIComponent(msg)}` : '/'}`);
  if (pro) {
    const maxAge = 60 * 60 * 24 * 35; // 35 días
    headers.append('Set-Cookie', `os_pro=${pro}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Lax; Secure`);
  }
  return new Response(null, { status: 302, headers });
}

