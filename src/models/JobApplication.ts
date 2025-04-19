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
  hireNftUri?: string; // NFT minted on acceptance/hire
  hireNftTxHash?: string; // Transaction hash of the NFT minting
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
    // NFT minted on acceptance/hire
    hireNftUri: {
      type: String,
      trim: true,
      default: null,
    },
    hireNftTxHash: {
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

// after status PUT succeeds
async function handleStatusUpdate(newStatus: ApplicationStatus, starknetService: any, applicant: any, jobId: string, jobTitle: string, applicationId: string, metadataUri: string) {
  if (newStatus === 'accepted' && starknetService) {
    // Mint on‑chain
    const { success, txHash, error } = await starknetService.hireDeveloper(
      applicant.user.email,       // developer address
      jobId,                      // felt job ID
      jobTitle,                   // felt company name
      jobTitle,                   // felt job title
      `[IPFS URI or metadata JSON]`
    );
    if (success) {
      // Update with hire NFT on our API
      await fetch(`/api/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ status:'accepted', hireNftUri: metadataUri, hireNftTxHash: txHash })
      });
    } else {
      toast.error(`Hire mint failed: ${error}`);
    }
  }
}

export default JobApplication;
