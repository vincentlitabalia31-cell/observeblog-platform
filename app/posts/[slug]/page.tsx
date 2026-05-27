import Navigation from '../../../components/Navigation';
import MarkdownRenderer from '../../../components/MarkdownRenderer';
import { getPostBySlug } from '../../../lib/posts';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

function getSiteUrl() {
  const raw = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  try {
    return new URL(raw);
  } catch {
    return new URL('http://localhost:3000');
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);
  if (!post) return {};

  const siteUrl = getSiteUrl();
  const url = new URL(`/posts/${encodeURIComponent(post.slug)}`, siteUrl);

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title: post.title,
      description: post.excerpt,
      images: post.coverImage ? [{ url: post.coverImage }] : undefined
    }
  };
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);
  if (!post) return notFound();

  return (
    <main className="min-h-screen bg-paper text-ink">
      <Navigation />
      <section className="mx-auto max-w-5xl px-6 py-16 sm:px-8">
        <div className="rounded-lg border border-soft bg-white p-8 shadow-panel sm:p-10">
          <div className="mb-8 space-y-4">
            <p className="text-sm uppercase tracking-[0.18em] text-soft">
              {[post.category, ...post.tags.slice(0, 2)].join(' / ')}
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-ink sm:text-5xl">{post.title}</h1>
            <p className="max-w-3xl text-lg leading-8 text-slate-600">{post.excerpt}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-soft">
              <span>{post.author}</span>
              <span>/</span>
              <span>
                {new Date(post.publishedAt ?? post.createdAt).toLocaleDateString('en-IN', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>
          <MarkdownRenderer content={post.content} />
        </div>
      </section>
    </main>
  );
}
