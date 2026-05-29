import { Types } from 'mongoose';
import { connectToDatabase } from './mongodb';
import User from '../models/User';

export async function isUserSuspended(userId: string) {
  if (!Types.ObjectId.isValid(userId)) return false;
  await connectToDatabase();
  const user = (await User.findById(userId).select('suspended role').lean()) as {
    suspended?: boolean;
    role?: string;
  } | null;
  if (!user) return false;
  if (user.role === 'admin') return false;
  return !!user.suspended;
}
