import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Types } from 'mongoose';
import { authOptions } from '../../../../../lib/auth';
import { connectToDatabase } from '../../../../../lib/mongodb';
import { logServerError } from '../../../../../lib/logging';
import { sanitizePlainText } from '../../../../../lib/security';
import { getAdminEmail } from '../../../../../lib/roles';
import User from '../../../../../models/User';

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid user id.' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { action, role, suspensionReason } = body;

    await connectToDatabase();
    const user = await User.findById(id);
    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    if (user.email.toLowerCase() === getAdminEmail() && (action === 'suspend' || role === 'contributor')) {
      return NextResponse.json({ error: 'The primary admin account cannot be suspended or demoted here.' }, { status: 400 });
    }

    if (action === 'suspend') {
      user.suspended = true;
      user.suspendedAt = new Date();
      user.suspensionReason =
        typeof suspensionReason === 'string' ? sanitizePlainText(suspensionReason, 500) : 'Suspended by moderation.';
      await user.save();
      return NextResponse.json({ message: 'User suspended.', user: { id: user._id.toString(), suspended: true } });
    }

    if (action === 'unsuspend') {
      user.suspended = false;
      user.suspendedAt = undefined;
      user.suspensionReason = undefined;
      await user.save();
      return NextResponse.json({ message: 'User unsuspended.', user: { id: user._id.toString(), suspended: false } });
    }

    if (role === 'contributor') {
      user.role = 'contributor';
      await user.save();
      return NextResponse.json({ message: 'User updated.', user });
    }

    return NextResponse.json({ error: 'Invalid user update.' }, { status: 400 });
  } catch (error) {
    logServerError('Admin user update failed:', error);
    return NextResponse.json({ error: 'Unable to update user.' }, { status: 500 });
  }
}
