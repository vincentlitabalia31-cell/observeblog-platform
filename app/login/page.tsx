'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import PasswordInput from '../../components/PasswordInput';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const [form, setForm] = useState({ email: '', password: '' });
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus('Signing in...');
    const result = await signIn('credentials', {
      redirect: false,
      email: form.email,
      password: form.password
    });

    setIsSubmitting(false);
    if (result?.error) {
      setStatus('Invalid credentials. Please try again.');
      return;
    }

    setStatus('Signed in successfully. Redirecting...');
    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-paper text-ink">
      <section className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 py-16 sm:px-8">
        <div className="w-full rounded-lg border border-soft bg-white p-10 shadow-panel">
          <h1 className="text-3xl font-semibold text-ink">Sign in to Observing India</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Continue as a contributor and publish reflective pieces about campus life, culture, and education.
          </p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-6">
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
            <PasswordInput
              label="Password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              autoComplete="current-password"
              required
            />
            <div className="text-right text-sm">
              <Link href="/forgot-password" className="font-semibold text-ink underline-offset-4 hover:underline">
                Forgot password?
              </Link>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:opacity-60"
            >
              Continue
            </button>
            {status ? <p className="text-sm text-soft">{status}</p> : null}
          </form>

          <p className="mt-8 text-sm text-slate-600">
            New here?{' '}
            <Link href="/register" className="font-semibold text-ink underline-offset-4 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
