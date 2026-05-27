import Link from 'next/link';

interface EditorialCardProps {
  title: string;
  excerpt: string;
  slug: string;
  author: string;
  publishedAt: string;
  category?: string;
}

export default function EditorialCard({ title, excerpt, slug, author, publishedAt, category }: EditorialCardProps) {
  return (
    <Link href={`/posts/${slug}`} className="group block rounded-lg border border-soft bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-panel">
      {category ? <p className="mb-3 text-xs uppercase tracking-[0.18em] text-soft">{category}</p> : null}
      <h3 className="text-xl font-semibold text-ink transition group-hover:text-slate-900">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">{excerpt}</p>
      <div className="mt-5 flex items-center justify-between text-sm text-soft">
        <span>{author}</span>
        <span>{new Date(publishedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
      </div>
    </Link>
  );
}
