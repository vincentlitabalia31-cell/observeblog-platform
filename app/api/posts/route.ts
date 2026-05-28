import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import { connectToDatabase } from '../../../lib/mongodb';
import Post from '../../../models/Post';

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export async function GET() {
  await connectToDatabase();
  const posts = await Post.find({ $or: [{ status: 'published', published: true }, { status: { $exists: false }, published: true }] })
    .sort({ publishedAt: -1 })
    .lean();
  return NextResponse.json(posts);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, excerpt, content, category, tags, publishAction, coverImage } = body;

    if (!title?.trim() || !excerpt?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'Title, excerpt, and content are required.' }, { status: 400 });
    }

    await connectToDatabase();
    const slug = slugify(body.slug || title);
    const existing = await Post.findOne({ slug });
    if (existing) {
      return NextResponse.json({ error: 'A post with that slug already exists.' }, { status: 409 });
    }

    const wantsPublish = publishAction === 'publish';
    const status = session.user.role === 'admin' && wantsPublish ? 'published' : wantsPublish ? 'pending' : 'draft';
    const authorId = session.user.id;
    const now = new Date();
    const post = await Post.create({
      title: title.trim(),
      excerpt: excerpt.trim(),
      content: content.trim(),
      slug,
      coverImage: coverImage?.trim() || undefined,
      category: category?.trim() || 'Campus Life',
      tags: Array.isArray(tags) ? tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 8) : [],
      author: session.user.name || 'Guest author',
      authorId,
      status,
      published: status === 'published',
      publishedAt: status === 'published' ? now : undefined,
      statusChangedAt: now
    });

    return NextResponse.json({ message: status === 'draft' ? 'Draft saved successfully.' : 'Post submitted successfully.', post });
  } catch (error) {
    return NextResponse.json({ error: 'Unable to save post.' }, { status: 500 });
  }
}
