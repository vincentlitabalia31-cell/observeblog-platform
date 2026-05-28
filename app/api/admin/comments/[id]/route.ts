import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Types } from 'mongoose';
import { authOptions } from '../../../../../lib/auth';
import { connectToDatabase } from '../../../../../lib/mongodb';
import { logServerError } from '../../../../../lib/logging';
import Comment from '../../../../../models/Comment';
import Post from '../../../../../models/Post';
import Notification from '../../../../../models/Notification';

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
    return NextResponse.json({ error: 'Invalid comment id.' }, { status: 400 });
  }

  try {
    const { action } = await request.json();
    if (!['approve', 'reject', 'flag'].includes(action)) {
      return NextResponse.json({ error: 'Invalid moderation action.' }, { status: 400 });
    }

    await connectToDatabase();
    const comment = await Comment.findById(id);
    if (!comment) return NextResponse.json({ error: 'Comment not found.' }, { status: 404 });

    comment.status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'flagged';
    await comment.save();

    if (comment.status === 'approved') {
      const post = (await Post.findById(comment.postId).lean()) as { slug?: string } | null;
      await Notification.create({
        userId: comment.authorId,
        message: 'Your comment was approved.',
        href: post ? `/posts/${post.slug}` : undefined
      });
    }

    return NextResponse.json({ message: 'Comment moderation updated.', comment });
  } catch (error) {
    logServerError('Comment moderation failed:', error);
    return NextResponse.json({ error: 'Unable to update comment.' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid comment id.' }, { status: 400 });
  }

  try {
    await connectToDatabase();
    await Comment.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Comment deleted.' });
  } catch (error) {
    logServerError('Comment delete failed:', error);
    return NextResponse.json({ error: 'Unable to delete comment.' }, { status: 500 });
  }
}
