'use client';

import { useState } from 'react';

export default function MejoraTool() {
  const [text, setText] = useState('');
  const [tone, setTone] = useState('neutral');
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);

  async function improve() {
    if (!text.trim()) return;
    setBusy(true); setResult('');
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'mejora', text, tone })
    });
    const data = await res.json();
    setResult(data.result || '');
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Mejorar redacción (IA)</h1>
      <div className="flex items-center gap-3">
        <label className="text-sm text-neutral-400">Tono:</label>
        <select className="input" value={tone} onChange={e => setTone(e.target.value)}>
          <option value="neutral">Neutral</option>
          <option value="formal">Formal</option>
          <option value="informal">Informal</option>
          <option value="persuasivo">Persuasivo</option>
          <option value="académico">Académico</option>
        </select>
      </div>
      <textarea className="textarea" placeholder="Pega tu texto para mejorar..." value={text} onChange={e => setText(e.target.value)} />
      <button className="btn" onClick={improve} disabled={busy}>Mejorar</button>
      {result && (
        <div className="card whitespace-pre-wrap text-sm">{result}</div>
      )}
    </div>
  );
}
