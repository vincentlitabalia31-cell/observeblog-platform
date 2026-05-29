import type { MetadataRoute } from 'next';
import { getProductionSiteUrl } from '../lib/env';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = new URL(getProductionSiteUrl());

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/dashboard']
      }
    ],
    sitemap: new URL('/sitemap.xml', siteUrl).toString()
  };
}

