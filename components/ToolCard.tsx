import Link from 'next/link';

export default function ToolCard({ href, title, desc }: { href: string; title: string; desc: string; }) {
  return (
    <Link href={href} className="card hover:border-brand transition">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-neutral-300 text-sm">{desc}</p>
    </Link>
  );
}
