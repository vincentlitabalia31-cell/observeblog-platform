import Link from 'next/link';
import Navigation from '../components/Navigation';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <Navigation />
      <section className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6 py-20 sm:px-8">
        <div className="rounded-lg border border-soft bg-white p-12 text-center shadow-panel">
          <p className="text-sm uppercase tracking-[0.18em] text-soft">Page not found</p>
          <h1 className="mt-5 text-4xl font-semibold text-ink">We could not find that essay.</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Return to the publication or explore the latest student reflections.
          </p>
          <Link
            href="/posts"
            className="mt-8 inline-flex rounded-full border border-soft bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
          >
            Browse essays
          </Link>
        </div>
      </section>
    </main>
  );
}
