'use client';

import { useState } from 'react';

export default function AdminRequestButton() {
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit() {
    setIsSubmitting(true);
    setStatus('Submitting request...');
    const response = await fetch('/api/admin-requests', { method: 'POST' });
    const data = await response.json();
    setIsSubmitting(false);
    setStatus(response.ok ? 'Request submitted for review.' : data.error || 'Unable to submit request.');
  }

  return (
    <div className="rounded-lg border border-soft bg-white p-8 shadow-panel">
      <p className="text-sm uppercase tracking-[0.18em] text-soft">Admin access</p>
      <h2 className="mt-3 text-2xl font-semibold text-ink">Request editorial admin permissions</h2>
      <p className="mt-3 text-sm leading-7 text-slate-600">
        Contributors can request admin access for moderation work. Approval is reviewed by an existing admin.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => void submit()}
          className="rounded-full border border-soft bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-ink disabled:opacity-60"
        >
          Request admin access
        </button>
        {status ? <p className="text-sm text-soft">{status}</p> : null}
      </div>
    </div>
  );
}
