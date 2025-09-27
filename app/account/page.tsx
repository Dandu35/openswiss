import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../lib/auth';
import { prisma } from '../../lib/prisma';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Tu cuenta — openSwiss',
  description: 'Gestiona tu suscripción y estado de cuenta.',
};

function isActive(status?: string | null, end?: Date | null) {
  const ok = new Set(['active', 'trialing', 'past_due']);
  if (!status || !ok.has(status)) return false;
  if (end && end.getTime() < Date.now()) return false;
  return true;
}

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/signin?callbackUrl=/account');

  const user = await prisma.user.findUnique({
    where: { email: session.user?.email || '' },
  });

  const pro = isActive(user?.stripeStatus, user?.stripeCurrentPeriodEnd);

  return (
    <div className="container py-10 max-w-2xl">
      <h1 className="text-3xl font-bold mb-4">Tu cuenta</h1>
      <p className="text-neutral-300 mb-4">Sesión: <b>{session.user?.email}</b></p>
      <p className="mb-6">Plan: <b>{pro ? 'Pro' : 'Gratis'}</b></p>

      {pro && user?.stripeCustomerId ? (
        <a href="/api/stripe/portal" className="btn">Gestionar suscripción</a>
      ) : (
        <a href="/api/stripe/checkout" className="btn">Hazte Pro</a>
      )}
    </div>
  );
}
