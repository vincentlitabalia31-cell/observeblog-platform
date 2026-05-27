import Navigation from '../../../components/Navigation';
import EditorialCard from '../../../components/EditorialCard';
import { getPostsByCategory } from '../../../lib/posts';

interface Params {
  params: Promise<{ category: string }>;
}

function titleize(value: string) {
  return decodeURIComponent(value)
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default async function CategoryPage({ params }: Params) {
  const { category: categoryParam } = await params;
  const category = titleize(categoryParam);
  const posts = await getPostsByCategory(category);

  return (
    <main className="min-h-screen bg-paper text-ink">
      <Navigation />
      <section className="mx-auto max-w-6xl px-6 py-16 sm:px-8">
        <p className="text-sm uppercase tracking-[0.18em] text-soft">Category</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">{category}</h1>
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
          {!posts.length ? <p className="text-sm text-soft">No published essays in this category yet.</p> : null}
        </div>
      </section>
    </main>
  );
}
