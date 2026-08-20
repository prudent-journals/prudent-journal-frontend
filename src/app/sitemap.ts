import { MetadataRoute } from 'next';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://prudentjournals.com';

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/publications`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/conferences`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/submit`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  ];

  try {
    const res = await fetch(`${API}/publications?size=100`);
    if (res.ok) {
      const publications = await res.json();
      const pubRoutes: MetadataRoute.Sitemap = (Array.isArray(publications) ? publications : []).map((pub: { slug: string; published_at: string }) => ({
        url: `${baseUrl}/publications/${pub.slug}`,
        lastModified: new Date(pub.published_at),
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      }));
      return [...staticRoutes, ...pubRoutes];
    }
  } catch { /* fallback */ }

  return staticRoutes;
}
