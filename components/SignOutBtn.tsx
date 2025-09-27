'use client';
import { signOut } from 'next-auth/react';

export default function SignOutBtn() {
  return (
    <button className="hover:underline" onClick={() => signOut({ callbackUrl: '/' })}>
      Salir
    </button>
  );
}
