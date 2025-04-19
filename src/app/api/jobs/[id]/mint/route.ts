import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import clientPromise from '@/lib/mongodb';
import { authOptions, SessionUser } from '@/app/api/auth/[...nextauth]/route';
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

// PUT endpoint for HR to update the StarkNet minting details of a job
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions as any);
  const user = (session as any)?.user as SessionUser | undefined;

  // 1. Authentication & Authorization Check
  if (!session || !user || !user.id || user.role !== 'hr') {
    return NextResponse.json(
      { error: 'Unauthorized: HR role required' },
      { status: 401 }
    );
  }

  const jobId = params.id;

  // 2. Validate Job ID
  if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
    return NextResponse.json(
      { error: 'Invalid job ID' },
      { status: 400 }
    );
  }

  let starknetTxHash: string | undefined;
  let starknetTokenId: string | undefined; // Optional: if token ID is returned/needed

  // 3. Parse and Validate Request Body
  try {
    const body = await request.json();
    starknetTxHash = body.starknetTransactionHash;
    starknetTokenId = body.starknetTokenId; // Optional

    if (!starknetTxHash) {
      return NextResponse.json(
        { error: 'Missing starknetTransactionHash in request body.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Failed to parse request JSON:", error);
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  try {
    await dbConnect();

    // 4. Find the Job and Verify Ownership
    const job = await JobModel.findById(jobId);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Security Check: Ensure the logged-in HR user posted this job
    if (job.postedBy.toString() !== user.id) {
        return NextResponse.json(
            { error: 'Forbidden: You did not post this job.' },
            { status: 403 }
        );
    }

    // 5. Update the StarkNet details
    job.starknetTransactionHash = starknetTxHash;
    if (starknetTokenId) {
        job.starknetTokenId = starknetTokenId;
    }
    job.updatedAt = new Date(); // Manually update timestamp

    const updatedJob = await job.save();

    console.log(`Job StarkNet details updated: ${updatedJob._id} by HR User: ${user.id}`);

    // 6. Return Success Response
    return NextResponse.json(
      {
        _id: updatedJob._id,
        starknetTransactionHash: updatedJob.starknetTransactionHash,
        starknetTokenId: updatedJob.starknetTokenId,
        updatedAt: updatedJob.updatedAt,
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('PUT /api/jobs/[id]/mint failed:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((el: any) => el.message);
      return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
    }
    if (error.message.includes('timed out') || error.message.includes('ECONNREFUSED') || error.message.includes('topology was destroyed')) {
      return NextResponse.json({ error: 'Database connection error.', details: error.message }, { status: 503 });
    }

    return NextResponse.json(
      { error: 'Failed to update job StarkNet details', details: error.message },
      { status: 500 }
    );
  }
}