// app/account/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../lib/auth';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Tu cuenta — openSwiss',
  description: 'Gestiona tu suscripción y estado de cuenta.',
};

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/signin?callbackUrl=/account');

  const c = cookies();
  const isPro = c.get('os_pro')?.value === '1';
  const hasCustomer = !!c.get('os_cust')?.value;

  return (
    <div className="container py-10 max-w-2xl">
      <h1 className="text-3xl font-bold mb-4">Tu cuenta</h1>

      <p className="text-neutral-300 mb-4">
        Sesión: <b>{session.user?.email}</b>
      </p>

      <p className="mb-6">
        Plan: <b>{isPro ? 'Pro' : 'Gratis'}</b>
      </p>

      {hasCustomer ? (
        <a href="/api/stripe/portal" className="btn">Gestionar suscripción</a>
      ) : (
        <a href="/api/stripe/checkout" className="btn">Hazte Pro</a>
      )}
    </div>
  );
}
