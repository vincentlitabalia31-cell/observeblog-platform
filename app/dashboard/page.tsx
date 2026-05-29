import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import Navigation from '../../components/Navigation';
import PostEditor from '../../components/PostEditor';
import AdminRequestButton from '../../components/AdminRequestButton';
import { authOptions } from '../../lib/auth';
import { getBookmarkedPostsForUser, getPostsForAuthor } from '../../lib/posts';
import { isUserSuspended } from '../../lib/users';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login?callbackUrl=/dashboard');

  const [posts, savedPosts, suspended] = await Promise.all([
    getPostsForAuthor(session.user.id),
    getBookmarkedPostsForUser(session.user.id),
    session.user.role === 'admin' ? Promise.resolve(false) : isUserSuspended(session.user.id)
  ]);
  const stats = {
    draft: posts.filter((post) => post.status === 'draft').length,
    pending: posts.filter((post) => post.status === 'pending').length,
    published: posts.filter((post) => post.status === 'published').length,
    rejected: posts.filter((post) => post.status === 'rejected').length,
    returned: posts.filter((post) => post.status === 'returned').length
  };

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
            <div className="mt-6 grid gap-3 sm:grid-cols-5">
              {Object.entries(stats).map(([label, value]) => (
                <div key={label} className="rounded-lg border border-soft bg-paper p-4">
                  <p className="text-2xl font-semibold text-ink">{value}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-soft">{label}</p>
                </div>
              ))}
            </div>
          </div>
          {session.user.role !== 'admin' ? <AdminRequestButton /> : null}
          <PostEditor suspended={suspended} />

          <section className="rounded-lg border border-soft bg-white p-8 shadow-panel">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-soft">Your work</p>
                <h2 className="mt-2 text-2xl font-semibold text-ink">Drafts and submissions</h2>
              </div>
            </div>
            <div className="grid gap-4">
              {posts.length ? (
                posts.map((post) => {
                  const canEdit = post.status === 'draft' || post.status === 'returned' || session.user.role === 'admin';
                  const content = (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm uppercase tracking-[0.18em] text-soft">{post.status}</p>
                        <h3 className="mt-2 text-lg font-semibold text-ink">{post.title}</h3>
                        {post.status === 'returned' && post.adminNotes ? (
                          <p className="mt-3 whitespace-pre-wrap rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
                            {post.adminNotes}
                          </p>
                        ) : null}
                      </div>
                      <span className="text-sm text-soft">{new Date(post.updatedAt).toLocaleDateString('en-IN')}</span>
                    </div>
                  );

                  return canEdit ? (
                    <Link
                      key={post.id}
                      href={`/dashboard/posts/${post.id}/edit`}
                      className="rounded-lg border border-soft bg-slate-50 p-5 transition hover:border-ink"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div key={post.id} className="rounded-lg border border-soft bg-slate-50 p-5">
                      {content}
                    </div>
                  );
                })
              ) : (
                <p className="text-sm leading-7 text-slate-600">No drafts yet. Your first essay starts above.</p>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-soft bg-white p-8 shadow-panel">
            <p className="text-sm uppercase tracking-[0.18em] text-soft">Saved</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">Bookmarked essays</h2>
            <div className="mt-6 grid gap-4">
              {savedPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/posts/${post.slug}`}
                  className="rounded-lg border border-soft bg-slate-50 p-5 transition hover:border-ink"
                >
                  <p className="text-sm uppercase tracking-[0.18em] text-soft">{post.category}</p>
                  <h3 className="mt-2 text-lg font-semibold text-ink">{post.title}</h3>
                </Link>
              ))}
              {!savedPosts.length ? <p className="text-sm leading-7 text-slate-600">Saved essays will appear here.</p> : null}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
