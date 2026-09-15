import { Schema, model } from 'mongoose';

export const UserRole = {
  ADMIN: 'ADMIN',
  USER: 'USER',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface IUser {
  _id: number;
  email: string;
  password: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    _id: { type: Number },
    email: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.USER },
  },
  { timestamps: true, _id: false }
);

userSchema.index({ email: 1 }, { unique: true });

export const User = model<IUser>('User', userSchema);
