import { NextResponse } from 'next/server';
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
  if (!uri) throw new Error('Missing MONGODB_URI in environment variables');
  return mongoose.connect(uri);
}

// GET endpoint to check if the logged-in user has applied for a specific job
export async function GET(request: Request) {
  const session = await getServerSession(authOptions as any);
  const user = (session as any)?.user as SessionUser | undefined;

  // 1. Authentication Check
  if (!session || !user || !user.id) {
    // If not logged in, they haven't applied
    return NextResponse.json({ hasApplied: false });
  }

  // HR users don't apply, so return false for them
  if (user.role === 'hr') {
      return NextResponse.json({ hasApplied: false });
  }

  // 2. Get Job ID from Query Parameters
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
    return NextResponse.json({ error: 'Invalid or missing Job ID parameter' }, { status: 400 });
  }

  try {
    await dbConnect();

    // 3. Check for Existing Application
    const existingApplication = await JobApplication.findOne({
      jobId: new mongoose.Types.ObjectId(jobId),
      userId: new mongoose.Types.ObjectId(user.id)
    })
    .select('_id') // Only need to know if it exists
    .lean();

    // 4. Return Result
    return NextResponse.json({ hasApplied: !!existingApplication });

  } catch (error: any) {
    console.error('GET /api/applications/check failed:', error);
    // In case of error, it's safer to assume they haven't applied or let them try again
    // Returning an error might block the UI unnecessarily.
    // Alternatively, return a 500 error and handle it on the frontend.
    // For simplicity here, we return false on error.
    return NextResponse.json({ hasApplied: false, error: 'Failed to check application status' }, { status: 500 }); // Or just { hasApplied: false }
  }
}
