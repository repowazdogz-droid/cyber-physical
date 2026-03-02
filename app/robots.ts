import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.SITE_URL || 'http://127.0.0.1:3001'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/demo',
          '/kernel-studio',
          '/kernels/',
          '/orchestrator',
          '/regression',
          '/api/',
          '/learning/',
          '/teacher/',
          '/pair/',
          '/audience/',
          '/admin/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}





































