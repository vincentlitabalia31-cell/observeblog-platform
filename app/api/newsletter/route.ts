import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '../../../lib/mongodb';
import { assertRateLimit, isValidEmail, normalizeEmail, sanitizePlainText } from '../../../lib/security';
import { createUnsubscribeToken } from '../../../lib/newsletter';
import { sendSubscriptionConfirmation } from '../../../lib/email';
import { logServerError } from '../../../lib/logging';
import NewsletterSubscriber from '../../../models/NewsletterSubscriber';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(String(body.email || ''));
    const name = sanitizePlainText(String(body.name || ''), 120);
    const frequency = body.frequency === 'daily' ? 'daily' : 'weekly';

    assertRateLimit(`newsletter:${email}`, 5, 60_000);

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    await connectToDatabase();
    const unsubscribeToken = createUnsubscribeToken(`${email}:${crypto.randomUUID()}`);
    await NewsletterSubscriber.findOneAndUpdate(
      { email },
      {
        email,
        name,
        frequency,
        active: true,
        unsubscribeToken
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    void sendSubscriptionConfirmation(email).catch((error) => {
      logServerError('Subscription confirmation email failed:', error);
    });

    return NextResponse.json({
      message: 'Subscription saved.'
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'RATE_LIMITED') {
      return NextResponse.json({ error: 'Too many attempts. Please try again soon.' }, { status: 429 });
    }
    logServerError('Newsletter subscription failed:', error);
    return NextResponse.json({ error: 'Unable to save subscription.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = normalizeEmail(searchParams.get('email') || '');
    const token = searchParams.get('token') || '';

    if (!email || !token) {
      return NextResponse.json({ error: 'Email and token are required.' }, { status: 400 });
    }

    await connectToDatabase();
    const subscriber = await NewsletterSubscriber.findOneAndUpdate(
      { email, unsubscribeToken: token },
      { active: false },
      { new: true }
    );

    if (!subscriber) return NextResponse.json({ error: 'Subscription not found.' }, { status: 404 });
    return NextResponse.json({ message: 'You have been unsubscribed.' });
  } catch (error) {
    logServerError('Newsletter unsubscribe failed:', error);
    return NextResponse.json({ error: 'Unable to unsubscribe.' }, { status: 500 });
  }
}
