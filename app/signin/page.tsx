'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const res = await signIn('email', { email, redirect: false, callbackUrl: '/' });
    if (res?.ok) setSent(true);
    else setErr(res?.error || 'No se pudo enviar el enlace');
  }

  return (
    <div className="container max-w-md py-10">
      <h1 className="text-3xl font-bold mb-4">Entrar</h1>
      {sent ? (
        <p className="text-sm text-neutral-300">
          Te hemos enviado un enlace a <b>{email}</b>. Revísalo para continuar.
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <input
            type="email"
            required
            placeholder="tu@email.com"
            className="input w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="btn w-full" type="submit">Enviar enlace de acceso</button>
          {err && <p className="text-red-400 text-sm">{err}</p>}
        </form>
      )}
    </div>
  );
}
