import { Schema, model, models } from 'mongoose';

export interface INewsletterSubscriber {
  email: string;
  name?: string;
  frequency: 'immediate' | 'daily' | 'weekly';
  active: boolean;
  unsubscribeToken: string;
  createdAt: Date;
  updatedAt: Date;
}

const NewsletterSubscriberSchema = new Schema<INewsletterSubscriber>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    name: { type: String, trim: true },
    frequency: { type: String, enum: ['immediate', 'daily', 'weekly'], default: 'weekly' },
    active: { type: Boolean, default: true, index: true },
    unsubscribeToken: { type: String, required: true, unique: true }
  },
  { timestamps: true }
);

const NewsletterSubscriber =
  models.NewsletterSubscriber ||
  model<INewsletterSubscriber>('NewsletterSubscriber', NewsletterSubscriberSchema);

export default NewsletterSubscriber;
