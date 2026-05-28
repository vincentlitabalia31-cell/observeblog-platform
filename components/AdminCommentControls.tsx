'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminCommentControls({ id }: { id: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);

  async function update(action: 'approve' | 'reject' | 'flag' | 'delete') {
    setStatus('Updating...');
    const response = await fetch(`/api/admin/comments/${id}`, {
      method: action === 'delete' ? 'DELETE' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: action === 'delete' ? undefined : JSON.stringify({ action })
    });
    const data = await response.json();
    setStatus(response.ok ? 'Updated' : data.error || 'Unable to update');
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={() => void update('approve')} className="rounded-full bg-ink px-3 py-2 text-xs font-semibold text-white">
        Approve
      </button>
      <button onClick={() => void update('reject')} className="rounded-full border border-soft px-3 py-2 text-xs font-semibold">
        Reject
      </button>
      <button onClick={() => void update('flag')} className="rounded-full border border-soft px-3 py-2 text-xs font-semibold">
        Flag
      </button>
      <button onClick={() => void update('delete')} className="rounded-full border border-soft px-3 py-2 text-xs font-semibold">
        Delete
      </button>
      {status ? <span className="text-xs text-soft">{status}</span> : null}
    </div>
  );
}
