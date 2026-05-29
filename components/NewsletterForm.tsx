'use client';

import { useState } from 'react';

export default function NewsletterForm() {
  const [form, setForm] = useState({ email: '', name: '', frequency: 'weekly' });
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus('Subscribing...');
    const response = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await response.json();
    setIsSubmitting(false);
    setStatus(response.ok ? 'You are subscribed.' : data.error || 'Unable to subscribe.');
    if (response.ok) setForm({ email: '', name: '', frequency: form.frequency });
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-lg border border-soft bg-white p-6 shadow-panel">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-soft">Newsletter</p>
        <h2 className="mt-2 text-2xl font-semibold text-ink">Essays in your inbox</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <input
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          className="rounded-lg border border-soft bg-paper px-4 py-3 text-sm outline-none transition focus:border-ink"
          placeholder="Name"
        />
        <input
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          className="rounded-lg border border-soft bg-paper px-4 py-3 text-sm outline-none transition focus:border-ink"
          placeholder="Email"
          required
        />
        <select
          value={form.frequency}
          onChange={(event) => setForm({ ...form, frequency: event.target.value })}
          className="rounded-lg border border-soft bg-paper px-4 py-3 text-sm outline-none transition focus:border-ink"
        >
          <option value="immediate">Immediate</option>
          <option value="weekly">Weekly</option>
          <option value="daily">Daily</option>
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-900 disabled:opacity-60"
        >
          Subscribe
        </button>
        {status ? <p className="text-sm text-soft">{status}</p> : null}
      </div>
    </form>
  );
}
