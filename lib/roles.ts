import { Types } from 'mongoose';
import { connectToDatabase } from './mongodb';
import AdminRequest from '../models/AdminRequest';
import User from '../models/User';

export type AppRole = 'contributor' | 'admin';
export type AdminRequestStatus = 'pending' | 'approved' | 'rejected';
const DEFAULT_ADMIN_EMAIL = 'vincentlitabalia31@gmail.com';

/** Uses Vercel `ADMIN_EMAIL` when set, otherwise the default admin inbox. */
export function getAdminEmail() {
  return (process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).toLowerCase().trim();
}

export const SINGLE_ADMIN_EMAIL = DEFAULT_ADMIN_EMAIL;

export interface AdminRequest {
  id: string;
  userId: string;
  email: string;
  status: AdminRequestStatus;
  createdAt: string;
}

export function isConfiguredAdminEmail(email?: string | null) {
  return Boolean(email && email.toLowerCase().trim() === getAdminEmail());
}

export async function persistEffectiveRole(userId: string, email: string) {
  if (!Types.ObjectId.isValid(userId)) return;
  await connectToDatabase();
  await User.findByIdAndUpdate(userId, {
    role: isConfiguredAdminEmail(email) ? 'admin' : 'contributor'
  });
}

export async function getRoleForUser(_userId: string, email: string): Promise<AppRole> {
  return isConfiguredAdminEmail(email) ? 'admin' : 'contributor';
}

export async function createAdminRequest(userId: string, email: string) {
  if (!Types.ObjectId.isValid(userId)) {
    throw new Error('Invalid user id.');
  }
  await connectToDatabase();
  const existing = (await AdminRequest.findOne({ userId, status: 'pending' }).lean()) as { _id: Types.ObjectId } | null;
  if (existing) return existing._id.toString();

  const request = await AdminRequest.create({
    userId,
    email: email.toLowerCase().trim(),
    status: 'pending'
  });

  return request._id.toString();
}

export async function listAdminRequests(): Promise<AdminRequest[]> {
  await connectToDatabase();
  const requests = (await AdminRequest.find({}).sort({ createdAt: -1 }).limit(100).lean()) as Array<{
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    email: string;
    status: AdminRequestStatus;
    createdAt: Date;
  }>;
  return requests.map((request) => ({
    id: request._id.toString(),
    userId: request.userId?.toString(),
    email: request.email,
    status: request.status,
    createdAt: request.createdAt.toISOString()
  }));
}

export async function updateAdminRequest(id: string, status: 'approved' | 'rejected') {
  if (!Types.ObjectId.isValid(id)) {
    throw new Error('Invalid request id.');
  }
  await connectToDatabase();
  const request = await AdminRequest.findById(id);

  if (!request) {
    throw new Error('Admin request not found.');
  }

  request.status = status;
  await request.save();

  const effectiveRole = isConfiguredAdminEmail(request.email) && status === 'approved' ? 'admin' : 'contributor';
  await User.findByIdAndUpdate(request.userId, { role: effectiveRole });
}
