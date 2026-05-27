import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import Navigation from '../../components/Navigation';
import { PostModerationControls, UserRoleControl } from '../../components/AdminControls';
import { authOptions } from '../../lib/auth';
import { getAdminData } from '../../lib/posts';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login?callbackUrl=/admin');
  if (session.user.role !== 'admin') redirect('/dashboard');

  const { posts, users } = await getAdminData();

  return (
    <main className="min-h-screen bg-paper text-ink">
      <Navigation />
      <section className="mx-auto max-w-6xl px-6 py-16 sm:px-8">
        <div className="mb-10">
          <p className="text-sm uppercase tracking-[0.18em] text-soft">Admin</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">Moderation desk</h1>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.9fr]">
          <section className="rounded-lg border border-soft bg-white p-6 shadow-panel">
            <h2 className="text-2xl font-semibold text-ink">Posts</h2>
            <div className="mt-6 grid gap-4">
              {posts.map((post) => (
                <article key={post.id} className="rounded-lg border border-soft bg-slate-50 p-5">
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-soft">
                        {post.status} / {post.category} {post.featured ? '/ featured' : ''}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-ink">{post.title}</h3>
                      <p className="mt-2 text-sm text-soft">{post.author}</p>
                    </div>
                  </div>
                  <PostModerationControls id={post.id} featured={post.featured} />
                </article>
              ))}
              {!posts.length ? <p className="text-sm text-soft">No posts yet.</p> : null}
            </div>
          </section>

          <section className="rounded-lg border border-soft bg-white p-6 shadow-panel">
            <h2 className="text-2xl font-semibold text-ink">Users</h2>
            <div className="mt-6 grid gap-4">
              {users.map((user) => (
                <div key={user.id} className="rounded-lg border border-soft bg-slate-50 p-5">
                  <p className="font-semibold text-ink">{user.name}</p>
                  <p className="mt-1 text-sm text-soft">{user.email}</p>
                  <div className="mt-4">
                    <UserRoleControl id={user.id} role={user.role} />
                  </div>
                </div>
              ))}
              {!users.length ? <p className="text-sm text-soft">No users yet.</p> : null}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
