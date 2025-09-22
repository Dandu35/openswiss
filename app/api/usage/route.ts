import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';

const FREE_DAILY_WORDS = 1000;
const PRO_DAILY_WORDS  = 20000;

const KV_URL   = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const REDIS_URL = process.env.REDIS_URL || '';

function todayKey() { return new Date().toISOString().slice(0,10); }
function parseCookies(header: string | null) {
  const out: Record<string,string> = {};
  if (!header) return out;
  header.split(';').forEach(p => { const [k,...r]=p.trim().split('='); out[k]=decodeURIComponent(r.join('=')||''); });
  return out;
}
function clientIp(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip') || '0.0.0.0';
}

// REST (Vercel KV/Upstash)
async function kvGet(key: string) {
  if (!KV_URL || !KV_TOKEN) return null;
  const r = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, { headers: { Authorization: `Bearer ${KV_TOKEN}` }});
  if (!r.ok) return null;
  const j = await r.json();
  return j?.result === null ? null : Number(j.result);
}

// TCP (REDIS_URL)
let _redis: any = null;
async function redisGet(key: string) {
  if (!REDIS_URL) return null;
  if (!_redis) {
    const { createClient } = await import('redis');
    _redis = createClient({ url: REDIS_URL });
    await _redis.connect();
  }
  const v = await _redis.get(key);
  return v == null ? null : Number(v);
}

export async function GET(req: NextRequest) {
  const cookiesIn = parseCookies(req.headers.get('cookie'));
  const isPro = cookiesIn['os_pro'] === '1';
  const day = todayKey();
  const ip = clientIp(req);
  const usageKey = `usage:${day}:${ip}:${isPro ? 'pro' : 'free'}`;

  const used = (await kvGet(usageKey)) ?? (await redisGet(usageKey)) ?? 0;
  const limit = isPro ? PRO_DAILY_WORDS : FREE_DAILY_WORDS;

  return Response.json({ used, limit, isPro });
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}
