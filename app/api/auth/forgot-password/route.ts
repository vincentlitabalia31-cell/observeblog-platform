import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { sendPasswordResetEmail } from '../../../../lib/email';
import { logServerError } from '../../../../lib/logging';
import { createPasswordResetToken } from '../../../../lib/passwordReset';

const RESET_REQUEST_MESSAGE = 'If an account exists with this email, a password reset link has been sent.';
const RESET_ERROR_MESSAGE = 'Something went wrong. Please try again later.';

function getResetBaseUrl(request: Request) {
  const configuredUrl = process.env.NEXTAUTH_URL || process.env.APP_URL;
  if (configuredUrl) return configuredUrl.replace(/\/$/, '');

  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  try {
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

      const resetUrl = `${getResetBaseUrl(request)}/reset-password?token=${encodeURIComponent(token)}`;
      void sendPasswordResetEmail({ to: user.email, href: resetUrl }).catch((error) => {
        logServerError('Password reset email error:', error);
      });
    }

    return NextResponse.json({ message: RESET_REQUEST_MESSAGE });
  } catch (error) {
    logServerError('Forgot password error:', error);
    return NextResponse.json({ error: RESET_ERROR_MESSAGE }, { status: 500 });
  }
}
