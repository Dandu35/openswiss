import { NextRequest } from 'next/server';
import Stripe from 'stripe';

export const runtime = 'nodejs';

function baseFromReq(req: NextRequest) {
  const host = req.headers.get('host') || 'localhost:3000';
  const proto = (req.headers.get('x-forwarded-proto') || 'https').split(',')[0];
  return `${proto}://${host}`;
}

function redirect(base: string, msg?: string, cookies: string[] = []) {
  const headers = new Headers();
  headers.set('Location', msg ? `${base}/?msg=${encodeURIComponent(msg)}` : base);
  cookies.forEach(c => headers.append('Set-Cookie', c));
  return new Response(null, { status: 302, headers });
}

function cookie(name: string, value: string, maxAgeSec: number, isProd: boolean) {
  const attrs = `Path=/; HttpOnly; SameSite=Lax${isProd ? '; Secure' : ''}`;
  return `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeSec}; ${attrs}`;
}

export async function GET(req: NextRequest) {
  const base = baseFromReq(req);
  const secret = process.env.STRIPE_SECRET_KEY || '';
  const url = new URL(req.url);
  const sessionId = url.searchParams.get('session_id') || '';

  // Validaciones tempranas
  if (!secret) return redirect(base, 'Falta STRIPE_SECRET_KEY');
  if (!sessionId) return redirect(base, 'Falta session_id');

  // Chequeo de modo (diagnóstico útil)
  const isLiveKey = secret.startsWith('sk_live_');
  const isTestKey = secret.startsWith('sk_test_');
  const isTestSession = sessionId.startsWith('cs_test_');
  const isLiveSession = sessionId.startsWith('cs_live_');
  if ((isTestSession && !isTestKey) || (isLiveSession && !isLiveKey)) {
    const msg = isTestSession
      ? 'Sesión TEST con clave LIVE. Usa sk_test_* y price de test.'
      : 'Sesión LIVE con clave TEST. Usa sk_live_* y price live.';
    return redirect(base, msg);
  }

  try {
    const stripe = new Stripe(secret);
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });

    // Éxito de checkout
    const ok =
      session.status === 'complete' ||
      session.payment_status === 'paid' ||
      session.payment_status === 'no_payment_required'; // por si hay trial

    if (!ok) return redirect(base, 'Pago no completado');

    const customerId =
      typeof session.customer === 'string' ? session.customer : session.customer?.id || '';
    const subscriptionId =
      typeof session.subscription === 'string' ? session.subscription : session.subscription?.id || '';

    const maxAge = 60 * 60 * 24 * 35;
    const isProd = process.env.NODE_ENV === 'production';
    const cookies: string[] = [
      cookie('os_pro', '1', maxAge, isProd),
    ];
    if (customerId) cookies.push(cookie('os_cust', customerId, maxAge, isProd));
    if (subscriptionId) cookies.push(cookie('os_sub', subscriptionId, maxAge, isProd));

    return redirect(base, 'pro=1', cookies);
  } catch (e: any) {
    // Mostrar el mensaje real de Stripe en la query para depurar
    const rawMsg = e?.raw?.message || e?.message || 'Error verificando sesión de pago';
    console.error('Stripe confirm error:', rawMsg);
    return redirect(base, rawMsg);
  }
}
