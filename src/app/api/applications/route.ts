import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import clientPromise from '@/lib/mongodb';
import { authOptions, SessionUser } from '@/app/api/auth/[...nextauth]/route';
import JobApplication, { IJobApplication, JobApplicationClientData, APPLICATION_STATUS } from '@/models/JobApplication';
import JobModel from '@/models/Job';

// Function to ensure mongoose is connected
async function dbConnect() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  const client = await clientPromise;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Missing MONGODB_URI in environment variables');
  return mongoose.connect(uri);
}

// --- POST Handler: Create New Job Application ---
export async function POST(request: Request) {
  const session = await getServerSession(authOptions as any);
  const user = (session as any)?.user as SessionUser | undefined;

  // 1. Authentication & Authorization Check
  if (!session || !user || !user.id) {
    return NextResponse.json({ error: 'Unauthorized: Please sign in.' }, { status: 401 });
  }
  // Prevent HR users from applying
  if (user.role === 'hr') {
      return NextResponse.json({ error: 'Unauthorized: HR accounts cannot apply for jobs.' }, { status: 403 });
  }

  let applicationData: JobApplicationClientData;

  // 2. Parse and Validate Request Body
  try {
    applicationData = await request.json();
    if (!applicationData.jobId || !mongoose.Types.ObjectId.isValid(applicationData.jobId)) {
      return NextResponse.json({ error: 'Invalid or missing Job ID.' }, { status: 400 });
    }
    if (!applicationData.coverLetter || typeof applicationData.coverLetter !== 'string' || applicationData.coverLetter.trim().length === 0) {
      return NextResponse.json({ error: 'Cover letter is required.' }, { status: 400 });
    }
    // Basic length check for cover letter (optional)
    if (applicationData.coverLetter.length > 5000) { // Example limit
        return NextResponse.json({ error: 'Cover letter is too long (max 5000 characters).' }, { status: 400 });
    }

  } catch (error) {
    console.error("Failed to parse request JSON:", error);
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  try {
    await dbConnect();

    // 3. Check if Job Exists and is Open
    const job = await JobModel.findById(applicationData.jobId).select('status').lean();
    if (!job) {
      return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
    }
    if (job.status !== 'Open') {
      return NextResponse.json({ error: 'This job is no longer accepting applications.' }, { status: 400 });
    }

    // 4. Check if User Already Applied
    const existingApplication = await JobApplication.findOne({
      jobId: applicationData.jobId,
      userId: user.id
    }).lean();

    if (existingApplication) {
      return NextResponse.json({ error: 'You have already applied for this job.' }, { status: 409 }); // 409 Conflict
    }

    // 5. Create and Save New Application
    const newApplication = new JobApplication({
      jobId: applicationData.jobId,
      userId: user.id,
      coverLetter: applicationData.coverLetter.trim(),
      // resume: applicationData.resume, // Add if resume handling is implemented
      status: 'pending', // Initial status
      notes: '', // Initialize notes
    });

    const savedApplication = await newApplication.save();

    console.log(`Application created successfully: ${savedApplication._id} by User: ${user.id} for Job: ${applicationData.jobId}`);

    // 6. Return Success Response
    // Return only necessary fields, not the full Mongoose object
    const responseData = {
        _id: savedApplication._id,
        jobId: savedApplication.jobId,
        userId: savedApplication.userId,
        status: savedApplication.status,
        createdAt: savedApplication.createdAt
    };

    return NextResponse.json(responseData, { status: 201 });

  } catch (error: any) {
    console.error('POST /api/applications failed:', error);

    // Handle specific Mongoose errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((el: any) => el.message);
      return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
    }
    // Handle potential DB connection issues
    if (error.message.includes('timed out') || error.message.includes('ECONNREFUSED') || error.message.includes('topology was destroyed')) {
      return NextResponse.json({ error: 'Database connection error.', details: error.message }, { status: 503 });
    }

    // Generic fallback error
    return NextResponse.json({ error: 'Failed to submit application', details: error.message }, { status: 500 });
  }
}

// --- GET Handler (Optional: Could be used to get applications for the logged-in user) ---
// export async function GET(request: Request) {
//   // ... implementation to fetch applications submitted by the logged-in user ...
// }
