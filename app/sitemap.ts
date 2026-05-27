import type { MetadataRoute } from 'next';
import { connectToDatabase } from '../lib/mongodb';
import Post from '../models/Post';

function getSiteUrl() {
  const raw = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  try {
    return new URL(raw);
  } catch {
    return new URL('http://localhost:3000');
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: new URL('/', siteUrl).toString(), lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: new URL('/posts', siteUrl).toString(), lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: new URL('/archive', siteUrl).toString(), lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: new URL('/about', siteUrl).toString(), lastModified: now, changeFrequency: 'monthly', priority: 0.5 }
  ];

  if (!process.env.MONGODB_URI) return staticRoutes;

  await connectToDatabase();
  const posts = await Post.find({ status: 'published', published: true })
    .select('slug updatedAt')
    .sort({ updatedAt: -1 })
    .limit(2000)
    .lean();

  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: new URL(`/posts/${encodeURIComponent(post.slug)}`, siteUrl).toString(),
    lastModified: post.updatedAt || now,
    changeFrequency: 'weekly',
    priority: 0.7
  }));

  return [...staticRoutes, ...postRoutes];
}

