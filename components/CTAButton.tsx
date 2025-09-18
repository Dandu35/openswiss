'use client';
import Link from 'next/link';
import { ReactNode } from 'react';

export default function CTAButton({
  href, event = 'CTA Tools', children, className = 'btn'
}: { href: string; event?: string; children: ReactNode; className?: string }) {
  function handleClick() {
    (window as any).plausible?.(event);
  }
  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}
