import Link from 'next/link';
import Navigation from '../components/Navigation';
import SectionHeader from '../components/SectionHeader';
import FeaturedPostCard from '../components/FeaturedPostCard';
import NewsletterForm from '../components/NewsletterForm';
import { getFeaturedPosts, getRecentPosts } from '../lib/posts';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const posts = await getRecentPosts();
  const featuredPosts = await getFeaturedPosts();
  const sidebarPosts = featuredPosts.length ? featuredPosts : posts.slice(0, 3);

  return (
    <main className="min-h-screen bg-paper text-ink">
      <Navigation />
      <section className="mx-auto max-w-6xl px-6 py-16 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-8">
            <span className="inline-flex rounded-full bg-ink/5 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-ink">
              Editorial publication
            </span>
            <div className="space-y-6">
              <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-tight text-ink sm:text-6xl">
                Observing India: essays from students shaping the dialogue around campus life and culture.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                A calm publication platform for international and Indian students to reflect on education, identity,
                scholarships, and the social world of Indian universities.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link href="/posts" className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-900">
                Explore essays
              </Link>
              <Link href="/dashboard" className="rounded-full border border-soft bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:border-ink">
                Share your perspective
              </Link>
            </div>
          </div>
          <aside className="space-y-8 rounded-[2rem] border border-soft bg-white p-8 shadow-panel">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.3em] text-soft">Featured themes</p>
              <h2 className="text-3xl font-semibold text-ink">Fresh reportage from the student mind</h2>
            </div>
            <p className="text-sm leading-7 text-slate-600">
              Discover essays that combine observation, academic critique, and cultural nuance across campus, outdoors,
              and inside hostel walls.
            </p>
            <div className="grid gap-4">
              {sidebarPosts.map((post) => (
                <div key={post.slug} className="rounded-lg border border-soft bg-slate-50 p-5">
                  <p className="mb-2 text-xs uppercase tracking-[0.18em] text-soft">{post.category}</p>
                  <p className="text-sm font-semibold text-ink">{post.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600 line-clamp-3">{post.excerpt}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 pb-20 sm:px-8">
        <SectionHeader title="Latest essays" subtitle="Recent contributions" />
        <div className="grid gap-8 lg:grid-cols-2">
          {posts.map((post) => (
            <FeaturedPostCard
              key={post.slug}
              title={post.title}
              excerpt={post.excerpt}
              slug={post.slug}
              author={post.author}
              publishedAt={post.publishedAt ?? post.createdAt}
              category={post.category}
              tags={post.tags || []}
            />
          ))}
        </div>
        <div className="mt-12">
          <NewsletterForm />
        </div>
      </section>
    </main>
  );
}
