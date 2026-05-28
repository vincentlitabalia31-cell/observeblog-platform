'use client';

import Link from 'next/link';
import { useState } from 'react';

const RESET_SUCCESS_MESSAGE = 'If an account exists with this email, a password reset link has been sent.';
const RESET_HELP_MESSAGE = 'Please check your inbox and spam folder.';
const RESET_ERROR_MESSAGE = 'Something went wrong. Please try again later.';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | 'loading'>('loading');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatusType('loading');
    setStatus('Sending reset instructions...');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        setStatusType('error');
        setStatus(RESET_ERROR_MESSAGE);
        return;
      }

      setStatusType('success');
      setStatus(`${RESET_SUCCESS_MESSAGE} ${RESET_HELP_MESSAGE}`);
    } catch {
      setStatusType('error');
      setStatus(RESET_ERROR_MESSAGE);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-paper text-ink">
      <section className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 py-16 sm:px-8">
        <div className="w-full rounded-lg border border-soft bg-white p-10 shadow-panel">
          <h1 className="text-3xl font-semibold text-ink">Reset your password</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Enter your account email and we will send a time-limited reset link.
          </p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-6">
            <label className="block text-sm font-medium text-ink">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-lg border border-soft bg-slate-50 px-4 py-3 text-sm text-ink outline-none transition focus:border-ink"
                required
              />
            </label>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:opacity-60"
            >
              {isSubmitting ? 'Sending...' : 'Send reset link'}
            </button>
            {status ? (
              <p
                className={`text-sm ${statusType === 'error' ? 'text-red-700' : 'text-soft'}`}
                role="status"
                aria-live="polite"
              >
                {status}
              </p>
            ) : null}
          </form>

          <p className="mt-8 text-sm text-slate-600">
            Remembered your password?{' '}
            <Link href="/login" className="font-semibold text-ink underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
