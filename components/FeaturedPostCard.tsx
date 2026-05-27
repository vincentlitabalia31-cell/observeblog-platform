import Link from 'next/link';

interface FeaturedPostCardProps {
  title: string;
  excerpt: string;
  slug: string;
  author: string;
  publishedAt: string;
  category: string;
  tags: string[];
}

export default function FeaturedPostCard({ title, excerpt, slug, author, publishedAt, category, tags }: FeaturedPostCardProps) {
  return (
    <article className="group overflow-hidden rounded-lg border border-soft bg-white p-8 shadow-panel transition hover:-translate-y-1 hover:shadow-xl">
      <div className="mb-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-soft">
        <span className="rounded-full border border-soft px-3 py-1">{category}</span>
        {tags.slice(0, 2).map((tag) => (
          <span key={tag} className="rounded-full border border-soft px-3 py-1">
            {tag}
          </span>
        ))}
      </div>
      <Link href={`/posts/${slug}`} className="group-hover:text-slate-900">
        <h3 className="text-2xl font-semibold leading-tight text-ink">{title}</h3>
      </Link>
      <p className="mt-4 text-base leading-8 text-slate-600">{excerpt}</p>
      <div className="mt-6 flex items-center justify-between text-sm text-soft">
        <span>{author}</span>
        <span>{new Date(publishedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
      </div>
    </article>
  );
}
