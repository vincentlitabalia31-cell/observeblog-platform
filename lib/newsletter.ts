import crypto from 'crypto';
import { getFeaturedPosts, getRecentPosts } from './posts';
import { getAuthSecret } from './env';
import { getPublicSiteUrl, sendHtmlEmail } from './email';
import { logServerError } from './logging';
import NewsletterSubscriber from '../models/NewsletterSubscriber';
import type { IPost } from '../models/Post';

type NewsletterFrequency = 'immediate' | 'daily' | 'weekly';

export function createUnsubscribeToken(email: string) {
  const secret = getAuthSecret();
  return crypto.createHmac('sha256', secret).update(email.toLowerCase().trim()).digest('hex');
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildUnsubscribeFooter(email: string, token: string) {
  const unsubscribeUrl = `${getPublicSiteUrl()}/api/newsletter?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
  return `
    <p style="margin:24px 0 0;font-family:Arial,sans-serif;font-size:12px;line-height:1.6;color:#6b6b6b">
      To stop receiving these emails, use this link: <a href="${unsubscribeUrl}" style="color:#1f1f1f">${unsubscribeUrl}</a>
    </p>`;
}

export async function buildNewsletterHtml(frequency: 'daily' | 'weekly') {
  const [featured, recent] = await Promise.all([getFeaturedPosts(3), getRecentPosts(6)]);
  const essays = featured.length ? featured : recent;
  const siteUrl = getPublicSiteUrl();

  const items = essays
    .map(
      (post) => `
        <article style="border-top:1px solid #e6dfd3;padding:20px 0">
          <p style="margin:0 0 8px;color:#6b6b6b;font-size:12px;letter-spacing:.12em;text-transform:uppercase">${escapeHtml(post.category)}</p>
          <h2 style="margin:0 0 10px;font-family:Georgia,serif;font-size:24px;color:#1f1f1f">${escapeHtml(post.title)}</h2>
          <p style="margin:0 0 12px;color:#3a3a3a;line-height:1.6">${escapeHtml(post.excerpt)}</p>
          <a href="${siteUrl}/posts/${post.slug}" style="color:#1f1f1f;font-weight:700">Read essay</a>
        </article>`
    )
    .join('');

  return `
    <main style="background:#f7f5ef;padding:32px;font-family:Inter,Arial,sans-serif;color:#1f1f1f">
      <div style="max-width:680px;margin:0 auto;background:#fffaf1;border:1px solid #e6dfd3;padding:32px">
        <p style="margin:0 0 8px;color:#6b6b6b;font-size:12px;letter-spacing:.18em;text-transform:uppercase">${frequency} digest</p>
        <h1 style="margin:0 0 20px;font-family:Georgia,serif;font-size:36px">Observing India</h1>
        <p style="color:#3a3a3a;line-height:1.7">A measured selection of essays on education, culture, identity, and student life.</p>
        ${items || '<p>No published essays are available yet.</p>'}
      </div>
    </main>`;
}

export async function sendNewsletterEmail(to: string, subject: string, html: string) {
  const result = await sendHtmlEmail({ to, subject, html });
  if (!result.sent) {
    return {
      queued: false,
      provider: result.reason === 'EMAIL_NOT_CONFIGURED' ? 'none' : 'failed',
      message: result.message || 'Unable to send newsletter email.'
    };
  }

  return { queued: true, provider: result.provider };
}

function buildPublishedEssayEmail(post: Pick<IPost, 'title' | 'excerpt' | 'slug' | 'category'>, frequency: NewsletterFrequency) {
  const siteUrl = getPublicSiteUrl();
  const postUrl = `${siteUrl}/posts/${post.slug}`;
  const label = frequency === 'immediate' ? 'New essay' : `${frequency} essay update`;
  const safeTitle = escapeHtml(post.title);
  const safeExcerpt = escapeHtml(post.excerpt);
  const safeCategory = escapeHtml(post.category);

  return {
    subject: frequency === 'immediate' ? `New essay: ${post.title}` : `Observing India ${frequency} essay: ${post.title}`,
    text: [
      label,
      '',
      post.title,
      post.excerpt,
      '',
      `Read essay: ${postUrl}`
    ].join('\n'),
    html: `
      <main style="background:#f7f5ef;padding:24px;font-family:Arial,sans-serif;color:#1f1f1f">
        <div style="max-width:640px;margin:0 auto;background:#fffaf1;border:1px solid #e6dfd3;padding:28px">
          <p style="margin:0 0 8px;color:#6b6b6b;font-size:12px;letter-spacing:.18em;text-transform:uppercase">${label}</p>
          <h1 style="margin:0 0 12px;font-family:Georgia,serif;font-size:30px;line-height:1.2">${safeTitle}</h1>
          <p style="margin:0 0 16px;color:#6b6b6b;font-size:12px;letter-spacing:.12em;text-transform:uppercase">${safeCategory}</p>
          <p style="margin:0 0 22px;color:#3a3a3a;line-height:1.7">${safeExcerpt}</p>
          <p style="margin:0">
            <a href="${postUrl}" style="display:inline-block;background:#1f1f1f;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:999px">Read essay</a>
          </p>
        </div>
      </main>`
  };
}

export async function sendPublishedEssayToSubscribers(post: Pick<IPost, 'title' | 'excerpt' | 'slug' | 'category' | 'status' | 'published'>) {
  if (!post.published || post.status !== 'published') {
    return { attempted: 0, sent: 0, failed: 0 };
  }

  const subscribers = await NewsletterSubscriber.find({ active: true, frequency: 'immediate' }).lean();
  let sent = 0;
  let failed = 0;

  for (const subscriber of subscribers) {
    const frequency: NewsletterFrequency = ['immediate', 'daily', 'weekly'].includes(subscriber.frequency)
      ? subscriber.frequency
      : 'weekly';
    const message = buildPublishedEssayEmail(post, frequency);
    const html = `${message.html}${buildUnsubscribeFooter(subscriber.email, subscriber.unsubscribeToken)}`;
    const result = await sendHtmlEmail({
      to: subscriber.email,
      subject: message.subject,
      text: `${message.text}\n\nUnsubscribe: ${getPublicSiteUrl()}/api/newsletter?email=${encodeURIComponent(subscriber.email)}&token=${encodeURIComponent(subscriber.unsubscribeToken)}`,
      html
    });

    if (result.sent) {
      sent += 1;
    } else {
      failed += 1;
      logServerError('Published essay subscriber email failed:', new Error(result.message || result.reason));
    }
  }

  return { attempted: subscribers.length, sent, failed };
}
