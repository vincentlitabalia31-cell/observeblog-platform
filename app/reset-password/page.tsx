'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string | null>(token ? null : 'This reset link is invalid or has expired.');
  const [isComplete, setIsComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus('Updating password...');

    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password })
    });

    const data = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      setStatus(data.error || 'Unable to reset password.');
      return;
    }

    setIsComplete(true);
    setPassword('');
    setStatus(data.message || 'Password updated successfully. You can now sign in.');
  };

  return (
    <main className="min-h-screen bg-paper text-ink">
      <section className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 py-16 sm:px-8">
        <div className="w-full rounded-lg border border-soft bg-white p-10 shadow-panel">
          <h1 className="text-3xl font-semibold text-ink">Choose a new password</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Use at least 8 characters. Your reset link can only be used once.
          </p>

          {!isComplete && token ? (
            <form onSubmit={handleSubmit} className="mt-10 space-y-6">
              <label className="block text-sm font-medium text-ink">
                New password
                <input
                  type="password"
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-soft bg-slate-50 px-4 py-3 text-sm text-ink outline-none transition focus:border-ink"
                  required
                />
              </label>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:opacity-60"
              >
                Update password
              </button>
            </form>
          ) : null}

          {status ? <p className="mt-6 text-sm text-soft">{status}</p> : null}

          <p className="mt-8 text-sm text-slate-600">
            Return to{' '}
            <Link href="/login" className="font-semibold text-ink underline-offset-4 hover:underline">
              sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
