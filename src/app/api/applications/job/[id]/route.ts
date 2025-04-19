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
    // Convert user.id string to ObjectId for comparison
    const job = await JobModel.findOne({
      _id: new mongoose.Types.ObjectId(jobId),
      postedBy: new mongoose.Types.ObjectId(user.id) // Convert session user ID to ObjectId
    }).lean();
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found or you do not have permission to access it' },
        { status: 404 }
      );
    }
    
    // Use aggregation to join with users and then profiles collection
    // Get the database instance from the mongoose connection
    const db = mongoose.connection.db;
    const applications = await db.collection('jobapplications')
      .aggregate([
        { $match: { jobId: new mongoose.Types.ObjectId(jobId) } },
        // First, lookup the user details
        {
          $lookup: {
            from: 'users', // The collection containing user login info (name, email, photo)
            localField: 'userId',
            foreignField: '_id', // Assuming 'users' collection uses _id
            as: 'userInfo'
          }
        },
        { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } }, // Keep application even if user lookup fails
        // Second, lookup the developer profile using the email from userInfo
        {
          $lookup: {
            from: 'profiles', // The collection containing detailed developer profiles
            localField: 'userInfo.email', // Use the email fetched from the 'users' collection
            foreignField: 'email', // Assuming 'profiles' collection uses email as the key
            as: 'profileInfo'
          }
        },
        { $unwind: { path: '$profileInfo', preserveNullAndEmptyArrays: true } }, // Keep application even if profile lookup fails
        // Project the desired combined output
        {
          $project: {
            _id: 1, // Application ID
            userId: 1,
            coverLetter: 1,
            resume: 1, // Keep resume if it exists
            status: 1,
            createdAt: 1,
            updatedAt: 1,
            // Basic user info (from 'users' collection)
            user: {
              name: '$userInfo.name',
              email: '$userInfo.email',
              photo: '$userInfo.photo'
            },
            // Detailed profile info (from 'profiles' collection)
            profile: {
              // Select the fields you need from the profile
              bio: '$profileInfo.bio',
              skills: '$profileInfo.skills',
              github: '$profileInfo.github',
              leetcode: '$profileInfo.leetcode',
              gfg: '$profileInfo.gfg',
              scores: '$profileInfo.scores',
              leetCodeStats: '$profileInfo.leetCodeStats',
              gfgStats: '$profileInfo.gfgStats',
              photo: `$profileInfo.photo`, // Assuming photo is in the profile collection
              projects: '$profileInfo.projects' // Add projects field
              // Add other relevant profile fields here
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
