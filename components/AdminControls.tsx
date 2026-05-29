'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

function ConfirmModal({
  title,
  message,
  confirmLabel,
  onCancel,
  onConfirm,
  dangerous
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  dangerous?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
      <div className="w-full max-w-lg rounded-lg border border-soft bg-white p-6 shadow-panel">
        <h3 className="text-lg font-semibold text-ink">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-soft bg-white px-5 py-2 text-xs font-semibold text-ink transition hover:border-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-full px-5 py-2 text-xs font-semibold text-white transition ${
              dangerous ? 'bg-red-800 hover:bg-red-900' : 'bg-ink hover:bg-slate-900'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PostModerationControls({
  id,
  featured,
  published,
  status
}: {
  id: string;
  featured: boolean;
  published: boolean;
  status: string;
}) {
  const router = useRouter();
  const [statusText, setStatusText] = useState<string | null>(null);
  const [returnOpen, setReturnOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [confirm, setConfirm] = useState<'delete' | null>(null);

  async function update(body: Record<string, unknown>, method: 'PATCH' | 'DELETE' = 'PATCH') {
    setStatusText('Updating...');
    const response = await fetch(`/api/admin/posts/${id}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: method === 'DELETE' ? undefined : JSON.stringify(body)
    });
    const data = await response.json();
    setStatusText(response.ok ? data.message || 'Updated' : data.error || 'Unable to update');
    if (response.ok) {
      setReturnOpen(false);
      setAdminNotes('');
      setConfirm(null);
    }
    router.refresh();
  }

  const isPublished = published && status === 'published';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {!isPublished ? (
          <>
            <button
              onClick={() => void update({ action: 'approve' })}
              className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white"
            >
              Publish
            </button>
            <button
              onClick={() => void update({ action: 'reject' })}
              className="rounded-full border border-soft px-4 py-2 text-xs font-semibold text-ink"
            >
              Reject
            </button>
            <button onClick={() => setReturnOpen(true)} className="rounded-full border border-soft px-4 py-2 text-xs font-semibold text-ink">
              Return with Notes
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => void update({ action: 'unpublish' })}
              className="rounded-full border border-soft px-4 py-2 text-xs font-semibold text-ink"
            >
              Unpublish
            </button>
            {featured ? (
              <button
                onClick={() => void update({ action: 'unfeature' })}
                className="rounded-full border border-soft px-4 py-2 text-xs font-semibold text-ink"
              >
                Unfeature
              </button>
            ) : (
              <button
                onClick={() => void update({ action: 'feature' })}
                className="rounded-full border border-soft px-4 py-2 text-xs font-semibold text-ink"
              >
                Feature
              </button>
            )}
          </>
        )}
        <button
          onClick={() => setConfirm('delete')}
          className="rounded-full border border-red-300 px-4 py-2 text-xs font-semibold text-red-800"
        >
          Delete Essay
        </button>
      </div>
      {statusText ? <span className="text-xs text-soft">{statusText}</span> : null}

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

      {confirm === 'delete' ? (
        <ConfirmModal
          title="Delete essay permanently?"
          message="This removes the essay from the database and all public views. This cannot be undone."
          confirmLabel="Delete essay"
          dangerous
          onCancel={() => setConfirm(null)}
          onConfirm={() => void update({}, 'DELETE')}
        />
      ) : null}
    </div>
  );
}

export function UserModerationControls({
  id,
  role,
  suspended
}: {
  id: string;
  role: 'contributor' | 'admin';
  suspended: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<'suspend' | null>(null);

  async function update(body: Record<string, unknown>) {
    setStatus('Updating...');
    const response = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    setStatus(response.ok ? data.message || 'Updated' : data.error || 'Unable to update');
    if (response.ok) setConfirm(null);
    router.refresh();
  }

  if (role === 'admin') {
    return <p className="text-xs text-soft">Admin account</p>;
  }

  return (
    <div className="space-y-2">
      <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${suspended ? 'text-red-700' : 'text-soft'}`}>
        {suspended ? 'Suspended' : 'Active contributor'}
      </p>
      <div className="flex flex-wrap gap-2">
        {suspended ? (
          <button
            onClick={() => void update({ action: 'unsuspend' })}
            className="rounded-full border border-soft px-4 py-2 text-xs font-semibold text-ink"
          >
            Unsuspend
          </button>
        ) : (
          <button
            onClick={() => setConfirm('suspend')}
            className="rounded-full border border-red-300 px-4 py-2 text-xs font-semibold text-red-800"
          >
            Suspend User
          </button>
        )}
      </div>
      {status ? <span className="text-xs text-soft">{status}</span> : null}
      {confirm === 'suspend' ? (
        <ConfirmModal
          title="Suspend this contributor?"
          message="They can still sign in, but will not be able to create or submit essays until unsuspended."
          confirmLabel="Suspend user"
          dangerous
          onCancel={() => setConfirm(null)}
          onConfirm={() => void update({ action: 'suspend' })}
        />
      ) : null}
    </div>
  );
}

export function SubscriberDeleteControl({ id, email }: { id: string; email: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);

  async function remove() {
    setStatus('Removing...');
    const response = await fetch(`/api/admin/subscribers/${id}`, { method: 'DELETE' });
    const data = await response.json();
    setStatus(response.ok ? data.message || 'Removed' : data.error || 'Unable to remove');
    if (response.ok) setConfirm(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => setConfirm(true)}
        className="rounded-full border border-red-300 px-4 py-2 text-xs font-semibold text-red-800"
      >
        Remove subscriber
      </button>
      {status ? <span className="text-xs text-soft">{status}</span> : null}
      {confirm ? (
        <ConfirmModal
          title="Remove newsletter subscriber?"
          message={`Remove ${email} from the newsletter list. They will no longer receive emails.`}
          confirmLabel="Remove email"
          dangerous
          onCancel={() => setConfirm(false)}
          onConfirm={() => void remove()}
        />
      ) : null}
    </div>
  );
}

/** @deprecated Use UserModerationControls */
export function UserRoleControl({ id, role }: { id: string; role: 'contributor' | 'admin' }) {
  return <UserModerationControls id={id} role={role} suspended={false} />;
}
