import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// Predefined Tech Stack Tags (can be expanded)
export const PREDEFINED_TECH_TAGS = ["Frontend", "Backend", "AI/ML", "Cloud", "DevOps", "Mobile", "Data Science", "QA", "Security"];
export const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Temporary", "Internship"];
export const EXPERIENCE_LEVELS = ["Entry-level", "Mid-level", "Senior-level", "Lead", "Manager"];

// Interface for the Job document in MongoDB
export interface IJob extends Document {
  title: string;
  company: string;
  location: string;
  description: string;
  techStack: string[];
  salaryMin?: number;
  salaryMax?: number;
  employmentType?: typeof EMPLOYMENT_TYPES[number];
  experienceLevel?: typeof EXPERIENCE_LEVELS[number];
  postedBy: Types.ObjectId;
  hrProfileId?: Types.ObjectId;
  status: 'Open' | 'Closed' | 'Draft';
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose Schema
const JobSchema: Schema<IJob> = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required.'],
      trim: true,
      maxlength: [150, 'Job title cannot exceed 150 characters.'],
    },
    company: {
      type: String,
      required: [true, 'Company name is required.'],
      trim: true,
      maxlength: [100, 'Company name cannot exceed 100 characters.'],
    },
    location: {
      type: String,
      required: [true, 'Location is required.'],
      trim: true,
      maxlength: [100, 'Location cannot exceed 100 characters.'],
    },
    description: {
      type: String,
      required: [true, 'Job description (JD) is required.'],
      trim: true,
    },
    techStack: {
      type: [String],
      required: [true, 'At least one tech stack tag is required.'],
      validate: [(v: string[]) => Array.isArray(v) && v.length > 0, 'Add at least one tech tag.'],
    },
    salaryMin: {
      type: Number,
      min: [0, 'Minimum salary cannot be negative.'],
    },
    salaryMax: {
      type: Number,
      min: [0, 'Maximum salary cannot be negative.'],
    },
    employmentType: {
      type: String,
      enum: {
        values: EMPLOYMENT_TYPES,
        message: 'Invalid employment type.'
      },
    },
    experienceLevel: {
      type: String,
      enum: {
          values: EXPERIENCE_LEVELS,
          message: 'Invalid experience level.'
      },
    },
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    hrProfileId: {
        type: Schema.Types.ObjectId,
        ref: 'HRProfile',
        index: true,
    },
    status: {
      type: String,
      enum: ['Open', 'Closed', 'Draft'],
      default: 'Open',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// More robust model registration pattern
let Job: Model<IJob>;

try {
  // Try to retrieve existing model
  Job = mongoose.model<IJob>('Job');
} catch (error) {
  // Model doesn't exist yet, define it
  Job = mongoose.model<IJob>('Job', JobSchema);
}

export default Job;

// Interface for data sent from the client to create a job
export interface JobPostClientData {
    title: string;
    company: string;
    location: string;
    description: string;
    techStack: string[];
    salaryMin?: number;
    salaryMax?: number;
    employmentType?: string;
    experienceLevel?: string;
}