import nodemailer from 'nodemailer';

export function isSmtpConfigured() {
  return Boolean(process.env.EMAIL_HOST && process.env.EMAIL_PORT && process.env.EMAIL_USER && process.env.EMAIL_PASS);
}

export async function sendSubscriptionConfirmation(email: string) {
  if (!isSmtpConfigured()) {
    console.warn('Subscription email skipped: SMTP environment variables are not configured.');
    return { sent: false, reason: 'SMTP_NOT_CONFIGURED' };
  }

  const port = Number(process.env.EMAIL_PORT);
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
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

  return { sent: true };
}
