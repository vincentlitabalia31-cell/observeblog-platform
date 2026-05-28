import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Types } from 'mongoose';
import { authOptions } from '../../../../../lib/auth';
import { connectToDatabase } from '../../../../../lib/mongodb';
import { sendPostStatusEmail } from '../../../../../lib/email';
import { logServerError } from '../../../../../lib/logging';
import { sanitizePlainText } from '../../../../../lib/security';
import Post from '../../../../../models/Post';
import User from '../../../../../models/User';
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
    return NextResponse.json({ error: 'Invalid post id.' }, { status: 400 });
  }

  try {
    const { action, featured, adminNotes } = await request.json();
    await connectToDatabase();
    const post = await Post.findById(id);
    if (!post) return NextResponse.json({ error: 'Post not found.' }, { status: 404 });

    const now = new Date();
    let emailStatus: 'Approved' | 'Rejected' | 'Returned' | 'Featured' | null = null;
    let emailMessage: string | undefined;
    let emailHref: string | undefined;
    const notes = typeof adminNotes === 'string' ? sanitizePlainText(adminNotes, 5000) : '';
    const hasStatusAction = ['approve', 'reject', 'return'].includes(action);

    if (!hasStatusAction && typeof featured !== 'boolean') {
      return NextResponse.json({ error: 'Invalid moderation update.' }, { status: 400 });
    }

    if (action === 'approve') {
      post.status = 'published';
      post.published = true;
      post.publishedAt = post.publishedAt || now;
      post.reviewedAt = now;
      post.statusChangedAt = now;
      emailStatus = 'Approved';
      emailMessage = 'Your article has been approved and published.';
      emailHref = `/posts/${post.slug}`;
      await Notification.create({
        userId: post.authorId,
        message: `Your essay "${post.title}" was approved.`,
        href: `/posts/${post.slug}`
      });
    }

    if (action === 'reject') {
      post.status = 'rejected';
      post.published = false;
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

    if (typeof featured === 'boolean') {
      post.featured = featured;
      if (featured) {
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
    }

    await post.save();
    if (emailStatus) {
      const notificationEmail = {
        status: emailStatus,
        message: emailMessage,
        href: emailHref,
        adminNotes: emailStatus === 'Returned' || emailStatus === 'Rejected' ? post.adminNotes : undefined
      };

      void (async () => {
        const author = await User.findById(post.authorId).select('email');
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || '';
        const href = notificationEmail.href && baseUrl ? new URL(notificationEmail.href, baseUrl).toString() : undefined;

        if (!author?.email) return;

        await sendPostStatusEmail({
          to: author.email,
          title: post.title,
          status: notificationEmail.status,
          message: notificationEmail.message,
          adminNotes: notificationEmail.adminNotes,
          href
        });
      })().catch((error) => {
        logServerError('Post status email failed:', error);
      });
    }

    return NextResponse.json({ message: 'Post moderation updated.', post });
  } catch (error) {
    logServerError('Post moderation update failed:', error);
    return NextResponse.json({ error: 'Unable to update moderation state.' }, { status: 500 });
  }
}
