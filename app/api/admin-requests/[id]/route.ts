import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import { updateAdminRequest } from '../../../../lib/roles';
import { logServerError } from '../../../../lib/logging';

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  const { id } = await params;
  const { action } = await request.json();
  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  }

  try {
    await updateAdminRequest(id, action === 'approve' ? 'approved' : 'rejected');
    return NextResponse.json({ message: `Request ${action === 'approve' ? 'approved' : 'rejected'}.` });
  } catch (error) {
    logServerError('Admin request update failed:', error);
    return NextResponse.json({ error: 'Unable to update admin request.' }, { status: 500 });
  }
}
