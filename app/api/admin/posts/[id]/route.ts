import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Types } from 'mongoose';
import { authOptions } from '../../../../../lib/auth';
import { connectToDatabase } from '../../../../../lib/mongodb';
import Post from '../../../../../models/Post';

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid post id.' }, { status: 400 });
  }

  try {
    const { action, featured } = await request.json();
    await connectToDatabase();
    const post = await Post.findById(id);
    if (!post) return NextResponse.json({ error: 'Post not found.' }, { status: 404 });

    if (action === 'approve') {
      post.status = 'published';
      post.published = true;
      post.publishedAt = post.publishedAt || new Date();
    }

    if (action === 'reject') {
      post.status = 'rejected';
      post.published = false;
    }

    if (typeof featured === 'boolean') {
      post.featured = featured;
    }

    await post.save();
    return NextResponse.json({ message: 'Post moderation updated.', post });
  } catch (error) {
    return NextResponse.json({ error: 'Unable to update moderation state.' }, { status: 500 });
  }
}
