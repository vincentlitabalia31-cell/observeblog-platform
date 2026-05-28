import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { logServerError } from '../../../../lib/logging';
import { hashPasswordResetToken } from '../../../../lib/passwordReset';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = typeof body.token === 'string' ? body.token.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!token || !password) {
      return NextResponse.json({ error: 'Reset token and new password are required.' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    await connectToDatabase();
    const tokenHash = hashPasswordResetToken(token);
    const hashedPassword = await bcrypt.hash(password, 12);
    const updatedUser = await User.findOneAndUpdate(
      {
        passwordResetToken: tokenHash,
        passwordResetExpires: { $gt: new Date() }
      },
      {
        $set: { password: hashedPassword },
        $unset: { passwordResetToken: '', passwordResetExpires: '' }
      },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'This reset link is invalid or has expired.' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Password updated successfully. You can now sign in.' });
  } catch (error) {
    logServerError('Reset password error:', error);
    return NextResponse.json({ error: 'Unable to reset password.' }, { status: 500 });
  }
}
