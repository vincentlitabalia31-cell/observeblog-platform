import Navigation from '../../components/Navigation';
import EditorialCard from '../../components/EditorialCard';
import { searchPublicPosts } from '../../lib/posts';

export const dynamic = 'force-dynamic';

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const query = searchParams.q?.trim() || '';
  const posts = await searchPublicPosts(query);

  return (
    <main className="min-h-screen bg-paper text-ink">
      <Navigation />
      <section className="mx-auto max-w-6xl px-6 py-16 sm:px-8">
        <p className="text-sm uppercase tracking-[0.18em] text-soft">Discovery</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">Search essays and contributors.</h1>
        <form className="mt-8 flex flex-col gap-3 sm:flex-row" action="/search">
          <input
            name="q"
            defaultValue={query}
            className="min-h-12 flex-1 rounded-lg border border-soft bg-white px-4 text-sm outline-none transition focus:border-ink"
            placeholder="Search culture, scholarships, identity, campus life..."
          />
          <button className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-900">
            Search
          </button>
        </form>

        <div className="mt-12 grid gap-6">
          {posts.map((post) => (
            <EditorialCard
              key={post.id}
              title={post.title}
              excerpt={post.excerpt}
              slug={post.slug}
              author={post.author}
              publishedAt={post.publishedAt ?? post.createdAt}
              category={post.category}
            />
          ))}
          {!posts.length ? <p className="text-sm text-soft">No essays matched that search.</p> : null}
        </div>
      </section>
    </main>
  );
}
