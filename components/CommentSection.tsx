'use client';

import { useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import type { PublicComment } from '../lib/posts';

interface CommentSectionProps {
  postId: string;
  comments: PublicComment[];
}

export default function CommentSection({ postId, comments }: CommentSectionProps) {
  const { data: session } = useSession();
  const [items, setItems] = useState(comments);
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const grouped = useMemo(() => {
    const roots = items.filter((comment) => !comment.parentId);
    const replies = new Map<string, PublicComment[]>();
    for (const comment of items) {
      if (!comment.parentId) continue;
      replies.set(comment.parentId, [...(replies.get(comment.parentId) || []), comment]);
    }
    return { roots, replies };
  }, [items]);

  async function submit(parentId?: string) {
    if (!session?.user) {
      setStatus('Please sign in to join the discussion.');
      return;
    }

    setIsSubmitting(true);
    setStatus('Submitting...');
    const response = await fetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body, parentId })
    });
    const data = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      setStatus(data.error || 'Unable to submit comment.');
      return;
    }

    if (data.comment?.status === 'approved') {
      setItems((current) => [
        ...current,
        {
          id: data.comment._id,
          postId,
          authorId: data.comment.authorId,
          authorName: data.comment.authorName,
          body: data.comment.body,
          parentId: data.comment.parentId,
          status: data.comment.status,
          createdAt: data.comment.createdAt,
          updatedAt: data.comment.updatedAt
        }
      ]);
    }
    setBody('');
    setStatus(data.message || 'Comment submitted.');
  }

  return (
    <section className="mt-10 border-t border-soft pt-10">
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.18em] text-soft">Discussion</p>
        <h2 className="mt-2 text-2xl font-semibold text-ink">Measured responses</h2>
      </div>

      <div className="space-y-4">
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          className="min-h-28 w-full rounded-lg border border-soft bg-paper px-4 py-3 text-sm leading-7 text-ink outline-none transition focus:border-ink"
          placeholder={session?.user ? 'Add a thoughtful comment for moderation.' : 'Sign in to comment.'}
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={isSubmitting || !body.trim()}
            onClick={() => void submit()}
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-900 disabled:opacity-60"
          >
            Submit comment
          </button>
          {status ? <p className="text-sm text-soft">{status}</p> : null}
        </div>
      </div>

      <div className="mt-10 space-y-5">
        {grouped.roots.map((comment) => (
          <article key={comment.id} className="rounded-lg border border-soft bg-paper p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-semibold text-ink">{comment.authorName}</p>
              <time className="text-xs uppercase tracking-[0.14em] text-soft">
                {new Date(comment.createdAt).toLocaleDateString('en-IN')}
              </time>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-secondary">{comment.body}</p>
            {(grouped.replies.get(comment.id) || []).map((reply) => (
              <div key={reply.id} className="mt-5 border-l border-soft pl-4">
                <p className="text-sm font-semibold text-ink">{reply.authorName}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-secondary">{reply.body}</p>
              </div>
            ))}
          </article>
        ))}
        {!items.length ? <p className="text-sm text-soft">No approved comments yet.</p> : null}
      </div>
    </section>
  );
}
