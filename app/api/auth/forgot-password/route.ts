import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { getPublicSiteUrl, isEmailConfigured, sendPasswordResetEmail } from '../../../../lib/email';
import { logServerError } from '../../../../lib/logging';
import { createPasswordResetToken } from '../../../../lib/passwordReset';

const RESET_REQUEST_MESSAGE = 'If an account exists with this email, a password reset link has been sent.';
const RESET_ERROR_MESSAGE = 'Something went wrong. Please try again later.';
const EMAIL_NOT_CONFIGURED_MESSAGE =
  'Password reset is temporarily unavailable. Please contact support or try again later.';

export async function POST(request: Request) {
  try {
    if (!isEmailConfigured()) {
      logServerError('Forgot password blocked: email provider not configured.', new Error('EMAIL_NOT_CONFIGURED'));
      return NextResponse.json({ error: EMAIL_NOT_CONFIGURED_MESSAGE }, { status: 503 });
    }

    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.toLowerCase().trim() : '';

    if (!email) {
      return NextResponse.json({ message: RESET_REQUEST_MESSAGE });
    }

    await connectToDatabase();
    const user = await User.findOne({ email });

    if (user) {
      const { token, tokenHash, expiresAt } = createPasswordResetToken();
      user.passwordResetToken = tokenHash;
      user.passwordResetExpires = expiresAt;
      await user.save();

      const resetUrl = `${getPublicSiteUrl(new URL(request.url).origin)}/reset-password?token=${encodeURIComponent(token)}`;
      const emailResult = await sendPasswordResetEmail({ to: user.email, href: resetUrl });

      if (!emailResult.sent) {
        logServerError('Password reset email was not delivered.', new Error(emailResult.message || emailResult.reason));
        return NextResponse.json({ error: RESET_ERROR_MESSAGE }, { status: 502 });
      }
    }

    return NextResponse.json({ message: RESET_REQUEST_MESSAGE });
  } catch (error) {
    logServerError('Forgot password error:', error);
    return NextResponse.json({ error: RESET_ERROR_MESSAGE }, { status: 500 });
  }
}
