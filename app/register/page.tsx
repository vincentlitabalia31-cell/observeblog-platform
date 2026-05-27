'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus('Creating account...');

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });

    const data = await response.json();
    if (!response.ok) {
      setIsSubmitting(false);
      setStatus(data.error || 'Unable to create account.');
      return;
    }

    setStatus('Account created. Signing you in...');
    await signIn('credentials', {
      redirect: false,
      email: form.email,
      password: form.password
    });
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-paper text-ink">
      <section className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 py-16 sm:px-8">
        <div className="w-full rounded-lg border border-soft bg-white p-10 shadow-panel">
          <h1 className="text-3xl font-semibold text-ink">Create your contributor profile</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Register to publish essays, reflections, and student perspectives on Indian culture and campus life.
          </p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-6">
            <label className="block text-sm font-medium text-ink">
              Name
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="mt-2 w-full rounded-lg border border-soft bg-slate-50 px-4 py-3 text-sm text-ink outline-none transition focus:border-ink"
                required
              />
            </label>
            <label className="block text-sm font-medium text-ink">
              Email
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                className="mt-2 w-full rounded-lg border border-soft bg-slate-50 px-4 py-3 text-sm text-ink outline-none transition focus:border-ink"
                required
              />
            </label>
            <label className="block text-sm font-medium text-ink">
              Password
              <input
                type="password"
                minLength={8}
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                className="mt-2 w-full rounded-lg border border-soft bg-slate-50 px-4 py-3 text-sm text-ink outline-none transition focus:border-ink"
                required
              />
            </label>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:opacity-60"
            >
              Create account
            </button>
            {status ? <p className="text-sm text-soft">{status}</p> : null}
          </form>

          <p className="mt-8 text-sm text-slate-600">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-ink underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
