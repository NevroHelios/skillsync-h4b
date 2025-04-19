import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// Application status enum
export const APPLICATION_STATUS = ['pending', 'reviewed', 'accepted', 'rejected'] as const;
export type ApplicationStatus = typeof APPLICATION_STATUS[number];

// Interface for the JobApplication document in MongoDB
export interface IJobApplication extends Document {
  jobId: Types.ObjectId;
  userId: Types.ObjectId;
  coverLetter: string;
  resume?: string;
  status: ApplicationStatus;
  notes?: string; // For HR to add notes about the applicant
  createdAt: Date;
  updatedAt: Date;
}

// Interface for client data
export interface JobApplicationClientData {
  jobId: string;
  coverLetter: string;
  resume?: string;
}

// Mongoose Schema
const JobApplicationSchema: Schema<IJobApplication> = new Schema(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job ID is required.'],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required.'],
      index: true,
    },
    coverLetter: {
      type: String,
      required: [true, 'Cover letter is required.'],
      trim: true,
    },
    resume: {
      type: String,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: APPLICATION_STATUS,
        message: 'Invalid application status.',
      },
      default: 'pending',
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Add a compound unique index to prevent multiple applications from same user to same job
JobApplicationSchema.index({ jobId: 1, userId: 1 }, { unique: true });

// More robust model registration pattern
let JobApplication: Model<IJobApplication>;

try {
  // Try to retrieve existing model
  JobApplication = mongoose.model<IJobApplication>('JobApplication');
} catch (error) {
  // Model doesn't exist yet, define it
  JobApplication = mongoose.model<IJobApplication>('JobApplication', JobApplicationSchema);
}

export default JobApplication;
