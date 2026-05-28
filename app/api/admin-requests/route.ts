import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import { createAdminRequest, listAdminRequests } from '../../../lib/roles';
import { logServerError } from '../../../lib/logging';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  try {
    const requests = await listAdminRequests();
    return NextResponse.json({ requests });
  } catch (error) {
    logServerError('Admin requests fetch failed:', error);
    return NextResponse.json({ requests: [] });
  }
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  if (session.user.role === 'admin') {
    return NextResponse.json({ error: 'Admins do not need to request access.' }, { status: 400 });
  }

  try {
    const id = await createAdminRequest(session.user.id, session.user.email);
    return NextResponse.json({ message: 'Admin request submitted.', id });
  } catch (error) {
    logServerError('Admin request creation failed:', error);
    return NextResponse.json({ error: 'Unable to submit admin request.' }, { status: 500 });
  }
}
