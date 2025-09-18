// app/sitemap.ts
import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://openswiss.example');

  const now = new Date();

  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/tools`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/tools/pdf`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/tools/resumen`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/tools/mejora`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
