// app/api/ai/route.ts
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs'; // necesario si usamos cliente TCP de Redis

// ====== CONFIG ======
const FREE_DAILY_WORDS = 1000;   // Límite gratis / día
const PRO_DAILY_WORDS  = 20000;  // Límite Pro / día (ajústalo o usa Number.POSITIVE_INFINITY)
const USAGE_COOKIE = 'os_usage';

// ====== ENV (permite Redis TCP o REST) ======
const KV_URL   = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const REDIS_URL = process.env.REDIS_URL || '';
const IS_PROD = process.env.NODE_ENV === 'production';

// ====== HELPERS GENERALES ======
function parseCookies(header: string | null) {
  const out: Record<string, string> = {};
  if (!header) return out;
  header.split(';').forEach(part => {
    const [k, ...rest] = part.trim().split('=');
    out[k] = decodeURIComponent(rest.join('=') || '');
  });
  return out;
}

function makeSetCookie(name: string, value: string, maxAgeSec: number) {
  // Secure solo en producción (en local http no se setea)
  const secure = IS_PROD ? '; Secure' : '';
  return `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeSec}; Path=/; HttpOnly; SameSite=Lax${secure}`;
}

function countWords(s: string) {
  return (s || '').trim().split(/\s+/).filter(Boolean).length;
}
function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}
function clientIp(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || '0.0.0.0';
}

function jsonError(msg: string, status = 500) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

// ====== ALMACÉN: REST (Vercel KV / Upstash) ======
async function kvGet(key: string) {
  if (!KV_URL || !KV_TOKEN) return null;
  const r = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` }
  });
  if (!r.ok) return null;
  const j = await r.json(); // { result: string | null }
  return j?.result === null ? null : Number(j.result);
}

async function kvIncrBy(key: string, by: number, ttlSec: number) {
  if (!KV_URL || !KV_TOKEN) return null;
  const r = await fetch(`${KV_URL}/incrby/${encodeURIComponent(key)}/${by}?ttl=${ttlSec}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}` }
  });
  const j = await r.json(); // { result: number }
  return Number(j.result);
}

// ====== ALMACÉN: TCP (REDIS_URL) ======
let _redis: any = null;
async function getRedis() {
  if (!_redis) {
    const { createClient } = await import('redis');
    _redis = createClient({ url: REDIS_URL });
    _redis.on('error', (e: any) => console.error('Redis error:', e?.message || e));
    await _redis.connect();
  }
  return _redis;
}

async function redisGet(key: string) {
  if (!REDIS_URL) return null;
  const r = await getRedis();
  const v = await r.get(key);
  return v == null ? null : Number(v);
}

async function redisIncrBy(key: string, by: number, ttlSec: number) {
  if (!REDIS_URL) return null;
  const r = await getRedis();
  const val: number = await r.incrBy(key, by);
  const ttl = await r.ttl(key);
  if (ttl < 0 || ttl > ttlSec) await r.expire(key, ttlSec);
  return val;
}

// ====== API ÚNICA DE ALMACÉN (usa REST si hay, si no TCP; si no, null) ======
async function storeGet(key: string) {
  const rest = await kvGet(key);
  if (typeof rest === 'number') return rest;
  const tcp = await redisGet(key);
  if (typeof tcp === 'number') return tcp;
  return null;
}
async function storeIncrBy(key: string, by: number, ttlSec: number) {
  const rest = await kvIncrBy(key, by, ttlSec);
  if (typeof rest === 'number') return rest;
  const tcp = await redisIncrBy(key, by, ttlSec);
  if (typeof tcp === 'number') return tcp;
  return null;
}

// ====== OPENAI ======
async function callOpenAI(apiKey: string, model: string, system: string, user: string): Promise<string> {
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ]
    })
  });

  if (!r.ok) {
    const errText = await r.text();
    const error: any = new Error(`OpenAI ${r.status}: ${errText}`);
    (error as any).status = r.status;
    (error as any).body = errText;
    throw error;
  }

  const data = await r.json();
  const content = data?.choices?.[0]?.message?.content ?? '';
  if (!content) throw new Error('Respuesta vacía de OpenAI');
  return content;
}

// ====== HANDLER ======
export async function POST(req: NextRequest) {
  // Parsear el body una sola vez (para poder usarlo también en el catch)
  const body = await req.json().catch(() => ({} as any));
  const mode = body?.mode as string | undefined;
  const text = String(body?.text ?? '');
  const tone = body?.tone as string | undefined;

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const primaryModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const fallbackModel = 'gpt-3.5-turbo';

    if (!apiKey) {
      return jsonError('Falta OPENAI_API_KEY (revisa .env y Vercel)', 500);
    }
    if (!text.trim()) {
      return jsonError('Falta el campo "text" con contenido', 400);
    }

    // ---- LÍMITE DIARIO (duro por Redis/KV + cookie visual) ----
    const cIn = parseCookies(req.headers.get('cookie'));
    const isPro = cIn['os_pro'] === '1';
    const words = countWords(text);
    const day = todayKey();
    const ip = clientIp(req);
    const usageKey = `usage:${day}:${ip}:${isPro ? 'pro' : 'free'}`;

    const limit = isPro ? PRO_DAILY_WORDS : FREE_DAILY_WORDS;

    // Lee uso desde Redis/KV (si no hay, vuelve a 0)
    const usedStore = (await storeGet(usageKey)) || 0;

    if (usedStore + words > limit) {
      return new Response(
        JSON.stringify({
          error: isPro
            ? 'Has superado tu límite diario de palabras.'
            : 'Límite diario gratis alcanzado. Hazte Pro para ampliarlo.',
          code: 'limit_reached'
        }),
        { status: 402, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Incrementa en Redis/KV con TTL ~ 26h
    const newUsedStore = (await storeIncrBy(usageKey, words, 60 * 60 * 26)) ?? (usedStore + words);

    // Cookie visual para enseñar progreso (no decisiva)
    const savedUsageCookie = makeSetCookie(USAGE_COOKIE, `${day}:${newUsedStore}`, 60 * 60 * 24 + 60);

    // ---- Prompts ----
    const system =
      'Eres un asistente que trabaja en español para estudiantes y profesionales. ' +
      'Eres conciso y claro. Usa viñetas cuando ayuden.';

    const user =
      mode === 'resumen'
        ? `Resume el siguiente texto manteniendo ideas clave y sin inventar datos. Texto:\n\n${text}`
        : `Mejora la redacción del siguiente texto en tono ${tone || 'neutral'}. Corrige gramática, hazlo claro y natural. Texto:\n\n${text}`;

    // ---- Llamada a OpenAI con fallback de modelo ----
    const result = await callOpenAI(apiKey, primaryModel, system, user).catch(async (e) => {
      console.error('Falló modelo primario:', primaryModel, e?.status || e, e?.body || '');
      return await callOpenAI(apiKey, fallbackModel, system, user);
    });

    const headers = new Headers({ 'Content-Type': 'application/json' });
    headers.append('Set-Cookie', savedUsageCookie);
    return new Response(JSON.stringify({ result, used: newUsedStore, limit }), { status: 200, headers });
  } catch (e: any) {
    // Si es error de cuota, devolvemos un "modo demo" para no romper UX
    const msg = String(e?.body || e?.message || '').toLowerCase();
    if (msg.includes('insufficient_quota')) {
      const day = todayKey();
      const words = countWords(text);
      const cIn = parseCookies(req.headers.get('cookie'));
      let used = 0;
      if (cIn[USAGE_COOKIE]) {
        const [d, n] = cIn[USAGE_COOKIE].split(':');
        if (d === day) used = parseInt(n || '0', 10) || 0;
      }
      const newUsed = used + words;
      const savedUsageCookie = makeSetCookie(USAGE_COOKIE, `${day}:${newUsed}`, 60 * 60 * 24 + 60);

      const demo =
        mode === 'resumen'
          ? `⚠️ Modo demo (sin saldo)\n\n• ${text.split(/[.!?]\s+/).filter(Boolean).slice(0, 3).join('\n• ')}`
          : `⚠️ Modo demo (sin saldo)\n\n${text.replace(/\s+/g, ' ').trim()}`;

      const headers = new Headers({ 'Content-Type': 'application/json' });
      headers.append('Set-Cookie', savedUsageCookie);
      return new Response(JSON.stringify({ result: demo, used: newUsed, limit: FREE_DAILY_WORDS }), {
        status: 200,
        headers
      });
    }

    console.error('API /api/ai error:', e?.stack || e);
    return jsonError('Error interno en /api/ai', 500);
  }
}
