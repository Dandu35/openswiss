// app/api/stripe/checkout/route.ts
import { NextRequest } from 'next/server';
import Stripe from 'stripe';

export const runtime = 'nodejs'; // Stripe SDK necesita Node.js

function baseUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  );
}

async function createSession() {
  const secret = process.env.STRIPE_SECRET_KEY;
  const price  = process.env.STRIPE_PRICE_ID_MONTHLY;
  if (!secret || !price) {
    throw new Error('Faltan STRIPE_SECRET_KEY o STRIPE_PRICE_ID_MONTHLY');
  }
  const stripe = new Stripe(secret); // usa versión del SDK
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${baseUrl()}/api/stripe/confirm?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl()}/#precios`,
  });
  if (!session.url) throw new Error('Stripe no devolvió URL de checkout');
  return session.url;
}

// Redirección directa (lo más simple)
export async function GET(_req: NextRequest) {
  try {
    const url = await createSession();
    const headers = new Headers();
    headers.set('Location', url);
    return new Response(null, { status: 303, headers });
  } catch (e: any) {
    console.error('Stripe checkout GET error:', e?.message || e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Soporte para POST (si algún cliente lo usa)
export async function POST(_req: NextRequest) {
  try {
    const url = await createSession();
    return new Response(JSON.stringify({ url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('Stripe checkout POST error:', e?.message || e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
