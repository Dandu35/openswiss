// app/api/stripe/checkout/route.ts
import { NextRequest } from 'next/server';
import Stripe from 'stripe';

export const runtime = 'nodejs';

function baseFromReq(req: NextRequest) {
  const host = req.headers.get('host') || 'localhost:3000';
  const proto = (req.headers.get('x-forwarded-proto') || 'https').split(',')[0];
  return `${proto}://${host}`;
}

// ✅ Construir a mano para mantener {CHECKOUT_SESSION_ID} sin escapar
function successUrl(base: string) {
  return `${base}/api/stripe/confirm?session_id={CHECKOUT_SESSION_ID}`;
}

// (sin placeholder, aquí no importa)
function cancelUrl(base: string) {
  return `${base}/#precios`;
}

async function createSession(base: string) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const price  = process.env.STRIPE_PRICE_ID_MONTHLY;
  if (!secret || !price) throw new Error('Faltan STRIPE_SECRET_KEY o STRIPE_PRICE_ID_MONTHLY');

  const stripe = new Stripe(secret);
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: successUrl(base),   // 👈 ahora literal
    cancel_url: cancelUrl(base),
  });

  if (!session.url) throw new Error('Stripe no devolvió URL de checkout');
  return session.url;
}

export async function GET(req: NextRequest) {
  try {
    const url = await createSession(baseFromReq(req));
    return Response.redirect(url, 303);
  } catch (e: any) {
    console.error('Stripe checkout GET error:', e?.message || e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function POST(req: NextRequest) {
  try {
    const url = await createSession(baseFromReq(req));
    return new Response(JSON.stringify({ url }),
      { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('Stripe checkout POST error:', e?.message || e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
