import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import clientPromise from '@/lib/mongodb';
import { authOptions, SessionUser } from '@/app/api/auth/[...nextauth]/route';
import JobApplication from '@/models/JobApplication';
import UserModel from '@/models/User';

// Function to ensure mongoose is connected
async function dbConnect() {
  if (mongoose.connection.readyState >= 1) return;
  const client = await clientPromise;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Missing MONGODB_URI in environment variables');
  return mongoose.connect(uri);
}

// GET /api/applications/user?email=...
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  if (!email) {
    return NextResponse.json({ error: 'Missing email parameter' }, { status: 400 });
  }

  try {
    await dbConnect();
    // Find user by email to get userId
    const user = await UserModel.findOne({ email }).select('_id email').lean();
    if (!user) {
      return NextResponse.json([], { status: 200 });
    }
    // Find all applications for this userId with hireNftUri
    const apps = await JobApplication.find({
      userId: user._id,
      hireNftUri: { $exists: true, $ne: null }
    })
      .select('hireNftUri hireNftTxHash status')
      .lean();

    return NextResponse.json(apps, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch applications', details: error.message }, { status: 500 });
  }
}
