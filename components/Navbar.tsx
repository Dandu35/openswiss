import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="border-b border-neutral-800">
      <div className="container flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="openSwiss" className="h-6" />
          <span className="font-semibold">openSwiss</span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/tools" className="hover:underline">Herramientas</Link>
          <a href="/#precios" className="hover:underline">Precios</a>
        </div>
      </div>
    </nav>
  );
}
