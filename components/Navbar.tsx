// components/Navbar.tsx
import Link from 'next/link';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '../lib/auth';
import SignOutBtn from './SignOutBtn'; // client btn (ver más abajo)

export default async function Navbar() {
  const session = await getServerSession(authOptions);
  const c = cookies();
  const isPro = c.get('os_pro')?.value === '1';
  const hasCustomer = !!c.get('os_cust')?.value;

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
              {(isPro && hasCustomer) && (
                <a href="/api/stripe/portal" className="hover:underline">Cuenta</a>
              )}
              <SignOutBtn />
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
