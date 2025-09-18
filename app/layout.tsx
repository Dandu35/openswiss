import './globals.css';
import type { Metadata } from 'next';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function safeUrl(u?: string) {
  try {
    if (!u) return new URL('https://openswiss.example');
    const hasProtocol = /^https?:\/\//i.test(u);
    return new URL(hasProtocol ? u : `https://${u}`);
  } catch {
    return new URL('https://openswiss.example');
  }
}

const siteURL = safeUrl(process.env.NEXT_PUBLIC_SITE_URL);

export const metadata: Metadata = {
  metadataBase: siteURL,
  title: {
    default: 'openSwiss — Navaja suiza digital',
    template: '%s · openSwiss'
  },
  description: 'Herramientas de estudio y productividad (PDF, resúmenes, mejora de textos) con IA.',
  openGraph: {
    title: 'openSwiss — navaja suiza digital',
    description: 'Herramientas de estudio y productividad con IA.',
    url: siteURL.toString(),
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

