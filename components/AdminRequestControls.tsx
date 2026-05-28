'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminRequestControls({ id }: { id: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);

  async function update(action: 'approve' | 'reject') {
    setStatus('Updating...');
    const response = await fetch(`/api/admin-requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
    const data = await response.json();
    setStatus(response.ok ? 'Updated' : data.error || 'Unable to update');
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={() => void update('approve')} className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white">
        Approve
      </button>
      <button onClick={() => void update('reject')} className="rounded-full border border-soft px-4 py-2 text-xs font-semibold text-ink">
        Reject
      </button>
      {status ? <span className="text-xs text-soft">{status}</span> : null}
    </div>
  );
}
