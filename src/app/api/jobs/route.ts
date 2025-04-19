// app/api/jobs/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions, SessionUser } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from '@/lib/mongodb';
import mongoose from 'mongoose';
import JobModel, { IJob } from '@/models/Job'; // Import updated model and interface
import { JobPostClientData } from '@/models/Job'; // Import client data type from model file
import HRProfile from '@/models/HRProfile';

// Function to ensure mongoose is connected
async function dbConnect() {
  if (mongoose.connection.readyState >= 1) return;
  const client = await clientPromise;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Missing MONGODB_URI in environment variables');
  return mongoose.connect(uri);
}

// --- POST Handler: Create New Job Posting ---
export async function POST(request: Request) {
  const session = await getServerSession(authOptions as any);
  const user = (session as any)?.user as SessionUser | undefined;

  // 1. Auth Check
  if (!session || !user || user.role !== 'hr' || !user.id) {
    return NextResponse.json({ error: 'Unauthorized or User ID missing.' }, { status: 401 });
  }

  // 2. Parse and Validate Request Body
  let jobData: JobPostClientData;
  try {
    jobData = await request.json();
    // Basic Server-Side Validation (Schema validation is more robust)
    if (!jobData.title || !jobData.company || !jobData.location || !jobData.description || !jobData.techStack || jobData.techStack.length === 0) {
        return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }
    if (jobData.salaryMin !== undefined && jobData.salaryMax !== undefined && jobData.salaryMin > jobData.salaryMax) {
        return NextResponse.json({ error: 'Min salary > Max salary.' }, { status: 400 });
    }
     if ((jobData.salaryMin !== undefined && jobData.salaryMin < 0) || (jobData.salaryMax !== undefined && jobData.salaryMax < 0)){
         return NextResponse.json({ error: 'Salaries cannot be negative.' }, { status: 400 });
     }
  } catch (error) {
    console.error("Failed to parse request JSON:", error);
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  let createdJob: IJob | null = null; // Keep track of the created job document

  try {
    // 3. Connect to Database
    await dbConnect();
    console.log("Database connected successfully for POST /api/jobs");

    // Optional: Fetch HR Profile ID
    let hrProfileId: mongoose.Types.ObjectId | undefined = undefined;
    try {
      const hrProfile = await HRProfile.findOne({ userId: user.id }).select('_id').lean();
      if (hrProfile) {
        hrProfileId = hrProfile._id;
        console.log("HR Profile found:", hrProfileId);
      }
    } catch (profileError) {
      console.warn("Could not fetch HR Profile:", profileError); // Non-fatal warning
    }

    // 4. Prepare data for MongoDB saving
    const newJobData = {
      ...jobData,
      postedBy: new mongoose.Types.ObjectId(user.id),
      hrProfileId: hrProfileId,
      status: 'Open',
      techStack: jobData.techStack.map(tag => tag.trim()).filter(tag => tag.length > 0),
      salaryMin: jobData.salaryMin,
      salaryMax: jobData.salaryMax,
      employmentType: jobData.employmentType || undefined,
      experienceLevel: jobData.experienceLevel || undefined,
      // StarkNet fields initially empty
      starknetTokenId: undefined,
      starknetTransactionHash: undefined,
    };

    // 5. Create and Save the Job document to MongoDB
    console.log("Attempting to save job to MongoDB:", newJobData.title);
    const jobToSave = new JobModel(newJobData);
    createdJob = await jobToSave.save(); // Assign to outer scope variable
    console.log("Job saved successfully to MongoDB:", createdJob._id);

    // --- REMOVE StarkNet NFT Minting from backend ---
    // The frontend will now handle NFT minting via wallet

    // 6. Return the created job data (no NFT info yet)
    return NextResponse.json(createdJob, { status: 201 });

  } catch (error: any) {
    console.error('POST /api/jobs MongoDB or setup failed:', error);

    // Handle DB errors
    if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map((el: any) => el.message);
        return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
    }
    if (error.code === 11000) {
        return NextResponse.json({ error: 'Duplicate data error.', details: error.message }, { status: 409 });
    }
    if (error.message.includes('timed out') || error.message.includes('ECONNREFUSED') || error.message.includes('topology was destroyed')) {
        return NextResponse.json({ error: 'Database connection error.', details: error.message }, { status: 503 });
    }

    // Generic fallback error
    return NextResponse.json({ error: 'Failed to create job posting', details: error.message }, { status: 500 });
  }
}

// --- GET Handler (Remains the same, fetches jobs including potential NFT fields) ---
export async function GET(request: Request) {
    const session = await getServerSession(authOptions as any);
    const user = (session as any)?.user as SessionUser | undefined;

    if (!session || !user || user.role !== 'hr' || !user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();
        console.log("Database connected successfully for GET /api/jobs");

        const jobs = await JobModel.find({ postedBy: new mongoose.Types.ObjectId(user.id) })
                              .sort({ createdAt: -1 })
                              .lean(); // lean is good, returns plain objects

        console.log(`Found ${jobs.length} jobs for user ${user.id}`);
        return NextResponse.json(jobs, { status: 200 });

    } catch (error: any) {
        console.error('GET /api/jobs failed:', error);
         if (error.message.includes('timed out') || error.message.includes('ECONNREFUSED') || error.message.includes('topology was destroyed')) {
            return NextResponse.json({ error: 'Database connection error.', details: error.message }, { status: 503 });
         }
        return NextResponse.json({ error: 'Failed to fetch jobs', details: error.message }, { status: 500 });
    }
}