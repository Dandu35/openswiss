import './globals.css';
import type { Metadata } from 'next';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://openswiss.example'),
  title: {
    default: 'openSwiss — Navaja suiza digital',
    template: '%s · openSwiss'
  },
  description: 'Herramientas de estudio y productividad (PDF, resúmenes, mejora de textos) con IA.',
  openGraph: {
    title: 'openSwiss — navaja suiza digital',
    description: 'Herramientas de estudio y productividad con IA.',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://openswiss.example',
    siteName: 'openSwiss',
    locale: 'es_ES',
    type: 'website'
  },
  robots: { index: true, follow: true }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Navbar />
        <main className="container py-10">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
