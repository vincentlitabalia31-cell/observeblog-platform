import mongoose, { Schema, model, models } from 'mongoose';

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: 'contributor' | 'admin';
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  bio?: string;
  affiliation?: string;
  image?: string;
  suspended?: boolean;
  suspendedAt?: Date;
  suspensionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['contributor', 'admin'], default: 'contributor' },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    bio: { type: String, default: '' },
    affiliation: { type: String, default: '' },
    image: { type: String },
    suspended: { type: Boolean, default: false, index: true },
    suspendedAt: { type: Date },
    suspensionReason: { type: String, trim: true, maxlength: 500 }
  },
  { timestamps: true }
);

const User = models.User || model<IUser>('User', UserSchema);
export default User;
