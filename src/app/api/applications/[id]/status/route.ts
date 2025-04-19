import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import clientPromise from '@/lib/mongodb';
import { authOptions, SessionUser } from '@/app/api/auth/[...nextauth]/route';
import JobApplication, { APPLICATION_STATUS, ApplicationStatus } from '@/models/JobApplication';
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

// PUT endpoint for HR to update the status of a specific job application
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

  const applicationId = params.id;

  // 2. Validate Application ID
  if (!applicationId || !mongoose.Types.ObjectId.isValid(applicationId)) {
    return NextResponse.json(
      { error: 'Invalid application ID' },
      { status: 400 }
    );
  }

  let newStatus: ApplicationStatus;
  let hireNftUri: string | undefined; // Declare variables outside the try block
  let hireNftTxHash: string | undefined;

  // 3. Parse and Validate Request Body
  try {
    const body = await request.json();
    newStatus = body.status;
    // Assign values inside the try block
    hireNftUri = body.hireNftUri;
    hireNftTxHash = body.hireNftTxHash;

    if (!newStatus || !APPLICATION_STATUS.includes(newStatus)) {
      return NextResponse.json(
        { error: 'Invalid status value provided.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Failed to parse request JSON:", error);
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  // Check if newStatus was successfully assigned before proceeding
  if (!newStatus) {
    return NextResponse.json({ error: 'Failed to determine status from request body.' }, { status: 400 });
  }

  try {
    await dbConnect();

    // 4. Find the Application
    const application = await JobApplication.findById(applicationId);

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // 5. Verify Job Ownership (Security Check!)
    const job = await JobModel.findById(application.jobId).select('postedBy').lean();
    if (!job) {
        return NextResponse.json({ error: 'Associated job not found.' }, { status: 404 });
    }
    if (job.postedBy.toString() !== user.id) {
        return NextResponse.json(
            { error: 'Forbidden: You do not own the job associated with this application.' },
            { status: 403 }
        );
    }

    // 6. Update the Status
    application.status = newStatus;
    // Save hire NFT info if provided
    if (hireNftUri) application.hireNftUri = hireNftUri;
    if (hireNftTxHash) application.hireNftTxHash = hireNftTxHash;
    application.updatedAt = new Date(); // Manually update timestamp
    const updatedApplication = await application.save();

    console.log(`Application status updated: ${updatedApplication._id} to ${newStatus} by HR User: ${user.id}`);

    // 7. Return Success Response
    return NextResponse.json(
      {
        _id: updatedApplication._id,
        status: updatedApplication.status,
        updatedAt: updatedApplication.updatedAt,
        hireNftUri: updatedApplication.hireNftUri,
        hireNftTxHash: updatedApplication.hireNftTxHash,
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error(`PUT /api/applications/[id]/status failed: ${error.name} - ${error.message}`);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((el: any) => el.message);
      return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
    }
    if (error.message.includes('timed out') || error.message.includes('ECONNREFUSED') || error.message.includes('topology was destroyed')) {
      return NextResponse.json({ error: 'Database connection error.', details: error.message }, { status: 503 });
    }

    return NextResponse.json(
      { error: 'Failed to update application status', details: error.message },
      { status: 500 }
    );
  }
}
