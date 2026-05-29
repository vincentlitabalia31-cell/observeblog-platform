import nodemailer from 'nodemailer';
import { getAuthBaseUrl } from './env';
import { logServerError } from './logging';

export type EmailSendResult =
  | { sent: true; provider: 'resend' | 'smtp' }
  | { sent: false; reason: 'EMAIL_NOT_CONFIGURED' | 'SEND_FAILED'; message?: string };

function getEmailEnv(name: string) {
  return process.env[name]?.trim();
}

function logEmailError(message: string, error: unknown) {
  if (process.env.NODE_ENV === 'production') {
    console.error(message, error instanceof Error ? error.message : error);
    return;
  }

  logServerError(message, error);
}

export function isSmtpConfigured() {
  return Boolean(getEmailEnv('EMAIL_USER') && getEmailEnv('EMAIL_PASS'));
}

export function isResendConfigured() {
  return Boolean(getEmailEnv('RESEND_API_KEY'));
}

export function isEmailConfigured() {
  return isResendConfigured() || isSmtpConfigured();
}

function getFromAddress() {
  return (
    getEmailEnv('NEWSLETTER_FROM') ||
    getEmailEnv('EMAIL_FROM') ||
    'Observing India <onboarding@resend.dev>'
  );
}

function createTransporter() {
  const emailUser = getEmailEnv('EMAIL_USER');
  const emailPass = getEmailEnv('EMAIL_PASS');
  const emailHost = getEmailEnv('EMAIL_HOST');
  const emailService = getEmailEnv('EMAIL_SERVICE') || 'gmail';

  if (emailHost) {
    const port = Number(getEmailEnv('EMAIL_PORT') || 587);
    return nodemailer.createTransport({
      host: emailHost,
      port,
      secure: port === 465,
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });
  }

  return nodemailer.createTransport({
    service: emailService,
    auth: {
      user: emailUser,
      pass: emailPass
    }
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function sendViaResend(options: { to: string; subject: string; text: string; html: string }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getEmailEnv('RESEND_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: getFromAddress(),
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text
    })
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Resend API error (${response.status}): ${body || response.statusText}`);
  }

  return { sent: true as const, provider: 'resend' as const };
}

async function sendViaSmtp(options: { to: string; subject: string; text: string; html: string }) {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: getEmailEnv('EMAIL_FROM') || getEmailEnv('EMAIL_USER'),
    ...options
  });
  return { sent: true as const, provider: 'smtp' as const };
}

export async function sendMail(options: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<EmailSendResult> {
  if (!isEmailConfigured()) {
    const message = 'Email provider is not configured. Set RESEND_API_KEY or SMTP credentials.';
    logEmailError('Email skipped: provider not configured.', new Error('EMAIL_NOT_CONFIGURED'));
    return { sent: false, reason: 'EMAIL_NOT_CONFIGURED', message };
  }

  try {
    if (isResendConfigured()) {
      return await sendViaResend(options);
    }
    return await sendViaSmtp(options);
  } catch (error) {
    logEmailError('Email send failed:', error);
    return {
      sent: false,
      reason: 'SEND_FAILED',
      message: error instanceof Error ? error.message : 'Email send failed.'
    };
  }
}

/** Used by admin newsletter digests and any HTML-only sends. */
export async function sendHtmlEmail(options: { to: string; subject: string; html: string; text?: string }) {
  return sendMail({
    to: options.to,
    subject: options.subject,
    text: options.text || 'View this message in an HTML-capable email client.',
    html: options.html
  });
}

export function getPublicSiteUrl(fallbackOrigin?: string) {
  const configured =
    getAuthBaseUrl() ||
    getEmailEnv('NEXT_PUBLIC_SITE_URL')?.replace(/\/$/, '') ||
    fallbackOrigin?.replace(/\/$/, '');

  return configured || 'http://localhost:3000';
}

export async function sendSubscriptionConfirmation(email: string) {
  return sendMail({
    to: email,
    subject: 'Subscription Confirmed — Observing India',
    text: 'Your Observing India subscription is confirmed. Thank you for reading with us.',
    html: `
      <div style="font-family: Georgia, serif; background: #f7f5ef; padding: 32px; color: #1f1f1f">
        <div style="max-width: 620px; margin: 0 auto; background: #fffaf1; border: 1px solid #e6dfd3; padding: 28px">
          <p style="font-size: 12px; letter-spacing: .18em; text-transform: uppercase; color: #6b6b6b">Subscription confirmed</p>
          <h1 style="font-size: 32px; margin: 8px 0 12px">Observing India</h1>
          <p style="font-family: Arial, sans-serif; line-height: 1.7; color: #3a3a3a">
            Your subscription is confirmed. We will send thoughtful essays and publication updates to this address.
          </p>
          <p style="font-family: Arial, sans-serif; margin-top: 18px; line-height: 1.7; color: #6b6b6b">
            Visit <a href="${escapeHtml(getPublicSiteUrl())}" style="color: #1f1f1f; font-weight: 700">Observing India</a> anytime.
          </p>
        </div>
      </div>`
  });
}

export async function sendPostStatusEmail({
  to,
  title,
  status,
  message,
  adminNotes,
  href
}: {
  to: string;
  title: string;
  status: 'Approved' | 'Rejected' | 'Returned' | 'Featured';
  message?: string;
  adminNotes?: string;
  href?: string;
}) {
  const subject = `Your Observing India article was ${status.toLowerCase()}`;
  const lines = [
    `Article title: ${title}`,
    `Status: ${status}`,
    message,
    adminNotes ? `Admin feedback: ${adminNotes}` : undefined,
    href ? `View article: ${href}` : undefined
  ].filter(Boolean);

  const safeTitle = escapeHtml(title);
  const safeStatus = escapeHtml(status);
  const safeMessage = message ? escapeHtml(message) : '';
  const safeNotes = adminNotes ? escapeHtml(adminNotes) : '';
  const safeHref = href ? escapeHtml(href) : '';

  return sendMail({
    to,
    subject,
    text: lines.join('\n\n'),
    html: `
      <div style="font-family: Arial, sans-serif; background: #f7f5ef; padding: 32px; color: #1f1f1f">
        <div style="max-width: 620px; margin: 0 auto; background: #fffaf1; border: 1px solid #e6dfd3; padding: 28px">
          <p style="font-size: 12px; letter-spacing: .18em; text-transform: uppercase; color: #6b6b6b">Article update</p>
          <h1 style="font-family: Georgia, serif; font-size: 28px; margin: 8px 0 12px">Observing India</h1>
          <p style="line-height: 1.7; color: #3a3a3a"><strong>Article title:</strong> ${safeTitle}</p>
          <p style="line-height: 1.7; color: #3a3a3a"><strong>Status:</strong> ${safeStatus}</p>
          ${safeMessage ? `<p style="line-height: 1.7; color: #3a3a3a">${safeMessage}</p>` : ''}
          ${
            safeNotes
              ? `<div style="margin-top: 18px; padding: 16px; border-left: 3px solid #1f1f1f; background: #ffffff">
                  <p style="margin: 0 0 8px; font-weight: 700">Admin feedback</p>
                  <p style="white-space: pre-wrap; line-height: 1.7; margin: 0; color: #3a3a3a">${safeNotes}</p>
                </div>`
              : ''
          }
          ${safeHref ? `<p style="margin-top: 22px"><a href="${safeHref}" style="color: #1f1f1f; font-weight: 700">Open article</a></p>` : ''}
        </div>
      </div>`
  });
}

export async function sendPasswordResetEmail({ to, href }: { to: string; href: string }) {
  const safeHref = escapeHtml(href);

  return sendMail({
    to,
    subject: 'Reset your Observing India password',
    text: [
      'We received a request to reset your Observing India password.',
      'Use the link below within 60 minutes:',
      href,
      'If you did not request this, you can ignore this email.'
    ].join('\n\n'),
    html: `
      <div style="font-family: Arial, sans-serif; background: #f7f5ef; padding: 32px; color: #1f1f1f">
        <div style="max-width: 620px; margin: 0 auto; background: #fffaf1; border: 1px solid #e6dfd3; padding: 28px">
          <p style="font-size: 12px; letter-spacing: .18em; text-transform: uppercase; color: #6b6b6b">Password reset</p>
          <h1 style="font-family: Georgia, serif; font-size: 28px; margin: 8px 0 12px">Observing India</h1>
          <p style="line-height: 1.7; color: #3a3a3a">
            We received a request to reset your password. This link expires in 60 minutes.
          </p>
          <p style="margin-top: 22px">
            <a href="${safeHref}" style="color: #1f1f1f; font-weight: 700">Reset password</a>
          </p>
          <p style="line-height: 1.7; color: #6b6b6b">
            If you did not request this, you can ignore this email.
          </p>
        </div>
      </div>`
  });
}
