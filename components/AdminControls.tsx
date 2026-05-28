'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function PostModerationControls({ id, featured }: { id: string; featured: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);

  async function update(body: Record<string, unknown>) {
    setStatus('Updating...');
    const response = await fetch(`/api/admin/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    setStatus(response.ok ? 'Updated' : data.error || 'Unable to update');
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
      {status ? <span className="text-xs text-soft">{status}</span> : null}
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
        <option value="admin">Admin</option>
      </select>
      {status ? <span className="text-xs text-soft">{status}</span> : null}
    </div>
  );
}
