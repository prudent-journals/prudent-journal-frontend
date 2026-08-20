import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://prudentjournals.com';
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/publications/', '/conferences/'],
        disallow: ['/admin/', '/dashboard/', '/auth/'],
      },
      {
        userAgent: 'Googlebot-Scholar',
        allow: '/publications/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
