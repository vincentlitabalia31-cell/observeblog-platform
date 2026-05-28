import mongoose, { Schema, model, models } from 'mongoose';

export interface IPost {
  title: string;
  excerpt: string;
  content: string;
  slug: string;
  coverImage?: string;
  author: string;
  authorId: mongoose.Types.ObjectId;
  category: string;
  tags: string[];
  status: 'draft' | 'pending' | 'published' | 'rejected' | 'returned';
  adminNotes?: string;
  featured: boolean;
  published: boolean;
  publishedAt?: Date;
  reviewedAt?: Date;
  rejectedAt?: Date;
  returnedAt?: Date;
  featuredAt?: Date;
  statusChangedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    title: { type: String, required: true, trim: true },
    excerpt: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    coverImage: { type: String, trim: true },
    author: { type: String, required: true },
    authorId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    category: { type: String, required: true, default: 'Campus Life', trim: true },
    tags: { type: [String], default: [] },
    status: { type: String, enum: ['draft', 'pending', 'published', 'rejected', 'returned'], default: 'draft' },
    adminNotes: { type: String, trim: true, maxlength: 5000 },
    featured: { type: Boolean, default: false },
    published: { type: Boolean, default: false },
    publishedAt: { type: Date },
    reviewedAt: { type: Date },
    rejectedAt: { type: Date },
    returnedAt: { type: Date },
    featuredAt: { type: Date },
    statusChangedAt: { type: Date }
  },
  { timestamps: true }
);

const Post = models.Post || model<IPost>('Post', PostSchema);
export default Post;
