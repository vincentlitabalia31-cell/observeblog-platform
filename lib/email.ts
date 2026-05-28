import nodemailer from 'nodemailer';

export function isSmtpConfigured() {
  return Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS && (process.env.EMAIL_HOST || process.env.EMAIL_SERVICE));
}

function createTransporter() {
  if (process.env.EMAIL_HOST) {
    const port = Number(process.env.EMAIL_PORT || 587);
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port,
      secure: port === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
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

async function sendMail(options: { to: string; subject: string; text: string; html: string }) {
  if (!isSmtpConfigured()) {
    console.warn('Email skipped: SMTP environment variables are not configured.');
    return { sent: false, reason: 'SMTP_NOT_CONFIGURED' };
  }

  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    ...options
  });

  return { sent: true };
}

export async function sendSubscriptionConfirmation(email: string) {
  return sendMail({
    to: email,
    subject: 'Subscription Confirmed',
    text: 'Your Observing India subscription is confirmed. Thank you for reading with us.',
    html: `
      <div style="font-family: Georgia, serif; background: #f7f5ef; padding: 32px; color: #1f1f1f">
        <div style="max-width: 620px; margin: 0 auto; background: #fffaf1; border: 1px solid #e6dfd3; padding: 28px">
          <p style="font-size: 12px; letter-spacing: .18em; text-transform: uppercase; color: #6b6b6b">Subscription confirmed</p>
          <h1 style="font-size: 32px; margin: 8px 0 12px">Observing India</h1>
          <p style="font-family: Arial, sans-serif; line-height: 1.7; color: #3a3a3a">
            Your subscription is confirmed. We will send thoughtful essays and publication updates to this address.
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
