import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Types } from 'mongoose';
import { authOptions } from '../../../../../lib/auth';
import { connectToDatabase } from '../../../../../lib/mongodb';
import { logServerError } from '../../../../../lib/logging';
import NewsletterSubscriber from '../../../../../models/NewsletterSubscriber';

interface Params {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid subscriber id.' }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const removed = await NewsletterSubscriber.findByIdAndDelete(id);
    if (!removed) {
      return NextResponse.json({ error: 'Subscriber not found.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Subscriber removed from the newsletter list.' });
  } catch (error) {
    logServerError('Subscriber delete failed:', error);
    return NextResponse.json({ error: 'Unable to remove subscriber.' }, { status: 500 });
  }
}
