'use client';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function TrackCheckoutSuccess() {
  const sp = useSearchParams();

  useEffect(() => {
    if (sp.get('pro') === '1') {
      // Evento de conversión Plausible
      (window as any).plausible?.('checkout_success', { props: { plan: 'pro_monthly' } });

      // Limpia la query ?pro=1 para no dispararlo otra vez
      const url = new URL(window.location.href);
      url.searchParams.delete('pro');
      window.history.replaceState({}, '', url.pathname + (url.search || '') + url.hash);
    }
  }, [sp]);

  return null;
}
