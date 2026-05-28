import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Types } from 'mongoose';
import { authOptions } from '../../../../../lib/auth';
import { connectToDatabase } from '../../../../../lib/mongodb';
import { assertRateLimit, sanitizePlainText } from '../../../../../lib/security';
import { logServerError } from '../../../../../lib/logging';
import Comment from '../../../../../models/Comment';
import Post from '../../../../../models/Post';
import Notification from '../../../../../models/Notification';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid post id.' }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const comments = await Comment.find({ postId: id, status: 'approved' }).sort({ createdAt: 1 }).lean();
    return NextResponse.json({ comments });
  } catch (error) {
    logServerError('Comments fetch failed:', error);
    return NextResponse.json({ comments: [] });
  }
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid post id.' }, { status: 400 });
  }

  try {
    assertRateLimit(`comment:${session.user.id}`, 8, 60_000);
    const body = await request.json();
    const text = sanitizePlainText(String(body.body || ''), 2000);
    const parentId = body.parentId && Types.ObjectId.isValid(body.parentId) ? body.parentId : undefined;

    if (text.length < 2) {
      return NextResponse.json({ error: 'Comment is too short.' }, { status: 400 });
    }

    await connectToDatabase();
    const post = await Post.findById(id);
    if (!post || !post.published) {
      return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
    }

    const comment = await Comment.create({
      postId: id,
      authorId: session.user.id,
      authorName: session.user.name || 'Reader',
      body: text,
      parentId,
      status: session.user.role === 'admin' ? 'approved' : 'pending'
    });

    if (post.authorId.toString() !== session.user.id) {
      await Notification.create({
        userId: post.authorId,
        message:
          comment.status === 'approved'
            ? `${session.user.name || 'A reader'} commented on "${post.title}".`
            : `A new comment on "${post.title}" is awaiting moderation.`,
        href: `/posts/${post.slug}`
      });
    }

    return NextResponse.json({
      message:
        comment.status === 'approved'
          ? 'Comment published.'
          : 'Comment submitted and awaiting moderation.',
      comment
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'RATE_LIMITED') {
      return NextResponse.json({ error: 'Too many comments. Please slow down.' }, { status: 429 });
    }
    logServerError('Comment create failed:', error);
    return NextResponse.json({ error: 'Unable to save comment.' }, { status: 500 });
  }
}
