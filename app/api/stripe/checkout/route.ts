import { NextRequest } from 'next/server';
import Stripe from 'stripe';

export async function POST(_req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const price  = process.env.STRIPE_PRICE_ID_MONTHLY;
  if (!secret || !price) {
    return new Response(JSON.stringify({ error: 'Faltan STRIPE_SECRET_KEY o STRIPE_PRICE_ID_MONTHLY' }), { status: 500 });
  }

  // ❌ const stripe = new Stripe(secret, { apiVersion: '2024-06-20' });
  const stripe = new Stripe(secret); // ✅ deja que el SDK use su versión por defecto

  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${base}/api/stripe/confirm?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/#precios`,
  });

  return new Response(JSON.stringify({ url: session.url }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
