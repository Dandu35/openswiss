import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { mode, text, tone } = await req.json();
    const apiKey = process.env.OPENAI_API_KEY;
    const primaryModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const fallbackModel = 'gpt-3.5-turbo'; // por si tu cuenta no tiene acceso al primario

    if (!apiKey) {
      return jsonError('Falta OPENAI_API_KEY (revisa .env.local y reinicia)', 500);
    }
    if (!text || typeof text !== 'string' || !text.trim()) {
      return jsonError('Falta el campo "text" con contenido', 400);
    }

    const system =
      'Eres un asistente que trabaja en español para estudiantes y profesionales. ' +
      'Eres conciso y claro. Usa viñetas cuando ayuden.';

    const user =
      mode === 'resumen'
        ? `Resume el siguiente texto manteniendo ideas clave y sin inventar datos. Texto:\n\n${text}`
        : `Mejora la redacción del siguiente texto en tono ${tone || 'neutral'}. Corrige gramática, hazlo claro y natural. Texto:\n\n${text}`;

    const result = await callOpenAI(apiKey, primaryModel, system, user)
      .catch(async (e) => {
        console.error('Falló modelo primario:', primaryModel, e?.status || e, e?.body || '');
        // intento con fallback
        return await callOpenAI(apiKey, fallbackModel, system, user);
      });

    return new Response(JSON.stringify({ result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e: any) {
    console.error('API /api/ai error:', e?.stack || e);
    return jsonError('Error interno en /api/ai', 500);
  }
}

async function callOpenAI(apiKey: string, model: string, system: string, user: string): Promise<string> {
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
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
    // lanzamos un error para que el caller decida si hace fallback o responde
    const error: any = new Error(`OpenAI ${r.status}: ${errText}`);
    (error.status = r.status), (error.body = errText);
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
