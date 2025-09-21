// components/BuyProButton.tsx
'use client';

export default function BuyProButton({ label = 'Hazte Pro' }: { label?: string }) {
  function go() {
    const p = (window as any).plausible;
    if (typeof p === 'function') {
      p('checkout_start', {
        callback: () => { window.location.href = '/api/stripe/checkout'; },
        // fallback: si bloquean requests, forzamos redirect después de 300 ms
        props: { plan: 'pro_monthly' }
      });
      setTimeout(() => { window.location.href = '/api/stripe/checkout'; }, 300);
    } else {
      window.location.href = '/api/stripe/checkout';
    }
  }
  return <button className="btn" onClick={go}>{label}</button>;
}