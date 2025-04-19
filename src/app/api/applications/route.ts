import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import clientPromise from '@/lib/mongodb';
import { authOptions, SessionUser } from '@/app/api/auth/[...nextauth]/route';
import JobApplication from '@/models/JobApplication';
import JobModel from '@/models/Job';

// Function to ensure mongoose is connected
async function dbConnect() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  const client = await clientPromise;
  const uri = process.env.MONGODB_URI;
  
  return mongoose.connect(uri!);
}

// POST endpoint for creating a job application
export async function POST(request: Request) {
  // Get user session
  const session = await getServerSession(authOptions as any);
  const user = (session as any)?.user as SessionUser | undefined;
  
  // Ensure user is authenticated
  if (!session || !user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  // Parse request body
  let applicationData;
  try {
    applicationData = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
  
  // Validate required fields
  const { jobId, coverLetter } = applicationData;
  
  if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
    return NextResponse.json(
      { error: 'Valid job ID is required' },
      { status: 400 }
    );
  }
  
  if (!coverLetter || coverLetter.trim() === '') {
    return NextResponse.json(
      { error: 'Cover letter is required' },
      { status: 400 }
    );
  }
  
  try {
    await dbConnect();
    
    // Verify the job exists and is open
    const job = await JobModel.findById(jobId).lean();
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    if (job.status !== 'Open') {
      return NextResponse.json(
        { error: 'This job is no longer accepting applications' },
        { status: 400 }
      );
    }
    
    // Check if user already applied to this job
    const existingApplication = await JobApplication.findOne({
      jobId,
      userId: user.id
    });
    
    if (existingApplication) {
      return NextResponse.json(
        { error: 'You have already applied for this job' },
        { status: 409 }
      );
    }
    
    // Create new application
    const newApplication = new JobApplication({
      jobId,
      userId: user.id,
      coverLetter,
      resume: applicationData.resume || null,
      status: 'pending'
    });
    
    // Save the application
    await newApplication.save();
    
    return NextResponse.json(
      { success: true, message: 'Application submitted successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating job application:', error);
    
    // Handle duplicate application error from MongoDB
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'You have already applied for this job' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to submit application', details: error.message },
      { status: 500 }
    );
  }
}
