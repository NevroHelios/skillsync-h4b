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
  try {
    const session = await getServerSession(authOptions as any);
    const user = session?.user as SessionUser | undefined;

    // Only allow HR users to access this endpoint
    if (!session || !user || user.role !== 'hr') {
      return NextResponse.json(
        { error: 'Unauthorized. HR role required.' },
        { status: 403 }
      );
    }

    const jobId = params.id;

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return NextResponse.json(
        { error: 'Invalid job ID format' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if job exists and belongs to the requesting HR
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
            hireNftUri: 1,
            hireNftTxHash: 1,
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
              // IMPORTANT: Get the wallet address from the profile - prioritize starknetAddress field but also check wallet field
              starknetAddress: { 
                $cond: [
                  { $ifNull: ['$profileInfo.starknetAddress', false] }, 
                  '$profileInfo.starknetAddress', 
                  // If starknetAddress doesn't exist, try the wallet field
                  { $ifNull: ['$profileInfo.wallet', '0x0000000000000000000000000000000000000000000000000000000000000000'] }
                ]
              }
            }
          }
        },
        { $sort: { updatedAt: -1 } } // Sort by update date (newest first)
      ]).toArray();

    return NextResponse.json(applications);
  } catch (error: any) {
    console.error('Error fetching job applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job applications', details: error.message },
      { status: 500 }
    );
  }
}
