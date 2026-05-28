import mongoose, { Schema, model, models } from 'mongoose';

export interface IComment {
  postId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  authorName: string;
  body: string;
  parentId?: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    authorName: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    parentId: { type: Schema.Types.ObjectId, ref: 'Comment', index: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'flagged'],
      default: 'pending',
      index: true
    }
  },
  { timestamps: true }
);

CommentSchema.index({ postId: 1, status: 1, createdAt: -1 });

const Comment = models.Comment || model<IComment>('Comment', CommentSchema);
export default Comment;
