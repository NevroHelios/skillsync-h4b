import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import clientPromise from '@/lib/mongodb';
import { authOptions, SessionUser } from '@/app/api/auth/[...nextauth]/route';
import JobApplication from '@/models/JobApplication';

// Function to ensure mongoose is connected
async function dbConnect() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  const client = await clientPromise;
  const uri = process.env.MONGODB_URI;
  
  return mongoose.connect(uri!);
}

// GET endpoint to check if a user has applied to a job
export async function GET(request: NextRequest) {
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
  
  // Get job ID from query params
  const searchParams = request.nextUrl.searchParams;
  const jobId = searchParams.get('jobId');
  
  if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
    return NextResponse.json(
      { error: 'Valid job ID is required' },
      { status: 400 }
    );
  }
  
  try {
    await dbConnect();
    
    // Check if application exists
    const application = await JobApplication.findOne({
      jobId,
      userId: user.id
    }).lean();
    
    return NextResponse.json({
      hasApplied: !!application
    });
  } catch (error: any) {
    console.error('Error checking application status:', error);
    return NextResponse.json(
      { error: 'Failed to check application status', details: error.message },
      { status: 500 }
    );
  }
}
