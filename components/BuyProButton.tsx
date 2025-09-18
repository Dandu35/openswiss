// components/BuyProButton.tsx
'use client';
import Link from 'next/link';

export default function BuyProButton({ label = 'Hazte Pro' }: { label?: string }) {
  // Link directo a la ruta GET que 303-redirige a Stripe
  return <Link href="/api/stripe/checkout" className="btn">{label}</Link>;
}
