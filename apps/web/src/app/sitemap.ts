import { MetadataRoute } from 'next'

const BASE = 'https://pandatrack.com.ua'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  // Головна — найвищий пріоритет
  const home = {
    url: BASE,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 1.0,
  }

  // Courier-сторінки — основний індексований контент
  const couriers = [
    'nova-poshta',
    'ukrposhta',
    'meest-express',
    'dhl',
    'sat',
    'delivery-auto',
  ].map((slug) => ({
    url: `${BASE}/couriers/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }))

  // Розділи-хаби
  const hubs = ['couriers', 'stores', 'promocodes'].map((slug) => ({
    url: `${BASE}/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Магазини / промокоди
  const extra = [
    'stores/aliexpress',
    'promocodes/aliexpress',
  ].map((slug) => ({
    url: `${BASE}/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [home, ...couriers, ...hubs, ...extra]
}