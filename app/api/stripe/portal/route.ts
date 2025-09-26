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
  header.split(';').forEach(p => {
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

// Crea o encuentra una configuración válida del portal (en TEST o LIVE según tu clave)
async function ensurePortalConfiguration(stripe: Stripe, base: string): Promise<string> {
  const explicit = process.env.STRIPE_PORTAL_CONFIGURATION_ID;
  if (explicit) return explicit; // si la pones, la usamos

  // ¿ya hay alguna config?
  const list = await stripe.billingPortal.configurations.list({ limit: 1 });
  if (list.data?.[0]?.id) return list.data[0].id;

  // no hay configs → crea una mínima
  const created = await stripe.billingPortal.configurations.create({
    business_profile: {
      privacy_policy_url: `${base}/privacy`,
      terms_of_service_url: `${base}/terms`,
    },
    features: {
      customer_update: { enabled: true, allowed_updates: ['email','name','address','phone','shipping'] },
      payment_method_update: { enabled: true },
      invoice_history: { enabled: true },
      subscription_cancel: { enabled: true, mode: 'at_period_end' },
      subscription_update: {
        enabled: true,
        default_allowed_updates: ['price','quantity','promotion_code'],
        proration_behavior: 'create_prorations',
      },
    },
  });
  return created.id;
}

export async function GET(req: NextRequest) {
  const base = baseFromReq(req);
  const secret = process.env.STRIPE_SECRET_KEY || '';
  if (!secret) return redirect(base, 'Falta STRIPE_SECRET_KEY');

  const cookies = parseCookies(req.headers.get('cookie'));
  const customerId = cookies['os_cust'];
  if (!customerId) return redirect(base, '/#precios');

  const stripe = new Stripe(secret);
  const debug = new URL(req.url).searchParams.get('debug') === '1';

  try {
    const configuration = await ensurePortalConfiguration(stripe, base);
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: base,
      configuration,
    });

    if (debug) {
      return Response.json({ ok: true, customerId, configuration, sessionUrl: session.url });
    }
    return new Response(null, { status: 303, headers: { Location: session.url! } });
  } catch (e: any) {
    const msg = e?.message || 'No se pudo crear el portal';
    console.error('Stripe portal error:', msg);
    return redirect(base, msg);
  }
}

export async function HEAD() { return new Response(null, { status: 200 }); }
