import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/track/',          // сторінки результатів трекінгу (noindex, дублікати, приватність)
          '/secure-admin/',   // адмінка
          '/api/',            // API endpoints
        ],
      },
    ],
    sitemap: 'https://pandatrack.com.ua/sitemap.xml',
  }
}