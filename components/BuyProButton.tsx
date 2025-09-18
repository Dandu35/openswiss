'use client';
import { useState } from 'react';

export default function BuyProButton({ label = 'Hazte Pro' }: { label?: string }) {
  const [busy, setBusy] = useState(false);
  async function onClick() {
    setBusy(true);
    try {
      const r = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = await r.json();
      if (data?.url) window.location.href = data.url;
      else alert('No se pudo iniciar el checkout.');
    } finally {
      setBusy(false);
    }
  }
  return <button className="btn" onClick={onClick} disabled={busy}>{busy ? 'Redirigiendo…' : label}</button>;
}
