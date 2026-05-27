import Link from 'next/link';
import Navigation from '../../components/Navigation';
import EditorialCard from '../../components/EditorialCard';
import { getArchiveData } from '../../lib/posts';

export default async function ArchivePage() {
  const { posts, categories } = await getArchiveData();

  return (
    <main className="min-h-screen bg-paper text-ink">
      <Navigation />
      <section className="mx-auto max-w-6xl px-6 py-16 sm:px-8">
        <p className="text-sm uppercase tracking-[0.18em] text-soft">Archive</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">Browse the publication.</h1>
        <div className="mt-8 flex flex-wrap gap-3">
          {categories.map((category) => (
            <Link
              key={category}
              href={`/categories/${encodeURIComponent(category.toLowerCase().replace(/\s+/g, '-'))}`}
              className="rounded-full border border-soft bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-ink"
            >
              {category}
            </Link>
          ))}
        </div>
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
          {!posts.length ? <p className="text-sm text-soft">No published essays yet.</p> : null}
        </div>
      </section>
    </main>
  );
}
