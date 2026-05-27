import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import Navigation from '../../components/Navigation';
import PostEditor from '../../components/PostEditor';
import { authOptions } from '../../lib/auth';
import { getPostsForAuthor } from '../../lib/posts';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login?callbackUrl=/dashboard');

  const posts = await getPostsForAuthor(session.user.id);

  return (
    <main className="min-h-screen bg-paper text-ink">
      <Navigation />
      <section className="mx-auto max-w-5xl px-6 py-16 sm:px-8">
        <div className="mb-12 rounded-lg border border-soft bg-white p-8 shadow-panel sm:p-10">
          <p className="text-sm uppercase tracking-[0.18em] text-soft">Author desk</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">Publish your essay</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            Draft, revise, and submit reflective writing on student life, culture, scholarships, hostels, or identity in India.
          </p>
        </div>

        <div className="grid gap-8">
          <div className="rounded-lg border border-soft bg-white p-8 shadow-panel">
            <p className="text-sm uppercase tracking-[0.18em] text-soft">Signed in as</p>
            <h2 className="mt-3 text-2xl font-semibold text-ink">{session.user.name}</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              {session.user.email} / {session.user.role}
            </p>
          </div>
          <PostEditor />

          <section className="rounded-lg border border-soft bg-white p-8 shadow-panel">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-soft">Your work</p>
                <h2 className="mt-2 text-2xl font-semibold text-ink">Drafts and submissions</h2>
              </div>
            </div>
            <div className="grid gap-4">
              {posts.length ? (
                posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/dashboard/posts/${post.id}/edit`}
                    className="rounded-lg border border-soft bg-slate-50 p-5 transition hover:border-ink"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm uppercase tracking-[0.18em] text-soft">{post.status}</p>
                        <h3 className="mt-2 text-lg font-semibold text-ink">{post.title}</h3>
                      </div>
                      <span className="text-sm text-soft">{new Date(post.updatedAt).toLocaleDateString('en-IN')}</span>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm leading-7 text-slate-600">No drafts yet. Your first essay starts above.</p>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
