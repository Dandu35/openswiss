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
  header.split(';').forEach(p => { const [k,...r]=p.trim().split('='); out[k]=decodeURIComponent(r.join('=')||''); });
  return out;
}
function redirect(base: string, pathOrMsg = '') {
  const url = pathOrMsg.startsWith('/') ? `${base}${pathOrMsg}` : `${base}/?msg=${encodeURIComponent(pathOrMsg)}`;
  return new Response(null, { status: 302, headers: { Location: url } });
}

export async function GET(req: NextRequest) {
  const base = baseFromReq(req);
  const secret = process.env.STRIPE_SECRET_KEY || '';
  if (!secret) return redirect(base, 'Falta STRIPE_SECRET_KEY');

  const cookies = parseCookies(req.headers.get('cookie'));
  const customerId = cookies['os_cust'];
  if (!customerId) return redirect(base, '/#precios');

  const stripe = new Stripe(secret);
  const cfg = process.env.STRIPE_PORTAL_CONFIGURATION_ID || undefined;

  // helper para crear sesión (opcionalmente con config)
  async function createSession(useCfg: boolean) {
    return stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: base,
      ...(useCfg && cfg ? { configuration: cfg } : {}),
    });
  }

  try {
    let sess = await createSession(true);
    return new Response(null, { status: 303, headers: { Location: sess.url! } });
  } catch (e: any) {
    // Si la config no existe en este modo, reintenta sin configuration
    const msg = String(e?.message || '');
    const isMissingCfg = (e?.code === 'resource_missing' && (e?.param === 'configuration' || msg.includes('No such configuration')));
    if (cfg && isMissingCfg) {
      try {
        const sess2 = await createSession(false);
        return new Response(null, { status: 303, headers: { Location: sess2.url! } });
      } catch (e2: any) {
        console.error('Stripe portal fallback error:', e2?.message || e2);
        return redirect(base, e2?.message || 'No se pudo crear el portal (fallback)');
      }
    }
    console.error('Stripe portal error:', msg);
    return redirect(base, msg || 'No se pudo crear el portal');
  }
}

export async function HEAD() { return new Response(null, { status: 200 }); }
