export default function Loading() {
  return (
    <main className="min-h-screen bg-paper px-6 py-16 text-ink">
      <div className="mx-auto max-w-5xl">
        <div className="h-4 w-40 animate-pulse rounded bg-black/10" />
        <div className="mt-6 h-12 max-w-2xl animate-pulse rounded bg-black/10" />
        <div className="mt-10 grid gap-4">
          <div className="h-32 animate-pulse rounded-lg bg-black/10" />
          <div className="h-32 animate-pulse rounded-lg bg-black/10" />
        </div>
      </div>
    </main>
  );
}
