import Navigation from '../../../components/Navigation';
import MarkdownRenderer from '../../../components/MarkdownRenderer';
import EngagementControls from '../../../components/EngagementControls';
import CommentSection from '../../../components/CommentSection';
import ReadingProgress from '../../../components/ReadingProgress';
import { getApprovedComments, getPostBySlug, getPostEngagement, getRecentPosts } from '../../../lib/posts';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';

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
  const session = await getServerSession(authOptions);
  const [engagement, comments, related] = await Promise.all([
    getPostEngagement(post.id, session?.user?.id),
    getApprovedComments(post.id),
    getRecentPosts(4)
  ]);
  const readingMinutes = Math.max(1, Math.ceil(post.content.split(/\s+/).filter(Boolean).length / 220));
  const relatedPosts = related.filter((item) => item.id !== post.id).slice(0, 3);

  return (
    <main className="min-h-screen bg-paper text-ink">
      <ReadingProgress />
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
              <span>{readingMinutes} min read</span>
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
          {post.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.coverImage} alt="" className="mb-10 aspect-[16/8] w-full rounded-lg object-cover" />
          ) : null}
          <div className="mb-8">
            <EngagementControls
              postId={post.id}
              initialLikes={engagement.likes}
              initialBookmarks={engagement.bookmarks}
              initiallyLiked={engagement.liked}
              initiallyBookmarked={engagement.bookmarked}
            />
          </div>
          <MarkdownRenderer content={post.content} />
          <div className="mt-10 rounded-lg border border-soft bg-paper p-6">
            <p className="text-sm uppercase tracking-[0.18em] text-soft">Author</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">{post.author}</h2>
            <p className="mt-3 text-sm leading-7 text-secondary">
              Contributor to Observing India, writing from the intersections of study, place, and everyday observation.
            </p>
          </div>
          <CommentSection postId={post.id} comments={comments} />
        </div>
        {relatedPosts.length ? (
          <section className="mt-10">
            <p className="text-sm uppercase tracking-[0.18em] text-soft">Related essays</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {relatedPosts.map((item) => (
                <a key={item.id} href={`/posts/${item.slug}`} className="rounded-lg border border-soft bg-white p-5 shadow-panel transition hover:-translate-y-0.5 hover:border-ink">
                  <p className="text-xs uppercase tracking-[0.14em] text-soft">{item.category}</p>
                  <h3 className="mt-3 text-base font-semibold leading-6 text-ink">{item.title}</h3>
                </a>
              ))}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}
