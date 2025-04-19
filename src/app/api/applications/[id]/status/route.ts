import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import clientPromise from '@/lib/mongodb';
import { authOptions, SessionUser } from '@/app/api/auth/[...nextauth]/route';
import JobApplication, { APPLICATION_STATUS } from '@/models/JobApplication';
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

// PATCH endpoint to update application status
export async function PATCH(
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
  
  const applicationId = params.id;
  
  if (!applicationId || !mongoose.Types.ObjectId.isValid(applicationId)) {
    return NextResponse.json(
      { error: 'Invalid application ID' },
      { status: 400 }
    );
  }
  
  // Parse request body
  let updateData;
  try {
    updateData = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
  
  // Validate status
  const { status } = updateData;
  
  if (!status || !APPLICATION_STATUS.includes(status)) {
    return NextResponse.json(
      { error: 'Invalid application status', allowed: APPLICATION_STATUS },
      { status: 400 }
    );
  }
  
  try {
    await dbConnect();
    
    // Get application
    const application = await JobApplication.findById(applicationId);
    
    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }
    
    // Check if the HR user owns the job
    const job = await JobModel.findOne({
      _id: application.jobId,
      postedBy: user.id
    }).lean();
    
    if (!job) {
      return NextResponse.json(
        { error: 'You do not have permission to update this application' },
        { status: 403 }
      );
    }
    
    // Update application status
    application.status = status;
    await application.save();
    
    return NextResponse.json({
      success: true,
      message: 'Application status updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating application status:', error);
    return NextResponse.json(
      { error: 'Failed to update application status', details: error.message },
      { status: 500 }
    );
  }
}
