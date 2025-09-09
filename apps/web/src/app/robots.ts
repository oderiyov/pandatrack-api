import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        disallow: '/',        // ЗАБОРОНИТИ все
      },
    ],
    sitemap: '',             // Прибрати sitemap
  }
}