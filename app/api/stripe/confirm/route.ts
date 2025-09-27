// app/api/stripe/confirm/route.ts
import type { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';

export const runtime = 'nodejs';

function baseFromReq(req: NextRequest) {
  const host = req.headers.get('host') || 'localhost:3000';
  const proto = (req.headers.get('x-forwarded-proto') || 'https').split(',')[0];
  return `${proto}://${host}`;
}

function setCookie(name: string, value: string, maxAgeSec = 60 * 60 * 24 * 180) {
  const isProd = process.env.NODE_ENV === 'production';
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSec}; HttpOnly; SameSite=Lax${
    isProd ? '; Secure' : ''
  }`;
}

function redirect(url: string) {
  return new Response(null, { status: 302, headers: { Location: url } });
}

export async function GET(req: NextRequest) {
  const base = baseFromReq(req);

  const sessionId =
    new URL(req.url).searchParams.get('session_id') ||
    new URL(req.url).searchParams.get('sid') ||
    undefined;

  if (!sessionId) {
    return redirect(`${base}/?msg=${encodeURIComponent('Falta session_id')}`);
  }

  const secret = process.env.STRIPE_SECRET_KEY || '';
  if (!secret) return redirect(`${base}/?msg=${encodeURIComponent('Falta STRIPE_SECRET_KEY')}`);

  try {
    const stripe = new Stripe(secret);

    // Recupera la sesión SIN expand para evitar choques de tipos
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.mode !== 'subscription' && session.mode !== 'payment') {
      return redirect(`${base}/?msg=${encodeURIComponent('Modo de checkout no soportado')}`);
    }
    if (session.status !== 'complete') {
      return redirect(
        `${base}/?msg=${encodeURIComponent(`Estado de pago no completado: ${session.status}`)}`
      );
    }

    const customerId = String(session.customer || '');
    if (!customerId) {
      return redirect(`${base}/?msg=${encodeURIComponent('No se encontró el customer de Stripe')}`);
    }

    // Si hay suscripción, la leemos por ID y extraemos status + period_end con cast seguro
    let subscriptionId = '';
    let status: string = 'active';
    let periodEnd: Date | undefined;

    if (session.mode === 'subscription') {
      subscriptionId =
        typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id || '';

      if (subscriptionId) {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        status = sub.status as string;
        const cpe = (sub as any)?.current_period_end; // algunos types no lo exponen
        if (typeof cpe === 'number') periodEnd = new Date(cpe * 1000);
      }
    }

    // Cookies (MVP UX)
    const headers = new Headers();
    headers.append('Set-Cookie', setCookie('os_pro', '1'));
    headers.append('Set-Cookie', setCookie('os_cust', customerId));
    if (subscriptionId) headers.append('Set-Cookie', setCookie('os_sub', subscriptionId));

    // Vincular a usuario logueado y guardar estado Stripe en DB
    try {
      const auth = await getServerSession(authOptions);
      const email = auth?.user?.email;
      if (email) {
        await prisma.user.upsert({
          where: { email },
          update: {
            stripeCustomerId: customerId,
            stripeStatus: status,
            stripeCurrentPeriodEnd: periodEnd,
          },
          create: {
            email,
            stripeCustomerId: customerId,
            stripeStatus: status,
            stripeCurrentPeriodEnd: periodEnd,
          },
        });
      }
    } catch (e) {
      console.error('No se pudo vincular Stripe customer al usuario:', e);
    }

    headers.set(
      'Location',
      `${base}/account?msg=${encodeURIComponent('Pago confirmado. ¡Gracias!')}`
    );
    return new Response(null, { status: 302, headers });
  } catch (e: any) {
    const msg = e?.message || 'Error confirmando el pago';
    console.error('Stripe confirm error:', msg);
    return redirect(`${base}/?msg=${encodeURIComponent(msg)}`);
  }
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}
