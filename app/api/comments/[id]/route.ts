import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Types } from 'mongoose';
import { authOptions } from '../../../../lib/auth';
import { connectToDatabase } from '../../../../lib/mongodb';
import { sanitizePlainText } from '../../../../lib/security';
import Comment from '../../../../models/Comment';

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  await connectToDatabase();
  const comment = await Comment.findById(id);
  if (!comment) return NextResponse.json({ error: 'Comment not found.' }, { status: 404 });

  const ownsComment = comment.authorId.toString() === session.user.id;
  if (!ownsComment && session.user.role !== 'admin') {
    return NextResponse.json({ error: 'You cannot edit this comment.' }, { status: 403 });
  }

  const body = await request.json();
  const text = sanitizePlainText(String(body.body || ''), 2000);
  if (text.length < 2) return NextResponse.json({ error: 'Comment is too short.' }, { status: 400 });

  comment.body = text;
  comment.status = session.user.role === 'admin' ? 'approved' : 'pending';
  await comment.save();

  return NextResponse.json({ message: 'Comment updated.', comment });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  await connectToDatabase();
  const comment = await Comment.findById(id);
  if (!comment) return NextResponse.json({ error: 'Comment not found.' }, { status: 404 });

  const ownsComment = comment.authorId.toString() === session.user.id;
  if (!ownsComment && session.user.role !== 'admin') {
    return NextResponse.json({ error: 'You cannot delete this comment.' }, { status: 403 });
  }

  await comment.deleteOne();
  return NextResponse.json({ message: 'Comment deleted.' });
}
