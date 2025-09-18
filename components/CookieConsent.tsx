'use client';

import { useEffect, useState } from 'react';

function loadPlausible(domain?: string) {
  if (!domain) return;
  if (typeof document === 'undefined') return;
  if (document.getElementById('plausible-script')) return;

  const s = document.createElement('script');
  s.id = 'plausible-script';
  s.defer = true;
  s.setAttribute('data-domain', domain);
  s.src = 'https://plausible.io/js/script.js';
  document.head.appendChild(s);
}

export default function CookieConsent() {
  const [choice, setChoice] = useState<'granted' | 'denied' | null>(null);
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('os_consent');
    if (saved === 'granted') {
      setChoice('granted');
      loadPlausible(domain);
    } else if (saved === 'denied') {
      setChoice('denied');
    } else {
      setChoice(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function accept() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('os_consent', 'granted');
    }
    setChoice('granted');
    loadPlausible(domain);
  }
  function decline() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('os_consent', 'denied');
    }
    setChoice('denied');
  }

  if (choice !== null) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[95%]">
      <div className="card flex flex-col md:flex-row md:items-center gap-3">
        <div className="text-sm">
          Usamos analítica (Plausible) para mejorar el servicio. ¿Aceptas analítica?
          Lee más en nuestra <a className="underline" href="/privacy">Política de Privacidad</a>.
        </div>
        <div className="flex gap-2">
          <button className="btn" onClick={accept}>Aceptar</button>
          <button className="btn bg-neutral-800 hover:bg-neutral-700" onClick={decline}>Rechazar</button>
        </div>
      </div>
    </div>
  );
}
