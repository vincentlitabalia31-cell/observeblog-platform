import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Types } from 'mongoose';
import { authOptions } from '../../../../lib/auth';
import { connectToDatabase } from '../../../../lib/mongodb';
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
    if (!ownsPost && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'You cannot edit this post.' }, { status: 403 });
    }

    const body = await request.json();
    const nextSlug = body.slug ? slugify(body.slug) : post.slug;
    if (nextSlug !== post.slug) {
      const existing = await Post.findOne({ slug: nextSlug, _id: { $ne: post._id } });
      if (existing) return NextResponse.json({ error: 'A post with that slug already exists.' }, { status: 409 });
      post.slug = nextSlug;
    }

    if (body.title?.trim()) post.title = body.title.trim();
    if (body.excerpt?.trim()) post.excerpt = body.excerpt.trim();
    if (body.content?.trim()) post.content = body.content.trim();
    if (body.category?.trim()) post.category = body.category.trim();
    if (Array.isArray(body.tags)) post.tags = body.tags.map((tag: string) => tag.trim()).filter(Boolean).slice(0, 8);
    if (typeof body.coverImage === 'string') post.coverImage = body.coverImage.trim() || undefined;

    if (body.publishAction === 'draft') {
      post.status = 'draft';
      post.published = false;
    }

    if (body.publishAction === 'publish') {
      post.status = session.user.role === 'admin' ? 'published' : 'pending';
      post.published = post.status === 'published';
      post.publishedAt = post.status === 'published' ? new Date() : post.publishedAt;
    }

    await post.save();
    return NextResponse.json({ message: 'Post updated successfully.', post });
  } catch (error) {
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

    await post.deleteOne();
    return NextResponse.json({ message: 'Post deleted successfully.' });
  } catch (error) {
    return NextResponse.json({ error: 'Unable to delete post.' }, { status: 500 });
  }
}
