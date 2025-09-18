import { NextRequest } from 'next/server';
import Stripe from 'stripe';

export const runtime = 'nodejs';

function safeBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || 'http://localhost:3000';
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

export async function GET(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const url = new URL(req.url);
  const sessionId = url.searchParams.get('session_id');
  const base = safeBaseUrl();

  if (!secret || !sessionId) {
    return redirectWithCookies(base, { msg: 'Faltan datos de Stripe' });
  }

  const stripe = new Stripe(secret);

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });

    const statusOk = session.status === 'complete' || session.payment_status === 'paid';
    const customerId =
      typeof session.customer === 'string' ? session.customer : session.customer?.id || null;
    const subscriptionId =
      typeof session.subscription === 'string' ? session.subscription : session.subscription?.id || null;

    if (!statusOk) {
      return redirectWithCookies(base, { msg: 'Pago no completado' });
    }

    // Cookies Pro + customer + subscription (35 días)
    const maxAge = 60 * 60 * 24 * 35;
    const cookies: string[] = [
      cookie('os_pro', '1', maxAge),
    ];
    if (customerId) cookies.push(cookie('os_cust', customerId, maxAge));
    if (subscriptionId) cookies.push(cookie('os_sub', subscriptionId, maxAge));

    const headers = new Headers();
    headers.set('Location', `${base}/?pro=1`);
    cookies.forEach(c => headers.append('Set-Cookie', c));
    return new Response(null, { status: 302, headers });
  } catch (e: any) {
    console.error('Stripe confirm error:', e?.message || e);
    return redirectWithCookies(base, { msg: 'Error verificando sesión de pago' });
  }
}

function cookie(name: string, value: string, maxAgeSec: number) {
  return `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeSec}; Path=/; HttpOnly; SameSite=Lax; Secure`;
}

function redirectWithCookies(base: string, { msg }: { msg?: string } = {}) {
  const headers = new Headers();
  headers.set('Location', msg ? `${base}/?msg=${encodeURIComponent(msg)}` : base);
  return new Response(null, { status: 302, headers });
}
