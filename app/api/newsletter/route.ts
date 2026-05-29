import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '../../../lib/mongodb';
import { assertRateLimit, isValidEmail, normalizeEmail, sanitizePlainText } from '../../../lib/security';
import { createUnsubscribeToken } from '../../../lib/newsletter';
import { isEmailConfigured, sendSubscriptionConfirmation } from '../../../lib/email';
import { logServerError } from '../../../lib/logging';
import NewsletterSubscriber from '../../../models/NewsletterSubscriber';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(String(body.email || ''));
    const name = sanitizePlainText(String(body.name || ''), 120);
    const frequency = ['immediate', 'daily', 'weekly'].includes(body.frequency) ? body.frequency : 'weekly';

    assertRateLimit(`newsletter:${email}`, 5, 60_000);

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    await connectToDatabase();
    const existingSubscriber = await NewsletterSubscriber.findOne({ email })
      .select('unsubscribeToken active')
      .lean<{ unsubscribeToken?: string; active?: boolean }>();

    if (existingSubscriber?.active) {
      return NextResponse.json({ message: 'You are already subscribed with this email.' });
    }

    const unsubscribeToken = existingSubscriber?.unsubscribeToken || createUnsubscribeToken(`${email}:${crypto.randomUUID()}`);
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

    if (!isEmailConfigured()) {
      logServerError('Newsletter confirmation skipped: email provider not configured.', new Error('EMAIL_NOT_CONFIGURED'));
      return NextResponse.json(
        {
          error:
            'Subscription saved, but confirmation email could not be sent. Email delivery is not configured on the server.'
        },
        { status: 503 }
      );
    }

    const emailResult = await sendSubscriptionConfirmation(email);
    if (!emailResult.sent) {
      logServerError('Subscription confirmation email failed:', new Error(emailResult.message || emailResult.reason));
      return NextResponse.json(
        { error: 'Subscription saved, but the confirmation email could not be delivered. Please try again shortly.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      message: 'Subscription saved. Check your inbox for a confirmation email.'
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
