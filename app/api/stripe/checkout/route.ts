import { NextRequest } from 'next/server';
import Stripe from 'stripe';

export const runtime = 'nodejs'; // Stripe SDK requiere Node

function safeBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || 'http://localhost:3000';
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}
function successUrl() {
  const u = new URL('/api/stripe/confirm', safeBaseUrl());
  u.searchParams.set('session_id', '{CHECKOUT_SESSION_ID}');
  return u.toString();
}
function cancelUrl() {
  const u = new URL(safeBaseUrl());
  u.hash = 'precios';
  return u.toString();
}

async function createSession() {
  const secret = process.env.STRIPE_SECRET_KEY;
  const price  = process.env.STRIPE_PRICE_ID_MONTHLY;
  if (!secret || !price) throw new Error('Faltan STRIPE_SECRET_KEY o STRIPE_PRICE_ID_MONTHLY');

  const stripe = new Stripe(secret);
  // Si tuvieras login/usuario, puedes pasar client_reference_id o metadata
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price, quantity: 1 }],
    allow_promotion_codes: true,
    // customer_creation: 'always', // opcional, para forzar creación de customer
    success_url: successUrl(),
    cancel_url: cancelUrl(),
  });

  if (!session.url) throw new Error('Stripe no devolvió URL de checkout');
  return session.url;
}

export async function GET(_req: NextRequest) {
  try {
    const url = await createSession();
    return Response.redirect(url, 303);
  } catch (e: any) {
    console.error('Stripe checkout GET error:', e?.message || e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function POST(_req: NextRequest) {
  try {
    const url = await createSession();
    return new Response(JSON.stringify({ url }),
      { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('Stripe checkout POST error:', e?.message || e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
