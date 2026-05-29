import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Types } from 'mongoose';
import { authOptions } from '../../../../../lib/auth';
import { connectToDatabase } from '../../../../../lib/mongodb';
import { getPublicSiteUrl, sendPostStatusEmail } from '../../../../../lib/email';
import { sendPublishedEssayToSubscribers } from '../../../../../lib/newsletter';
import { logServerError } from '../../../../../lib/logging';
import { revalidateEditorialSurfaces } from '../../../../../lib/revalidate';
import { sanitizePlainText } from '../../../../../lib/security';
import Post from '../../../../../models/Post';
import User from '../../../../../models/User';
import Comment from '../../../../../models/Comment';
import PostInteraction from '../../../../../models/PostInteraction';
import Notification from '../../../../../models/Notification';

interface Params {
  params: Promise<{ id: string }>;
}

const STATUS_ACTIONS = new Set(['approve', 'reject', 'return', 'publish', 'unpublish', 'feature', 'unfeature']);

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
    const { action, adminNotes } = await request.json();
    if (!action || !STATUS_ACTIONS.has(action)) {
      return NextResponse.json({ error: 'Invalid moderation action.' }, { status: 400 });
    }

    await connectToDatabase();
    const post = await Post.findById(id);
    if (!post) return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
    const wasPublished = post.published && post.status === 'published';

    const now = new Date();
    const slug = post.slug;
    let emailStatus: 'Approved' | 'Rejected' | 'Returned' | 'Featured' | null = null;
    let emailMessage: string | undefined;
    let emailHref: string | undefined;
    const notes = typeof adminNotes === 'string' ? sanitizePlainText(adminNotes, 5000) : '';

    if (action === 'publish' || action === 'approve') {
      post.status = 'published';
      post.published = true;
      post.publishedAt = post.publishedAt || now;
      post.reviewedAt = now;
      post.statusChangedAt = now;
      emailStatus = 'Approved';
      emailMessage = 'Your article has been published.';
      emailHref = `/posts/${post.slug}`;
      await Notification.create({
        userId: post.authorId,
        message: `Your essay "${post.title}" was published.`,
        href: `/posts/${post.slug}`
      });
    }

    if (action === 'unpublish') {
      post.published = false;
      post.statusChangedAt = now;
    }

    if (action === 'feature') {
      if (!post.published || post.status !== 'published') {
        return NextResponse.json({ error: 'Only published essays can be featured.' }, { status: 400 });
      }
      post.featured = true;
      post.featuredAt = now;
      emailStatus = 'Featured';
      emailMessage = 'Your article has been featured.';
      emailHref = `/posts/${post.slug}`;
      await Notification.create({
        userId: post.authorId,
        message: `Your essay "${post.title}" was featured.`,
        href: `/posts/${post.slug}`
      });
    }

    if (action === 'unfeature') {
      post.featured = false;
    }

    if (action === 'reject') {
      post.status = 'rejected';
      post.published = false;
      post.featured = false;
      post.rejectedAt = now;
      post.statusChangedAt = now;
      if (notes) post.adminNotes = notes;
      emailStatus = 'Rejected';
      emailMessage = 'Your article was rejected by moderation.';
      emailHref = `/dashboard/posts/${post._id.toString()}/edit`;
      await Notification.create({
        userId: post.authorId,
        message: `Your essay "${post.title}" was rejected by moderation.`,
        href: `/dashboard/posts/${post._id.toString()}/edit`
      });
    }

    if (action === 'return') {
      if (!notes) {
        return NextResponse.json({ error: 'Admin notes are required when returning a post.' }, { status: 400 });
      }
      post.status = 'returned';
      post.published = false;
      post.featured = false;
      post.adminNotes = notes;
      post.returnedAt = now;
      post.statusChangedAt = now;
      emailStatus = 'Returned';
      emailMessage = 'Your article has been returned for revision.';
      emailHref = `/dashboard/posts/${post._id.toString()}/edit`;
      await Notification.create({
        userId: post.authorId,
        message: `Your essay "${post.title}" was returned with notes.`,
        href: `/dashboard/posts/${post._id.toString()}/edit`
      });
    }

    await post.save();
    const becamePublished = !wasPublished && post.published && post.status === 'published';
    const subscriberDelivery = becamePublished ? await sendPublishedEssayToSubscribers(post) : undefined;

    if (emailStatus) {
      void (async () => {
        const author = await User.findById(post.authorId).select('email');
        const href = emailHref ? new URL(emailHref, getPublicSiteUrl()).toString() : undefined;
        if (!author?.email) return;
        await sendPostStatusEmail({
          to: author.email,
          title: post.title,
          status: emailStatus,
          message: emailMessage,
          adminNotes: emailStatus === 'Returned' || emailStatus === 'Rejected' ? post.adminNotes : undefined,
          href
        });
      })().catch((error) => {
        logServerError('Post status email failed:', error);
      });
    }

    revalidateEditorialSurfaces(slug);

    return NextResponse.json({ message: 'Post moderation updated.', post, subscriberDelivery });
  } catch (error) {
    logServerError('Post moderation update failed:', error);
    return NextResponse.json({ error: 'Unable to update moderation state.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid post id.' }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const post = await Post.findById(id);
    if (!post) return NextResponse.json({ error: 'Post not found.' }, { status: 404 });

    const slug = post.slug;
    await Promise.all([
      Comment.deleteMany({ postId: post._id }),
      PostInteraction.deleteMany({ postId: post._id }),
      Notification.deleteMany({ href: { $regex: post._id.toString() } })
    ]);
    await post.deleteOne();

    revalidateEditorialSurfaces(slug);

    return NextResponse.json({ message: 'Essay deleted permanently.' });
  } catch (error) {
    logServerError('Post delete failed:', error);
    return NextResponse.json({ error: 'Unable to delete post.' }, { status: 500 });
  }
}
