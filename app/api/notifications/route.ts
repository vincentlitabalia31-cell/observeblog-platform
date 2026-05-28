import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import { connectToDatabase } from '../../../lib/mongodb';
import Notification from '../../../models/Notification';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ notifications: [] });
  }

  await connectToDatabase();
  const notifications = await Notification.find({ userId: session.user.id }).sort({ createdAt: -1 }).limit(20).lean();
  return NextResponse.json({ notifications });
}

export async function PATCH() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  await connectToDatabase();
  await Notification.updateMany({ userId: session.user.id, read: false }, { read: true });
  return NextResponse.json({ message: 'Notifications marked as read.' });
}
