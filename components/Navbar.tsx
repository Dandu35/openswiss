import Link from 'next/link';
import { cookies } from 'next/headers';

export default function Navbar() {
  const isPro = cookies().get('os_pro')?.value === '1';
  return (
    <nav className="border-b border-neutral-800">
      <div className="container flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="openSwiss" className="h-6" />
          <span className="font-semibold">openSwiss</span>
          {isPro && <span className="ml-2 text-xs px-2 py-0.5 rounded bg-brand/20 border border-brand/30">PRO</span>}
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/tools" className="hover:underline">Herramientas</Link>
          <a href="/#precios" className="hover:underline">Precios</a>
        </div>
      </div>
    </nav>
  );
}
