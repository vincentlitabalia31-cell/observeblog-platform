import { notFound } from 'next/navigation';
import Navigation from '../../../components/Navigation';
import EditorialCard from '../../../components/EditorialCard';
import { getProfileWithPosts } from '../../../lib/posts';

interface Params {
  params: Promise<{ id: string }>;
}

export default async function ProfilePage({ params }: Params) {
  const { id } = await params;
  const data = await getProfileWithPosts(id);
  if (!data) notFound();

  return (
    <main className="min-h-screen bg-paper text-ink">
      <Navigation />
      <section className="mx-auto max-w-5xl px-6 py-16 sm:px-8">
        <div className="rounded-lg border border-soft bg-white p-8 shadow-panel">
          <p className="text-sm uppercase tracking-[0.18em] text-soft">{data.profile.role}</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">{data.profile.name}</h1>
          {data.profile.affiliation ? <p className="mt-3 text-sm text-soft">{data.profile.affiliation}</p> : null}
          {data.profile.bio ? <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-700">{data.profile.bio}</p> : null}
        </div>

        <div className="mt-10 grid gap-6">
          {data.posts.map((post) => (
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
          {!data.posts.length ? <p className="text-sm text-soft">No published essays yet.</p> : null}
        </div>
      </section>
    </main>
  );
}
