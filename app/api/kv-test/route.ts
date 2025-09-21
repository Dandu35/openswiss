// app/api/kv-test/route.ts
export const runtime = 'nodejs';

const KV_URL   = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const REDIS_URL = process.env.REDIS_URL || '';

export async function GET() {
  try {
    if (KV_URL && KV_TOKEN) {
      const r = await fetch(`${KV_URL}/incrby/kv_test_counter/1?ttl=${60*10}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${KV_TOKEN}` },
      });
      const j = await r.json();
      return Response.json({ ok: true, mode: 'rest', value: j.result });
    }
    if (REDIS_URL) {
      const { createClient } = await import('redis');
      const client = createClient({ url: REDIS_URL });
      await client.connect();
      const v = await client.incrBy('kv_test_counter', 1);
      await client.expire('kv_test_counter', 60*10);
      await client.quit();
      return Response.json({ ok: true, mode: 'tcp', value: v });
    }
    return Response.json({ ok: false, reason: 'No KV/Redis env vars found' }, { status: 500 });
  } catch (e: any) {
    return Response.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}
