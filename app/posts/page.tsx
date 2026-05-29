import Navigation from '../../components/Navigation';
import EditorialCard from '../../components/EditorialCard';
import NewsletterForm from '../../components/NewsletterForm';
import { getAllPublicPosts } from '../../lib/posts';

export const dynamic = 'force-dynamic';

export default async function PostsPage() {
  const posts = await getAllPublicPosts();

  return (
    <main className="min-h-screen bg-paper text-ink">
      <Navigation />
      <section className="mx-auto max-w-6xl px-6 py-16 sm:px-8">
        <div className="space-y-5">
          <p className="text-sm uppercase tracking-[0.3em] text-soft">Essays</p>
          <h1 className="text-4xl font-semibold tracking-tight text-ink sm:text-5xl">A thoughtful collection of student reflections.</h1>
          <p className="max-w-3xl text-lg leading-8 text-slate-600">
            Browse articles about education, hostels, identity, scholarships, and the contours of academic life in India.
          </p>
        </div>
        <div className="mt-12 grid gap-6">
          {posts.map((post) => (
            <EditorialCard
              key={post.slug}
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
        <div className="mt-12">
          <NewsletterForm />
        </div>
      </section>
    </main>
  );
}
