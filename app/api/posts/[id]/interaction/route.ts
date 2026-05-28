import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Types } from 'mongoose';
import { authOptions } from '../../../../../lib/auth';
import { connectToDatabase } from '../../../../../lib/mongodb';
import { logServerError } from '../../../../../lib/logging';
import PostInteraction from '../../../../../models/PostInteraction';

interface Params {
  params: Promise<{ id: string }>;
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
    const { type } = await request.json();
    if (!['like', 'bookmark'].includes(type)) {
      return NextResponse.json({ error: 'Invalid interaction type.' }, { status: 400 });
    }

    await connectToDatabase();
    const existing = await PostInteraction.findOne({ postId: id, userId: session.user.id, type });

    if (existing) {
      await existing.deleteOne();
    } else {
      await PostInteraction.create({ postId: id, userId: session.user.id, type });
    }

    const [likes, bookmarks] = await Promise.all([
      PostInteraction.countDocuments({ postId: id, type: 'like' }),
      PostInteraction.countDocuments({ postId: id, type: 'bookmark' })
    ]);

    return NextResponse.json({
      liked: type === 'like' ? !existing : undefined,
      bookmarked: type === 'bookmark' ? !existing : undefined,
      likes,
      bookmarks
    });
  } catch (error) {
    logServerError('Post interaction failed:', error);
    return NextResponse.json({ error: 'Unable to update interaction.' }, { status: 500 });
  }
}
