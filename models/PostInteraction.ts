import mongoose, { Schema, model, models } from 'mongoose';

export interface IPostInteraction {
  postId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: 'like' | 'bookmark';
  createdAt: Date;
  updatedAt: Date;
}

const PostInteractionSchema = new Schema<IPostInteraction>(
  {
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['like', 'bookmark'], required: true, index: true }
  },
  { timestamps: true }
);

PostInteractionSchema.index({ postId: 1, userId: 1, type: 1 }, { unique: true });

const PostInteraction =
  models.PostInteraction || model<IPostInteraction>('PostInteraction', PostInteractionSchema);

export default PostInteraction;
