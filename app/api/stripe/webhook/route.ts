// app/api/stripe/webhook/route.ts
import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '../../../../lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function toDate(unix?: number | null) {
  return unix ? new Date(unix * 1000) : null;
}

export async function POST(req: NextRequest) {
  const signingSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const sk = process.env.STRIPE_SECRET_KEY;
  if (!signingSecret || !sk) {
    return new Response('Missing Stripe env', { status: 400 });
  }

  const stripe = new Stripe(sk);
  const sig = req.headers.get('stripe-signature') || '';
  const buf = Buffer.from(await req.arrayBuffer());

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, signingSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err?.message || err);
    return new Response(`Webhook Error: ${err?.message || 'bad signature'}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = String(session.customer || '');
        const subId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id;

        let status: Stripe.Subscription.Status | undefined;
        let periodEnd: Date | null = null;

        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          status = sub.status;
          // cast a any por types estrictos
          const cpe = (sub as any)?.current_period_end as number | undefined;
          periodEnd = cpe ? new Date(cpe * 1000) : null;
        }

        if (customerId) {
          await prisma.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: {
              stripeStatus: status || 'active',
              stripeCurrentPeriodEnd: periodEnd ?? undefined,
            },
          });
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = String(sub.customer);
        const status = sub.status; // active, trialing, past_due, canceled, etc.

        const cpe = (sub as any)?.current_period_end as number | undefined;
        const periodEnd = cpe ? new Date(cpe * 1000) : null;

        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            stripeStatus: status,
            stripeCurrentPeriodEnd: periodEnd ?? undefined,
          },
        });
        break;
      }

      default:
        // otros eventos no usados
        break;
    }
  } catch (e) {
    console.error('Webhook handler error:', e);
    return new Response('handler error', { status: 500 });
  }

  return new Response('ok', { status: 200 });
}
