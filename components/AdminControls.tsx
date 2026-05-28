'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function PostModerationControls({ id, featured }: { id: string; featured: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [returnOpen, setReturnOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  async function update(body: Record<string, unknown>) {
    setStatus('Updating...');
    const response = await fetch(`/api/admin/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    setStatus(response.ok ? 'Updated' : data.error || 'Unable to update');
    if (response.ok) {
      setReturnOpen(false);
      setAdminNotes('');
    }
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={() => void update({ action: 'approve' })} className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white">
        Approve
      </button>
      <button onClick={() => void update({ action: 'reject' })} className="rounded-full border border-soft px-4 py-2 text-xs font-semibold text-ink">
        Reject
      </button>
      <button
        onClick={() => void update({ featured: !featured })}
        className="rounded-full border border-soft px-4 py-2 text-xs font-semibold text-ink"
      >
        {featured ? 'Unfeature' : 'Feature'}
      </button>
      <button onClick={() => setReturnOpen(true)} className="rounded-full border border-soft px-4 py-2 text-xs font-semibold text-ink">
        Return with Notes
      </button>
      {status ? <span className="text-xs text-soft">{status}</span> : null}
      {returnOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
          <div className="w-full max-w-lg rounded-lg border border-soft bg-white p-6 shadow-panel">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-ink">Return to contributor</h3>
              <p className="mt-1 text-sm text-soft">Add revision notes that will be emailed and shown in the contributor dashboard.</p>
            </div>
            <textarea
              value={adminNotes}
              onChange={(event) => setAdminNotes(event.target.value)}
              className="min-h-36 w-full rounded-lg border border-soft bg-slate-50 px-4 py-3 text-sm leading-6 text-ink outline-none transition focus:border-ink"
              placeholder="Explain what needs revision before this can be published."
              required
            />
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setReturnOpen(false)}
                className="rounded-full border border-soft bg-white px-5 py-2 text-xs font-semibold text-ink transition hover:border-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!adminNotes.trim()}
                onClick={() => void update({ action: 'return', adminNotes })}
                className="rounded-full bg-ink px-5 py-2 text-xs font-semibold text-white transition hover:bg-slate-900 disabled:opacity-60"
              >
                Return
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function UserRoleControl({ id, role }: { id: string; role: 'contributor' | 'admin' }) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);

  async function update(nextRole: 'contributor' | 'admin') {
    setStatus('Updating...');
    const response = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: nextRole })
    });
    const data = await response.json();
    setStatus(response.ok ? 'Updated' : data.error || 'Unable to update');
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={role}
        onChange={(event) => void update(event.target.value as 'contributor' | 'admin')}
        className="rounded-lg border border-soft bg-white px-3 py-2 text-xs text-ink"
      >
        <option value="contributor">Contributor</option>
        <option value="admin" disabled>
          Admin via request approval
        </option>
      </select>
      {status ? <span className="text-xs text-soft">{status}</span> : null}
    </div>
  );
}
