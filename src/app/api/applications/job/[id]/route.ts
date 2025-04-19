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

// GET endpoint for HR to retrieve applications for a specific job
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Get user session
  const session = await getServerSession(authOptions as any);
  const user = (session as any)?.user as SessionUser | undefined;
  
  // Ensure user is authenticated and has HR role
  if (!session || !user || user.role !== 'hr') {
    return NextResponse.json(
      { error: 'Unauthorized: HR role required' },
      { status: 401 }
    );
  }
  
  const jobId = params.id;
  
  if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
    return NextResponse.json(
      { error: 'Invalid job ID' },
      { status: 400 }
    );
  }
  
  try {
    await dbConnect();
    
    // Verify the job exists and belongs to the HR user
    const job = await JobModel.findOne({
      _id: jobId,
      postedBy: user.id
    }).lean();
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found or you do not have permission to access it' },
        { status: 404 }
      );
    }
    
    // Get applications from MongoDB with user information
    const client = await clientPromise;
    const db = client.db();
    
    // Use aggregation to join with users collection
    const applications = await db.collection('jobapplications')
      .aggregate([
        { $match: { jobId: new mongoose.Types.ObjectId(jobId) } },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            userId: 1,
            coverLetter: 1,
            resume: 1,
            status: 1,
            createdAt: 1,
            updatedAt: 1,
            user: {
              name: '$userInfo.name',
              email: '$userInfo.email',
              photo: '$userInfo.photo'
            }
          }
        },
        { $sort: { createdAt: -1 } } // Newest first
      ])
      .toArray();
    
    return NextResponse.json(applications);
  } catch (error: any) {
    console.error('Error retrieving job applications:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve applications', details: error.message },
      { status: 500 }
    );
  }
}
