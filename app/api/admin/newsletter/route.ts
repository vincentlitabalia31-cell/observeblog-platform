import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import { connectToDatabase } from '../../../../lib/mongodb';
import { buildNewsletterHtml, sendNewsletterEmail } from '../../../../lib/newsletter';
import NewsletterSubscriber from '../../../../models/NewsletterSubscriber';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  const html = await buildNewsletterHtml('weekly');
  return NextResponse.json({ html });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  const { frequency = 'weekly', previewOnly = false } = await request.json();
  const safeFrequency = frequency === 'daily' ? 'daily' : 'weekly';
  const html = await buildNewsletterHtml(safeFrequency);

  if (previewOnly) {
    return NextResponse.json({ html });
  }

  await connectToDatabase();
  const subscribers = await NewsletterSubscriber.find({ active: true, frequency: safeFrequency }).lean();
  const results = [];

  for (const subscriber of subscribers) {
    results.push(
      await sendNewsletterEmail(
        subscriber.email,
        `Observing India ${safeFrequency} digest`,
        `${html}<p style="font-size:12px;color:#6b6b6b">Unsubscribe: ${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/newsletter?email=${encodeURIComponent(subscriber.email)}&token=${subscriber.unsubscribeToken}</p>`
      )
    );
  }

  return NextResponse.json({ message: 'Newsletter processed.', sent: results.length, results });
}
