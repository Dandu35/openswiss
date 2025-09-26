import Link from 'next/link';
import { cookies } from 'next/headers';

export default function Navbar() {
  const c = cookies();
  const isPro = c.get('os_pro')?.value === '1';
  const hasCustomer = !!c.get('os_cust')?.value;

  return (
    <nav className="border-b border-neutral-800">
      <div className="container flex items-center justify-between h-14">
        {/* ... tu logo ... */}
        <div className="flex items-center gap-4 text-sm">
          <Link href="/tools" className="hover:underline">Herramientas</Link>
          <a href="/#precios" className="hover:underline">Precios</a>
          {isPro && hasCustomer && <a href="/api/stripe/portal" className="hover:underline">Cuenta</a>}
          {isPro && <a href="/api/stripe/signout" className="hover:underline">Salir</a>}
        </div>
      </div>
    </nav>
  );
}
