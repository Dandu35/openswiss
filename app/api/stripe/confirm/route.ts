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
  // 180 días por defecto (ajusta a tu gusto). Sin webhooks, esto actúa como "sesión PRO" local.
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

    // Recupera la sesión; expandimos subscription para obtener el id con seguridad
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    // Comprobaciones mínimas
    if (session.mode !== 'subscription' && session.mode !== 'payment') {
      return redirect(`${base}/?msg=${encodeURIComponent('Modo de checkout no soportado')}`);
    }
    if (session.status !== 'complete') {
      return redirect(
        `${base}/?msg=${encodeURIComponent(`Estado de pago no completado: ${session.status}`)}`
      );
    }

    const customerId = String(session.customer || '');
    const subscriptionId =
      (typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id) || '';

    if (!customerId) {
      return redirect(`${base}/?msg=${encodeURIComponent('No se encontró el customer de Stripe')}`);
    }

    // -- Marcar PRO por cookies (MVP sin webhooks) --
    const headers = new Headers();
    headers.append('Set-Cookie', setCookie('os_pro', '1'));
    headers.append('Set-Cookie', setCookie('os_cust', customerId));
    if (subscriptionId) headers.append('Set-Cookie', setCookie('os_sub', subscriptionId));

    // -- Si hay sesión NextAuth, guardar el customer en la DB del usuario --
    try {
      const auth = await getServerSession(authOptions);
      const email = auth?.user?.email;
      if (email) {
        await prisma.user.upsert({
          where: { email },
          update: { stripeCustomerId: customerId },
          create: { email, stripeCustomerId: customerId },
        });
      }
    } catch (e) {
      console.error('No se pudo vincular Stripe customer al usuario:', e);
      // No bloqueamos el flujo al usuario; seguimos
    }

    headers.set('Location', `${base}/account?msg=${encodeURIComponent('Pago confirmado. ¡Gracias!')}`);
    return new Response(null, { status: 302, headers });
  } catch (e: any) {
    const msg = e?.message || 'Error confirmando el pago';
    console.error('Stripe confirm error:', msg);
    return redirect(`${base}/?msg=${encodeURIComponent(msg)}`);
  }
}

// Evita 405 si algún agente hace HEAD a la ruta
export async function HEAD() {
  return new Response(null, { status: 200 });
}
