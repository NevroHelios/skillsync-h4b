// models/HRProfile.ts
import mongoose, { Schema, Document, models, Model } from 'mongoose';
import { SessionUser } from '@/app/api/auth/[...nextauth]/route'; // Adjust path if needed

// Interface for the document structure in MongoDB
export interface IHRProfile extends Document {
  userId: mongoose.Schema.Types.ObjectId; // Link to the User model
  email: string; // Indexed and unique
  name?: string;
  company?: string;
  department?: string;
  phone?: string;
  photo?: string; // URL to profile photo
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose Schema
const HRProfileSchema: Schema<IHRProfile> = new Schema(
  {
    // We'll link this to the main User model ID when saving/updating
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Assuming your main user model is named 'User'
      required: true,
      unique: true, // One profile per user
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      match: [/.+\@.+\..+/, 'Please fill a valid email address'],
      index: true, // Index for faster lookups
    },
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters'],
    },
    company: {
      type: String,
      trim: true,
      maxlength: [100, 'Company name cannot be more than 100 characters'],
    },
    department: {
      type: String,
      trim: true,
      maxlength: [100, 'Department name cannot be more than 100 characters'],
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, 'Phone number cannot be more than 20 characters'],
      // Basic validation example (adapt as needed)
      // match: [/^\+?[0-9\s\-()]*$/, 'Please fill a valid phone number'],
    },
    photo: {
      type: String, // Store URL
      trim: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Prevent model overwrite during hot-reloading
const HRProfile: Model<IHRProfile> = models.HRProfile || mongoose.model<IHRProfile>('HRProfile', HRProfileSchema);

export default HRProfile;

// Interface for the data sent from the client (doesn't include _id, userId, timestamps initially)
export interface HRProfileClientData {
    email: string; // Keep email for identification if needed, though userId is primary
    name?: string;
    company?: string;
    department?: string;
    phone?: string;
    photo?: string;
}