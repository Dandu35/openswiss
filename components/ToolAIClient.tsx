'use client';

import { useEffect, useMemo, useState } from 'react';

type Mode = 'resumen' | 'mejora';

export default function ToolAIClient({
  mode,
  allowTone = false,
}: {
  mode: Mode;
  allowTone?: boolean;
}) {
  const [text, setText] = useState('');
  const [tone, setTone] = useState('neutral');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [used, setUsed] = useState<number | undefined>();
  const [limit, setLimit] = useState<number | undefined>();
  const [progress, setProgress] = useState(0);

  // lee uso sin gastar créditos
  useEffect(() => {
    let cancel = false;
    fetch('/api/usage')
      .then(r => r.json())
      .then(d => { if (!cancel) { setUsed(d?.used ?? 0); setLimit(d?.limit); } })
      .catch(() => {});
    return () => { cancel = true; };
  }, []);

  // barra de progreso optimista
  useEffect(() => {
    if (!loading) return;
    setProgress(10);
    const id = setInterval(() => setProgress(p => (p < 90 ? p + 5 : p)), 250);
    return () => clearInterval(id);
  }, [loading]);

  const remaining = useMemo(() => {
    if (used == null || limit == null) return undefined;
    return Math.max(0, limit - used);
  }, [used, limit]);

  async function submit() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setResult('');
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, text, tone }),
      });

      const data = await res.json().catch(() => ({}));

      if (typeof data?.used === 'number') setUsed(data.used);
      if (typeof data?.limit === 'number') setLimit(data.limit);

      if (!res.ok) {
        if (data?.code === 'limit_reached') {
          setError('Has alcanzado tu límite diario de palabras.');
        } else {
          setError(data?.error || `Error ${res.status}`);
        }
        return;
      }

      setResult(String(data?.result || ''));
      setProgress(100);
      setTimeout(() => setProgress(0), 400);
    } catch (e: any) {
      setError(e?.message || 'Error de red');
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') submit();
  }

  return (
    <div className="max-w-3xl mx-auto">
      {allowTone && (
        <div className="flex gap-3 mb-3">
          <label className="text-sm text-neutral-300">
            Tono:{' '}
            <select
              className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
            >
              <option value="neutral">Neutral</option>
              <option value="formal">Formal</option>
              <option value="informal">Informal</option>
              <option value="persuasivo">Persuasivo</option>
              <option value="académico">Académico</option>
              <option value="amigable">Amigable</option>
              <option value="entusiasta">Entusiasta</option>
            </select>
          </label>
        </div>
      )}

      <textarea
        className="w-full h-56 rounded-xl bg-neutral-900 border border-neutral-700 p-4 outline-none"
        placeholder="Pega tu texto… (Ctrl/⌘+Enter para enviar)"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
      />

      {(loading || progress > 0) && (
        <div className="mt-4 h-2 rounded bg-neutral-800 overflow-hidden">
          <div className="h-full bg-red-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button className="btn" onClick={submit} disabled={loading || !text.trim()}>
          {loading ? (mode === 'resumen' ? 'Resumiendo…' : 'Mejorando…') : (mode === 'resumen' ? 'Resumir' : 'Mejorar')}
        </button>

        {limit != null && (
          <span className="text-sm text-neutral-400">
            Uso hoy: {used ?? 0} / {limit}
            {remaining != null ? ` · Restantes: ${remaining}` : ''}
          </span>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-lg border border-red-700 bg-red-950/30 text-red-300 text-sm">
          {error}{' '}
          {error.includes('límite') && (
            <>
              &nbsp;<a className="underline" href="/#precios">Ver planes</a> ·{' '}
              <a className="underline" href="/api/stripe/checkout">Hazte PRO</a>
            </>
          )}
        </div>
      )}

      {result && (
        <div className="mt-6 rounded-xl border border-neutral-700 bg-neutral-900 p-4 whitespace-pre-wrap">
          {result}
        </div>
      )}
    </div>
  );
}
