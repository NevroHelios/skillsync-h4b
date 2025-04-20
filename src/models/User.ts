import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  email: string;
  role?: string;
  name?: string;
  photo?: string;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    role: { type: String, default: 'user' },
    name: { type: String },
    photo: { type: String },
  },
  { timestamps: true }
);

let UserModel: Model<IUser>;
try {
  UserModel = mongoose.model<IUser>('User');
} catch {
  UserModel = mongoose.model<IUser>('User', UserSchema);
}

export default UserModel;
