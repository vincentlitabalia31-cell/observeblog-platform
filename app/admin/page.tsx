import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import Navigation from '../../components/Navigation';
import { PostModerationControls, UserRoleControl } from '../../components/AdminControls';
import AdminCommentControls from '../../components/AdminCommentControls';
import AdminRequestControls from '../../components/AdminRequestControls';
import MarkdownRenderer from '../../components/MarkdownRenderer';
import { authOptions } from '../../lib/auth';
import { getAdminData } from '../../lib/posts';
import { listAdminRequests } from '../../lib/roles';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login?callbackUrl=/admin');
  if (session.user.role !== 'admin') redirect('/dashboard');

  const [{ posts, users, comments, stats }, adminRequests] = await Promise.all([getAdminData(), listAdminRequests()]);

  return (
    <main className="min-h-screen bg-paper text-ink">
      <Navigation />
      <section className="mx-auto max-w-6xl px-6 py-16 sm:px-8">
        <div className="mb-10">
          <p className="text-sm uppercase tracking-[0.18em] text-soft">Admin</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">Moderation desk</h1>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Pending posts', stats.pendingPosts],
            ['Published', stats.publishedPosts],
            ['Pending comments', stats.pendingComments],
            ['Subscribers', stats.subscribers]
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-soft bg-white p-5 shadow-panel">
              <p className="text-3xl font-semibold text-ink">{value}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.14em] text-soft">{label}</p>
            </div>
          ))}
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
                      <p className="mt-2 text-sm text-soft">
                        {post.author} / Updated{' '}
                        {new Date(post.updatedAt).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/posts/${post.id}/edit`}
                      className="rounded-full border border-soft px-4 py-2 text-xs font-semibold text-ink transition hover:border-ink"
                    >
                      Edit
                    </Link>
                  </div>
                  {post.adminNotes ? (
                    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">Admin notes</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-amber-950">{post.adminNotes}</p>
                    </div>
                  ) : null}
                  <div className="mb-4 border-t border-soft pt-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-soft">Full article</p>
                    <MarkdownRenderer content={post.content} />
                  </div>
                  <PostModerationControls id={post.id} featured={post.featured} />
                </article>
              ))}
              {!posts.length ? <p className="text-sm text-soft">No posts yet.</p> : null}
            </div>
          </section>

          <div className="grid gap-8">
            <section className="rounded-lg border border-soft bg-white p-6 shadow-panel">
              <h2 className="text-2xl font-semibold text-ink">Admin requests</h2>
              <div className="mt-6 grid gap-4">
                {adminRequests.map((request) => (
                  <article key={request.id} className="rounded-lg border border-soft bg-slate-50 p-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-soft">{request.status}</p>
                    <p className="mt-2 font-semibold text-ink">{request.email}</p>
                    <p className="mt-1 text-sm text-soft">
                      {new Date(request.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                    {request.status === 'pending' ? (
                      <div className="mt-4">
                        <AdminRequestControls id={request.id} />
                      </div>
                    ) : null}
                  </article>
                ))}
                {!adminRequests.length ? <p className="text-sm text-soft">No admin requests yet.</p> : null}
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

            <section className="rounded-lg border border-soft bg-white p-6 shadow-panel">
              <h2 className="text-2xl font-semibold text-ink">Comments</h2>
              <div className="mt-6 grid gap-4">
                {comments.map((comment) => (
                  <article key={comment.id} className="rounded-lg border border-soft bg-slate-50 p-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-soft">{comment.status}</p>
                    <p className="mt-3 text-sm leading-7 text-slate-700">{comment.body}</p>
                    <p className="mt-3 text-sm font-semibold text-ink">{comment.authorName}</p>
                    <div className="mt-4">
                      <AdminCommentControls id={comment.id} />
                    </div>
                  </article>
                ))}
                {!comments.length ? <p className="text-sm text-soft">No comments yet.</p> : null}
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
