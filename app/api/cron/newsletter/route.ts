import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/mongodb';
import { getPublicSiteUrl } from '../../../../lib/email';
import { buildNewsletterHtml, sendNewsletterEmail } from '../../../../lib/newsletter';
import { logServerError } from '../../../../lib/logging';
import NewsletterSubscriber from '../../../../models/NewsletterSubscriber';

function authorizeCron(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get('authorization');
  return header === `Bearer ${secret}`;
}

async function sendDigest(frequency: 'daily' | 'weekly') {
  await connectToDatabase();
  const html = await buildNewsletterHtml(frequency);
  const subscribers = await NewsletterSubscriber.find({ active: true, frequency }).lean();
  let sent = 0;
  let failed = 0;

  for (const subscriber of subscribers) {
    const result = await sendNewsletterEmail(
      subscriber.email,
      `Observing India ${frequency} digest`,
      `${html}<p style="font-size:12px;color:#6b6b6b">Unsubscribe: ${getPublicSiteUrl()}/api/newsletter?email=${encodeURIComponent(subscriber.email)}&token=${subscriber.unsubscribeToken}</p>`
    );
    if (result.queued) sent += 1;
    else failed += 1;
  }

  return { frequency, attempted: subscribers.length, sent, failed };
}

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const frequency = searchParams.get('frequency');

  try {
    if (frequency === 'daily' || frequency === 'weekly') {
      const result = await sendDigest(frequency);
      return NextResponse.json({ message: 'Digest processed.', ...result });
    }

    const [daily, weekly] = await Promise.all([sendDigest('daily'), sendDigest('weekly')]);
    return NextResponse.json({ message: 'Digests processed.', daily, weekly });
  } catch (error) {
    logServerError('Scheduled newsletter digest failed:', error);
    return NextResponse.json({ error: 'Unable to process newsletter digests.' }, { status: 500 });
  }
}
