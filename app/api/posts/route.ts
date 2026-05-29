import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import { connectToDatabase } from '../../../lib/mongodb';
import { sanitizePlainText } from '../../../lib/security';
import { logServerError } from '../../../lib/logging';
import { sendPublishedEssayToSubscribers } from '../../../lib/newsletter';
import { revalidateEditorialSurfaces } from '../../../lib/revalidate';
import { isUserSuspended } from '../../../lib/users';
import Post from '../../../models/Post';

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export async function GET() {
  try {
    await connectToDatabase();
    const posts = await Post.find({ $or: [{ status: 'published', published: true }, { status: { $exists: false }, published: true }] })
      .sort({ publishedAt: -1 })
      .lean();
    return NextResponse.json(posts);
  } catch (error) {
    logServerError('Public posts fetch failed:', error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  if (session.user.role !== 'admin' && (await isUserSuspended(session.user.id))) {
    return NextResponse.json(
      { error: 'Your account is suspended. You cannot create or submit essays. Contact the editorial team.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { title, excerpt, content, category, tags, publishAction, coverImage } = body;
    const titleText = typeof title === 'string' ? title.trim() : '';
    const excerptText = typeof excerpt === 'string' ? excerpt.trim() : '';
    const contentText = typeof content === 'string' ? content.trim() : '';

    if (publishAction && !['draft', 'publish'].includes(publishAction)) {
      return NextResponse.json({ error: 'Invalid publish action.' }, { status: 400 });
    }

    if (!titleText || !excerptText || !contentText) {
      return NextResponse.json({ error: 'Title, excerpt, and content are required.' }, { status: 400 });
    }

    await connectToDatabase();
    const slug = slugify(typeof body.slug === 'string' && body.slug.trim() ? body.slug : titleText);
    if (!slug) {
      return NextResponse.json({ error: 'A valid slug is required.' }, { status: 400 });
    }

    const existing = await Post.findOne({ slug });
    if (existing) {
      return NextResponse.json({ error: 'A post with that slug already exists.' }, { status: 409 });
    }

    const wantsPublish = publishAction === 'publish';
    const status = session.user.role === 'admin' && wantsPublish ? 'published' : wantsPublish ? 'pending' : 'draft';
    const authorId = session.user.id;
    const now = new Date();
    const post = await Post.create({
      title: sanitizePlainText(titleText, 180),
      excerpt: sanitizePlainText(excerptText, 800),
      content: contentText,
      slug,
      coverImage: typeof coverImage === 'string' ? coverImage.trim().slice(0, 1000) || undefined : undefined,
      category: typeof category === 'string' && category.trim() ? sanitizePlainText(category, 80) : 'Campus Life',
      tags: Array.isArray(tags) ? tags.map((tag) => sanitizePlainText(String(tag), 40)).filter(Boolean).slice(0, 8) : [],
      author: session.user.name || 'Guest author',
      authorId,
      status,
      published: status === 'published',
      publishedAt: status === 'published' ? now : undefined,
      statusChangedAt: now
    });
    const subscriberDelivery = status === 'published' ? await sendPublishedEssayToSubscribers(post) : undefined;
    if (status === 'published') {
      revalidateEditorialSurfaces(post.slug);
    }

    return NextResponse.json({
      message: status === 'draft' ? 'Draft saved successfully.' : 'Post submitted successfully.',
      post,
      subscriberDelivery
    });
  } catch (error) {
    logServerError('Post create failed:', error);
    return NextResponse.json({ error: 'Unable to save post.' }, { status: 500 });
  }
}
