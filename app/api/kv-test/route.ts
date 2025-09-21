// app/api/kv-test/route.ts
export const runtime = 'nodejs';

// handler mínimo para validar que la ruta funciona
export async function GET() {
  return Response.json({ ok: true, ping: 'pong', now: Date.now() });
}

// algunos navegadores hacen HEAD; evita 405
export async function HEAD() {
  return new Response(null, { status: 200 });
}
