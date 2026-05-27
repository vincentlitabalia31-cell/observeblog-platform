import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import Navigation from '../../../../../components/Navigation';
import PostEditor from '../../../../../components/PostEditor';
import { authOptions } from '../../../../../lib/auth';
import { getEditablePost } from '../../../../../lib/posts';

interface Params {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const post = await getEditablePost(id, session.user.id, session.user.role);
  if (!post) notFound();

  return (
    <main className="min-h-screen bg-paper text-ink">
      <Navigation />
      <section className="mx-auto max-w-5xl px-6 py-16 sm:px-8">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.18em] text-soft">Editing / {post.status}</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">{post.title}</h1>
        </div>
        <PostEditor post={post} />
      </section>
    </main>
  );
}
