import './globals.css';
import type { Metadata } from 'next';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CookieConsent from '../components/CookieConsent';
import TrackCheckoutSuccess from '../components/TrackCheckoutSuccess';
import Providers from '../components/Providers';
export const dynamic = 'force-dynamic';

function safeUrl(u?: string) {
  try {
    if (!u) return new URL('https://openswiss.example');
    // Si Vercel expone VERCEL_URL (sin protocolo), lo componemos
    if (/^[a-z0-9.-]+\.vercel\.app$/i.test(u) || /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(u)) {
      return new URL(`https://${u}`);
    }
    // Si ya trae http/https
    if (/^https?:\/\//i.test(u)) return new URL(u);
    // Cualquier otra cosa, fallback
    return new URL('https://openswiss.example');
  } catch {
    return new URL('https://openswiss.example');
  }
}

const siteURL =
  safeUrl(process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || 'https://openswiss.example');

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
        <Providers>
          <Navbar />
          <main className="container py-10">{children}</main>
          <Footer />
          <CookieConsent />
          <TrackCheckoutSuccess />
        </Providers>
      </body>
    </html>
  );
  
  
}
