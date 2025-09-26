// app/api/stripe/portal/route.ts
import type { NextRequest } from 'next/server';
import Stripe from 'stripe';

export const runtime = 'nodejs';

function baseFromReq(req: NextRequest) {
  const host = req.headers.get('host') || 'localhost:3000';
  const proto = (req.headers.get('x-forwarded-proto') || 'https').split(',')[0];
  return `${proto}://${host}`;
}

function parseCookies(header: string | null) {
  const out: Record<string, string> = {};
  if (!header) return out;
  header.split(';').forEach((p) => {
    const [k, ...r] = p.trim().split('=');
    out[k] = decodeURIComponent(r.join('=') || '');
  });
  return out;
}

function redirect(base: string, pathOrMsg = '') {
  const url = pathOrMsg.startsWith('/')
    ? `${base}${pathOrMsg}`
    : `${base}/?msg=${encodeURIComponent(pathOrMsg)}`;
  return new Response(null, { status: 302, headers: { Location: url } });
}

export async function GET(req: NextRequest) {
  const base = baseFromReq(req);

  const secret = process.env.STRIPE_SECRET_KEY || '';
  if (!secret) return redirect(base, 'Falta STRIPE_SECRET_KEY');

  // Necesitamos el Stripe Customer guardado en cookie (cus_...)
  const cookies = parseCookies(req.headers.get('cookie'));
  const customerId = cookies['os_cust'];
  if (!customerId) {
    // Si no hay customer, mejor llevar al pricing
    return redirect(base, '/#precios');
  }

  try {
    // Nota: no pasamos apiVersion para evitar conflictos de tipos
    const stripe = new Stripe(secret);

    // Opcional: usar una configuración concreta del Portal (bpc_...)
    // Crea/guarda la default en modo TEST desde el dashboard si no tienes una.
    const portalCfg = process.env.STRIPE_PORTAL_CONFIGURATION_ID;

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: base, // al cerrar portal, vuelve a la home; cambia si quieres
      ...(portalCfg ? { configuration: portalCfg } : {}),
    });

    return new Response(null, {
      status: 303,
      headers: { Location: session.url! },
    });
  } catch (e: any) {
    const msg =
      e?.message ||
      'No se pudo crear la sesión del portal de cliente de Stripe';
    console.error('Stripe portal error:', msg);
    return redirect(
      base,
      msg
    );
  }
}

// Evita 405 si algún navegador hace HEAD
export async function HEAD() {
  return new Response(null, { status: 200 });
}
