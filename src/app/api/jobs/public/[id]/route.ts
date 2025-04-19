import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import clientPromise from '@/lib/mongodb';
import JobModel from '@/models/Job';

// Function to ensure mongoose is connected
async function dbConnect() {
  // Check if mongoose is already connected
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  // Get the MongoDB connection string from env or client
  const client = await clientPromise;
  const uri = process.env.MONGODB_URI;
  
  // Connect mongoose to MongoDB
  return mongoose.connect(uri!);
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid job ID format' },
        { status: 400 }
      );
    }
    
    await dbConnect();
    
    // Find job by ID
    const job = await JobModel.findById(id).lean();
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    // Return job details
    return NextResponse.json(job);
  } catch (error: any) {
    console.error('Error fetching job details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job details', details: error.message },
      { status: 500 }
    );
  }
}
