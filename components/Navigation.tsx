'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import NotificationDropdown from './NotificationDropdown';

export default function Navigation() {
  const { data: session } = useSession();

  return (
    <header className="border-b border-soft bg-paper/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-lg font-semibold tracking-tight text-ink">
          Observing India
        </Link>
        <nav className="flex items-center gap-3 text-sm text-soft sm:gap-4">
          <Link href="/posts" className="hover:text-ink transition-colors">
            Essays
          </Link>
          <Link href="/search" className="hidden hover:text-ink transition-colors sm:inline">
            Search
          </Link>
          <Link href="/archive" className="hidden hover:text-ink transition-colors sm:inline">
            Archive
          </Link>
          <Link href="/about" className="hidden hover:text-ink transition-colors sm:inline">
            About
          </Link>
          <Link href="/dashboard" className="hover:text-ink transition-colors">
            Publish
          </Link>
          {session?.user?.role === 'admin' ? (
            <Link href="/admin" className="hidden hover:text-ink transition-colors sm:inline">
              Admin
            </Link>
          ) : null}
          <NotificationDropdown />
          {session?.user ? (
            <button
              type="button"
              onClick={() => signOut()}
              className="rounded-full border border-soft bg-white px-4 py-2 text-ink transition hover:border-ink"
            >
              Sign out
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-full border border-soft bg-white px-4 py-2 text-ink transition hover:border-ink"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
