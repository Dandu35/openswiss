'use client';

import { useState } from 'react';

export default function ResumenTool() {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);

  async function summarize() {
    if (!text.trim()) return;
    setBusy(true); setResult('');
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'resumen', text })
    });
    const data = await res.json();
    setResult(data.result || '');
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Resumir texto (IA)</h1>
      <textarea className="textarea" placeholder="Pega aquí tu texto..." value={text} onChange={e => setText(e.target.value)} />
      <button className="btn" onClick={summarize} disabled={busy}>Resumir</button>
      {result && (
        <div className="card whitespace-pre-wrap text-sm">{result}</div>
      )}
    </div>
  );
}
