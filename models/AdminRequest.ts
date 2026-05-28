import mongoose, { Schema, model, models } from 'mongoose';

export interface IAdminRequest {
  userId: mongoose.Types.ObjectId;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const AdminRequestSchema = new Schema<IAdminRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true }
  },
  { timestamps: true, collection: 'admin_requests' }
);

AdminRequestSchema.index({ userId: 1, status: 1 });

const AdminRequest = models.AdminRequest || model<IAdminRequest>('AdminRequest', AdminRequestSchema);
export default AdminRequest;
