import { NextRequest } from 'next/server';
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
  const url = pathOrMsg.startsWith('/') ? `${base}${pathOrMsg}` : `${base}/?msg=${encodeURIComponent(pathOrMsg)}`;
  return new Response(null, { status: 302, headers: { Location: url } });
}

export async function GET(req: NextRequest) {
  const base = baseFromReq(req);
  const secret = process.env.STRIPE_SECRET_KEY || '';
  if (!secret) return redirect(base, 'Falta STRIPE_SECRET_KEY');

  // Necesitamos el customer de Stripe (lo guardamos en cookie os_cust al volver del checkout)
  const cookies = parseCookies(req.headers.get('cookie'));
  const customerId = cookies['os_cust'];
  if (!customerId) {
    // Si no tenemos customer, le mandamos a precios o mostramos aviso
    return redirect(base, '/#precios');
  }

  try {
    const stripe = new Stripe(secret);
    // Asegúrate de tener el Portal activado en Stripe Dashboard (Settings → Billing → Customer Portal)
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: base, // al cerrar portal, vuelve a la home (puedes cambiarlo a `${base}/account`)
    });
    return new Response(null, {
      status: 303,
      headers: { Location: session.url! },
    });
  } catch (e: any) {
    const msg = e?.message || 'No se pudo crear el portal';
    console.error('Stripe portal error:', msg);
    return redirect(base, msg);
  }
}
