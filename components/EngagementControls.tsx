'use client';

import { useState } from 'react';

interface EngagementControlsProps {
  postId: string;
  initialLikes: number;
  initialBookmarks: number;
  initiallyLiked: boolean;
  initiallyBookmarked: boolean;
}

export default function EngagementControls({
  postId,
  initialLikes,
  initialBookmarks,
  initiallyLiked,
  initiallyBookmarked
}: EngagementControlsProps) {
  const [state, setState] = useState({
    likes: initialLikes,
    bookmarks: initialBookmarks,
    liked: initiallyLiked,
    bookmarked: initiallyBookmarked
  });
  const [status, setStatus] = useState<string | null>(null);

  async function toggle(type: 'like' | 'bookmark') {
    const optimistic = {
      ...state,
      [type === 'like' ? 'liked' : 'bookmarked']: type === 'like' ? !state.liked : !state.bookmarked,
      [type === 'like' ? 'likes' : 'bookmarks']:
        state[type === 'like' ? 'liked' : 'bookmarked']
          ? state[type === 'like' ? 'likes' : 'bookmarks'] - 1
          : state[type === 'like' ? 'likes' : 'bookmarks'] + 1
    };
    setState(optimistic);
    setStatus(null);

    const response = await fetch(`/api/posts/${postId}/interaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type })
    });

    const data = await response.json();
    if (!response.ok) {
      setState(state);
      setStatus(data.error || 'Please sign in to continue.');
      return;
    }

    setState((current) => ({
      likes: data.likes ?? current.likes,
      bookmarks: data.bookmarks ?? current.bookmarks,
      liked: typeof data.liked === 'boolean' ? data.liked : current.liked,
      bookmarked: typeof data.bookmarked === 'boolean' ? data.bookmarked : current.bookmarked
    }));
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => void toggle('like')}
        className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
          state.liked ? 'border-ink bg-ink text-white' : 'border-soft bg-white text-ink hover:border-ink'
        }`}
      >
        Like {state.likes}
      </button>
      <button
        type="button"
        onClick={() => void toggle('bookmark')}
        className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
          state.bookmarked ? 'border-ink bg-ink text-white' : 'border-soft bg-white text-ink hover:border-ink'
        }`}
      >
        Save {state.bookmarks}
      </button>
      {status ? <p className="text-sm text-soft">{status}</p> : null}
    </div>
  );
}
