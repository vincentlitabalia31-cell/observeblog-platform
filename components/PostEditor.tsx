'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PublicPost } from '../lib/posts';

interface PostEditorProps {
  post?: PublicPost;
}

export default function PostEditor({ post }: PostEditorProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: post?.title || '',
    excerpt: post?.excerpt || '',
    slug: post?.slug || '',
    coverImage: post?.coverImage || '',
    category: post?.category || 'Campus Life',
    tags: post?.tags.join(', ') || '',
    content: post?.content || ''
  });
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (publishAction: 'draft' | 'publish') => {
    setIsSaving(true);
    setStatus(publishAction === 'draft' ? 'Saving draft...' : 'Submitting...');

    const response = await fetch(post ? `/api/posts/${post.id}` : '/api/posts', {
      method: post ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        excerpt: form.excerpt,
        content: form.content,
        coverImage: form.coverImage,
        category: form.category,
        tags: form.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        publishAction,
        slug: form.slug || form.title
      })
    });

    const data = await response.json();
    setIsSaving(false);
    if (!response.ok) {
      setStatus(data.error || 'Unable to save post.');
      return;
    }

    setStatus(data.message || 'Post saved.');
    router.refresh();
  };

  const handleDelete = async () => {
    if (!post || !window.confirm('Delete this essay permanently?')) return;
    setIsSaving(true);
    setStatus('Deleting...');
    const response = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' });
    const data = await response.json();
    setIsSaving(false);
    if (!response.ok) {
      setStatus(data.error || 'Unable to delete post.');
      return;
    }
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit('draft');
      }}
      className="space-y-6 rounded-lg border border-soft bg-white p-8 shadow-panel"
    >
      <div>
        <label className="mb-2 block text-sm font-medium text-ink">Title</label>
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full rounded-lg border border-soft bg-slate-50 px-4 py-3 text-sm text-ink outline-none transition focus:border-ink"
          placeholder="A thoughtful reflection on campus culture"
          required
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_0.7fr]">
        <label className="block text-sm font-medium text-ink">
          Excerpt
          <textarea
            value={form.excerpt}
            onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
            className="mt-2 h-28 w-full rounded-lg border border-soft bg-slate-50 px-4 py-3 text-sm text-ink outline-none transition focus:border-ink"
            placeholder="Summarize your essay in one reflective paragraph"
            required
          />
        </label>
        <div className="grid gap-4">
          <label className="block text-sm font-medium text-ink">
            Category
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="mt-2 w-full rounded-lg border border-soft bg-slate-50 px-4 py-3 text-sm text-ink outline-none transition focus:border-ink"
            >
              <option>Campus Life</option>
              <option>Education</option>
              <option>Scholarships</option>
              <option>Indian Culture</option>
              <option>Identity</option>
              <option>Social Observations</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-ink">
            Tags
            <input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className="mt-2 w-full rounded-lg border border-soft bg-slate-50 px-4 py-3 text-sm text-ink outline-none transition focus:border-ink"
              placeholder="hostel life, classrooms, language"
            />
          </label>
        </div>
      </div>
      <label className="block text-sm font-medium text-ink">
        Slug
        <input
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
          className="mt-2 w-full rounded-lg border border-soft bg-slate-50 px-4 py-3 text-sm text-ink outline-none transition focus:border-ink"
          placeholder="auto-generated-from-title"
        />
      </label>
      <label className="block text-sm font-medium text-ink">
        Cover image URL (optional)
        <input
          value={form.coverImage}
          onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
          className="mt-2 w-full rounded-lg border border-soft bg-slate-50 px-4 py-3 text-sm text-ink outline-none transition focus:border-ink"
          placeholder="https://images.unsplash.com/..."
          inputMode="url"
        />
      </label>
      <div>
        <label className="mb-2 block text-sm font-medium text-ink">Content (Markdown supported)</label>
        <textarea
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          className="min-h-[300px] w-full rounded-lg border border-soft bg-slate-50 px-4 py-4 text-sm leading-7 text-ink outline-none transition focus:border-ink"
          placeholder="Write with care and reflection. Use headings, lists, links, and block quotes."
          required
        />
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-soft">{status || 'Drafts stay private until submitted for review.'}</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          {post ? (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void handleDelete()}
              className="rounded-full border border-soft bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:border-ink disabled:opacity-60"
            >
              Delete
            </button>
          ) : null}
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-full border border-soft bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:border-ink disabled:opacity-60"
          >
            Save draft
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => void handleSubmit('publish')}
            className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:opacity-60"
          >
            Submit for review
          </button>
        </div>
      </div>
    </form>
  );
}
