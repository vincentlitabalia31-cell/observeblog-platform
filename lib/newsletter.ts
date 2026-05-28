import crypto from 'crypto';
import { getFeaturedPosts, getRecentPosts } from './posts';

export function createUnsubscribeToken(email: string) {
  const secret = process.env.NEXTAUTH_SECRET || 'observing-india-dev-secret';
  return crypto.createHmac('sha256', secret).update(email.toLowerCase().trim()).digest('hex');
}

export async function buildNewsletterHtml(frequency: 'daily' | 'weekly') {
  const [featured, recent] = await Promise.all([getFeaturedPosts(3), getRecentPosts(6)]);
  const essays = featured.length ? featured : recent;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';

  const items = essays
    .map(
      (post) => `
        <article style="border-top:1px solid #e6dfd3;padding:20px 0">
          <p style="margin:0 0 8px;color:#6b6b6b;font-size:12px;letter-spacing:.12em;text-transform:uppercase">${post.category}</p>
          <h2 style="margin:0 0 10px;font-family:Georgia,serif;font-size:24px;color:#1f1f1f">${post.title}</h2>
          <p style="margin:0 0 12px;color:#3a3a3a;line-height:1.6">${post.excerpt}</p>
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
  if (!process.env.RESEND_API_KEY) {
    return { queued: false, provider: 'none', message: 'RESEND_API_KEY is not configured.' };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: process.env.NEWSLETTER_FROM || 'Observing India <onboarding@resend.dev>',
      to,
      subject,
      html
    })
  });

  if (!response.ok) {
    throw new Error('Unable to send newsletter email.');
  }

  return { queued: true, provider: 'resend' };
}
