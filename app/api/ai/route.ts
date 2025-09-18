import { NextRequest } from 'next/server';

const FREE_DAILY_WORDS = 1000;   // Límite gratis / día
const PRO_DAILY_WORDS  = 20000;  // Límite Pro / día (ajústalo o pon Infinity)
const USAGE_COOKIE = 'os_usage';

// ---------- helpers ----------
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
  return `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeSec}; Path=/; HttpOnly; SameSite=Lax; Secure`;
}
function countWords(s: string) {
  return (s || '').trim().split(/\s+/).filter(Boolean).length;
}
function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}
// --------------------------------

export async function POST(req: NextRequest) {
  try {
    const { mode, text, tone } = await req.json();
    const apiKey = process.env.OPENAI_API_KEY;
    const primaryModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const fallbackModel = 'gpt-3.5-turbo';

    if (!apiKey) {
      return jsonError('Falta OPENAI_API_KEY (revisa .env.local y reinicia)', 500);
    }
    if (!text || typeof text !== 'string' || !text.trim()) {
      return jsonError('Falta el campo "text" con contenido', 400);
    }

    // ---- LÍMITE DIARIO POR PALABRAS (cookie MVP) ----
    const cookiesIn = parseCookies(req.headers.get('cookie'));
    const isPro = cookiesIn['os_pro'] === '1';
    const words = countWords(text);
    const key = todayKey();

    let used = 0;
    if (cookiesIn[USAGE_COOKIE]) {
      const [d, n] = cookiesIn[USAGE_COOKIE].split(':');
      if (d === key) used = parseInt(n || '0', 10) || 0;
    }
    const limit = isPro ? PRO_DAILY_WORDS : FREE_DAILY_WORDS;
    if (used + words > limit) {
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
    const newUsed = used + words;
    const savedUsageCookie = makeSetCookie(USAGE_COOKIE, `${key}:${newUsed}`, 60 * 60 * 24 + 60);

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
    return new Response(JSON.stringify({ result, used: newUsed, limit }), { status: 200, headers });
  } catch (e: any) {
    // Si es error de cuota, devolvemos un "modo demo" para no romper UX
    const msg = String(e?.body || e?.message || '').toLowerCase();
    if (msg.includes('insufficient_quota')) {
      try {
        const { mode, text } = await req.json();
        const demo =
          mode === 'resumen'
            ? `⚠️ Modo demo (sin saldo)\n\n• ${text
                .split(/[.!?]\s+/)
                .filter(Boolean)
                .slice(0, 3)
                .join('\n• ')}`
            : `⚠️ Modo demo (sin saldo)\n\n${String(text || '').replace(/\s+/g, ' ').trim()}`;

        const cookiesIn = parseCookies(req.headers.get('cookie'));
        const key = todayKey();
        let used = 0;
        if (cookiesIn[USAGE_COOKIE]) {
          const [d, n] = cookiesIn[USAGE_COOKIE].split(':');
          if (d === key) used = parseInt(n || '0', 10) || 0;
        }
        const words = countWords(String(text || ''));
        const newUsed = used + words;
        const savedUsageCookie = makeSetCookie(USAGE_COOKIE, `${key}:${newUsed}`, 60 * 60 * 24 + 60);

        const headers = new Headers({ 'Content-Type': 'application/json' });
        headers.append('Set-Cookie', savedUsageCookie);
        return new Response(JSON.stringify({ result: demo, used: newUsed, limit: FREE_DAILY_WORDS }), {
          status: 200,
          headers
        });
      } catch {
        // Si algo sale mal aquí, sigue al error genérico:
      }
    }

    console.error('API /api/ai error:', e?.stack || e);
    return jsonError('Error interno en /api/ai', 500);
  }
}

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
    error.status = r.status;
    error.body = errText;
    throw error;
  }

  const data = await r.json();
  const content = data?.choices?.[0]?.message?.content ?? '';
  if (!content) throw new Error('Respuesta vacía de OpenAI');
  return content;
}

function jsonError(msg: string, status = 500) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
