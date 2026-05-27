import Navigation from '../../components/Navigation';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <Navigation />
      <section className="mx-auto max-w-4xl px-6 py-16 sm:px-8">
        <p className="text-sm uppercase tracking-[0.18em] text-soft">About</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">A publication for careful student observation.</h1>
        <div className="mt-8 space-y-6 text-lg leading-8 text-slate-700">
          <p>
            Observing India gathers essays from international students, local students, and scholars who are thinking
            seriously about education, identity, culture, and everyday university life.
          </p>
          <p>
            The editorial aim is calm and reflective: writing that notices details, respects complexity, and treats
            campus experience as a serious field of inquiry.
          </p>
        </div>
      </section>
    </main>
  );
}
