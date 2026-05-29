import { revalidatePath } from 'next/cache';

/** Refresh all public editorial surfaces after moderation changes. */
export function revalidateEditorialSurfaces(slug?: string) {
  revalidatePath('/', 'layout');
  revalidatePath('/');
  revalidatePath('/posts');
  revalidatePath('/archive');
  revalidatePath('/search');
  revalidatePath('/categories', 'layout');

  if (slug) {
    revalidatePath(`/posts/${slug}`);
  }
}
