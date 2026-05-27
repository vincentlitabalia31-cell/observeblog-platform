import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Types } from 'mongoose';
import { authOptions } from '../../../../../lib/auth';
import { connectToDatabase } from '../../../../../lib/mongodb';
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
    const { role } = await request.json();
    if (!['user', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select('-password').lean();
    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    return NextResponse.json({ message: 'User updated.', user });
  } catch (error) {
    return NextResponse.json({ error: 'Unable to update user.' }, { status: 500 });
  }
}
