import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import mongoose from 'mongoose';
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

export async function GET() {
  try {
    await dbConnect();
    
    // Fetch all jobs with status 'Open'
    const jobs = await JobModel.find({ status: 'Open' })
      .sort({ createdAt: -1 }) // Newest first
      .lean(); // Use lean for better performance
    
    return NextResponse.json(jobs);
  } catch (error: any) {
    console.error('Error fetching public jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs', details: error.message },
      { status: 500 }
    );
  }
}
