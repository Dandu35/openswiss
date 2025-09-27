import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '../lib/auth';
import { prisma } from '../lib/prisma';
import SignOutBtn from './SignOutBtn';

function isActive(status?: string | null, end?: Date | null) {
  const ok = new Set(['active', 'trialing', 'past_due']);
  if (!status || !ok.has(status)) return false;
  if (end && end.getTime() < Date.now()) return false;
  return true;
}

export default async function Navbar() {
  const session = await getServerSession(authOptions);

  let showAccount = false;
  if (session?.user?.email) {
    const u = await prisma.user.findUnique({ where: { email: session.user.email } });
    showAccount = isActive(u?.stripeStatus, u?.stripeCurrentPeriodEnd) && !!u?.stripeCustomerId;
  }

  return (
    <nav className="border-b border-neutral-800">
      <div className="container flex items-center justify-between h-14">
        <Link href="/" className="font-semibold">openSwiss</Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/tools" className="hover:underline">Herramientas</Link>
          <a href="/#precios" className="hover:underline">Precios</a>

          {!session && <Link href="/signin" className="hover:underline">Entrar</Link>}

          {session && (
            <>
              {showAccount && <a href="/api/stripe/portal" className="hover:underline">Cuenta</a>}
              <SignOutBtn />
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
