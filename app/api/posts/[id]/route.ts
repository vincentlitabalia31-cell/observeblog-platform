import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Types } from 'mongoose';
import { authOptions } from '../../../../lib/auth';
import { connectToDatabase } from '../../../../lib/mongodb';
import { sanitizePlainText } from '../../../../lib/security';
import { logServerError } from '../../../../lib/logging';
import Post from '../../../../models/Post';

interface Params {
  params: Promise<{ id: string }>;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const post = await Post.findById(id);
    if (!post) return NextResponse.json({ error: 'Post not found.' }, { status: 404 });

    const ownsPost = post.authorId.toString() === session.user.id;
    const isAdmin = session.user.role === 'admin';
    const contributorCanEdit = ownsPost && ['draft', 'returned'].includes(post.status);

    if (!isAdmin && !contributorCanEdit) {
      return NextResponse.json({ error: 'You cannot edit this post.' }, { status: 403 });
    }

    const body = await request.json();
    if (body.publishAction && !['draft', 'publish'].includes(body.publishAction)) {
      return NextResponse.json({ error: 'Invalid publish action.' }, { status: 400 });
    }

    const nextSlug = typeof body.slug === 'string' && body.slug.trim() ? slugify(body.slug) : post.slug;
    if (nextSlug !== post.slug) {
      if (!nextSlug) return NextResponse.json({ error: 'Slug is required.' }, { status: 400 });
      const existing = await Post.findOne({ slug: nextSlug, _id: { $ne: post._id } });
      if (existing) return NextResponse.json({ error: 'A post with that slug already exists.' }, { status: 409 });
      post.slug = nextSlug;
    }

    if (typeof body.title === 'string' && body.title.trim()) post.title = sanitizePlainText(body.title, 180);
    if (typeof body.excerpt === 'string' && body.excerpt.trim()) post.excerpt = sanitizePlainText(body.excerpt, 800);
    if (typeof body.content === 'string' && body.content.trim()) post.content = body.content.trim();
    if (typeof body.category === 'string' && body.category.trim()) post.category = sanitizePlainText(body.category, 80);
    if (Array.isArray(body.tags)) post.tags = body.tags.map((tag: string) => sanitizePlainText(String(tag), 40)).filter(Boolean).slice(0, 8);
    if (typeof body.coverImage === 'string') post.coverImage = body.coverImage.trim().slice(0, 1000) || undefined;

    if (body.publishAction === 'draft') {
      if (!isAdmin || post.status !== 'published') {
        post.status = 'draft';
        post.published = false;
        post.statusChangedAt = new Date();
      }
    }

    if (body.publishAction === 'publish') {
      const now = new Date();
      post.status = isAdmin ? 'published' : 'pending';
      post.published = post.status === 'published';
      post.publishedAt = post.status === 'published' ? post.publishedAt || now : post.publishedAt;
      post.statusChangedAt = now;
    }

    await post.save();
    return NextResponse.json({ message: 'Post updated successfully.', post });
  } catch (error) {
    logServerError('Post update failed:', error);
    return NextResponse.json({ error: 'Unable to update post.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const post = await Post.findById(id);
    if (!post) return NextResponse.json({ error: 'Post not found.' }, { status: 404 });

    const ownsPost = post.authorId.toString() === session.user.id;
    if (!ownsPost && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'You cannot delete this post.' }, { status: 403 });
    }

    if (session.user.role !== 'admin' && !['draft', 'returned'].includes(post.status)) {
      return NextResponse.json({ error: 'Only draft or returned posts can be deleted by contributors.' }, { status: 403 });
    }

    await post.deleteOne();
    return NextResponse.json({ message: 'Post deleted successfully.' });
  } catch (error) {
    logServerError('Post delete failed:', error);
    return NextResponse.json({ error: 'Unable to delete post.' }, { status: 500 });
  }
}
