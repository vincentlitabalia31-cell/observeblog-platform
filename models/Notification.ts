import mongoose, { Schema, model, models } from 'mongoose';

export interface INotification {
  userId: mongoose.Types.ObjectId;
  message: string;
  href?: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    message: { type: String, required: true, trim: true, maxlength: 240 },
    href: { type: String, trim: true },
    read: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

const Notification = models.Notification || model<INotification>('Notification', NotificationSchema);
export default Notification;
