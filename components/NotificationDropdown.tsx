'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface NotificationItem {
  _id: string;
  message: string;
  href?: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationDropdown() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (!session?.user) return;
    void fetch('/api/notifications')
      .then((response) => response.json())
      .then((data) => setItems(data.notifications || []))
      .catch(() => setItems([]));
  }, [session?.user]);

  if (!session?.user) return null;

  const unread = items.filter((item) => !item.read).length;

  async function markRead() {
    setOpen((value) => !value);
    if (!open && unread) {
      await fetch('/api/notifications', { method: 'PATCH' });
      setItems((current) => current.map((item) => ({ ...item, read: true })));
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => void markRead()}
        className="relative rounded-full border border-soft bg-white px-3 py-2 text-xs font-semibold text-ink transition hover:border-ink"
        aria-label="Notifications"
      >
        Notes
        {unread ? (
          <span className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full bg-ink px-1 text-[10px] leading-4 text-white">
            {unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-3 w-72 rounded-lg border border-soft bg-white p-3 shadow-panel">
          <div className="grid gap-2">
            {items.map((item) =>
              item.href ? (
                <Link key={item._id} href={item.href} className="rounded-md p-3 text-sm leading-6 text-secondary hover:bg-paper">
                  {item.message}
                </Link>
              ) : (
                <p key={item._id} className="rounded-md p-3 text-sm leading-6 text-secondary">
                  {item.message}
                </p>
              )
            )}
            {!items.length ? <p className="p-3 text-sm text-soft">No notifications yet.</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
