// app/api/jobs/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions, SessionUser } from "@/app/api/auth/[...nextauth]/route"; // Adjust path
import clientPromise from '@/lib/mongodb'; // Import as clientPromise, not dbConnect
import mongoose from 'mongoose';
import JobModel, { IJob } from '@/models/Job'; // Import model and interface
import { JobPostClientData } from '../../types/job'; // Import client data type from shared types
import HRProfile from '@/models/HRProfile'; // Adjust path

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

// --- POST Handler: Create New Job Posting ---
export async function POST(request: Request) {
  // Consider strongly typing authOptions if possible instead of `as any`
  const session = await getServerSession(authOptions as any);
  // Consider strongly typing the session object if possible
  const user = (session as any)?.user as SessionUser | undefined;

  // 1. Authentication & Authorization Check
  if (!session || !user || user.role !== 'hr') {
    return NextResponse.json({ error: 'Unauthorized: HR role required.' }, { status: 401 });
  }
  if (!user.id) {
     // Ensure user.id is reliably populated in your session callback
     console.error("User ID missing from session:", session);
     return NextResponse.json({ error: 'User ID missing from session.' }, { status: 400 });
  }

  let jobData: JobPostClientData;
  try {
     jobData = await request.json();
  } catch (error) {
     console.error("Failed to parse request JSON:", error);
     return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  // 2. Basic Server-Side Validation (Schema validation is more robust)
  if (!jobData.title || !jobData.company || !jobData.location || !jobData.description || !jobData.techStack || jobData.techStack.length === 0) {
      return NextResponse.json({ error: 'Missing required fields (title, company, location, description, techStack).' }, { status: 400 });
  }
   if (jobData.salaryMin !== undefined && jobData.salaryMax !== undefined && jobData.salaryMin > jobData.salaryMax) {
     return NextResponse.json({ error: 'Minimum salary cannot be greater than maximum salary.' }, { status: 400 });
   }
   // Add checks for negative salaries if desired
   if (jobData.salaryMin !== undefined && jobData.salaryMin < 0) {
       return NextResponse.json({ error: 'Minimum salary cannot be negative.' }, { status: 400 });
   }
   if (jobData.salaryMax !== undefined && jobData.salaryMax < 0) {
       return NextResponse.json({ error: 'Maximum salary cannot be negative.' }, { status: 400 });
   }

  try {
    // Connect to database using our new function
    await dbConnect();
    console.log("Database connected successfully for POST /api/jobs"); // Add log

    // Optional: Fetch HR Profile ID to link it
    let hrProfile = null;
    try {
         // Ensure user.id is suitable for querying (string or ObjectId)
         // Mongoose can usually handle string representations of ObjectIds
         hrProfile = await HRProfile.findOne({ userId: user.id })
                                  .select('_id') // Only fetch the _id
                                  .lean(); // Use lean for plain object
         console.log("HR Profile found:", hrProfile); // Add log
    } catch (profileError) {
        console.error("Error fetching HR Profile:", profileError);
        // Decide if this is fatal. Maybe just log and continue without linking?
        // For now, we'll let it proceed without hrProfileId if fetch fails
    }


    // 3. Prepare data for saving
    // Ensure correct types are passed to the model constructor
    const newJobData = {
      ...jobData,
      postedBy: new mongoose.Types.ObjectId(user.id), // Convert user.id string to ObjectId
      // Use the fetched _id directly. Mongoose handles ObjectId type.
      // Ensure hrProfile and hrProfile._id exist before accessing
      hrProfileId: hrProfile?._id ? hrProfile._id : undefined,
      status: 'Open', // Default status
      // Clean up tech stack tags
      techStack: jobData.techStack.map(tag => tag.trim()).filter(tag => tag.length > 0),
      // Ensure number fields are correctly handled if they are optional
      salaryMin: jobData.salaryMin,
      salaryMax: jobData.salaryMax,
      employmentType: jobData.employmentType || undefined, // Use undefined if empty string
      experienceLevel: jobData.experienceLevel || undefined, // Use undefined if empty string
    };

    // 4. Create and Save the new Job document
    console.log("Attempting to save job:", newJobData); // Add log
    const createdJob = new JobModel(newJobData);
    await createdJob.save(); // This will run Mongoose schema validations
    console.log("Job saved successfully:", createdJob._id); // Add log

    // 5. Return the created job data
    return NextResponse.json(createdJob, { status: 201 }); // 201 Created

  } catch (error: any) {
    console.error('POST /api/jobs failed:', error); // Log the detailed error

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map((el: any) => el.message);
        return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
    }
    // Handle potential MongoDB duplicate key errors (e.g., if you add unique indexes)
    if (error.code === 11000) {
        return NextResponse.json({ error: 'Duplicate data error.', details: error.message }, { status: 409 }); // 409 Conflict
    }
    // Handle connection errors explicitly if needed (though dbConnect should throw)
    if (error.message.includes('timed out') || error.message.includes('ECONNREFUSED')) {
        return NextResponse.json({ error: 'Database connection error.', details: error.message }, { status: 503 }); // 503 Service Unavailable
    }

    // Generic fallback error
    return NextResponse.json({ error: 'Failed to create job posting', details: error.message }, { status: 500 });
  }
}

// --- GET Handler (Example - Fetch jobs posted by the current HR) ---
export async function GET(request: Request) {
    // Consider strongly typing authOptions and session
    const session = await getServerSession(authOptions as any);
    const user = (session as any)?.user as SessionUser | undefined;

    if (!session || !user || user.role !== 'hr') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
     if (!user.id) {
        console.error("User ID missing from session:", session);
        return NextResponse.json({ error: 'User ID missing' }, { status: 400 });
    }

    try {
        // Use our new dbConnect function
        await dbConnect();
        console.log("Database connected successfully for GET /api/jobs"); // Add log

        // Find jobs posted by the specific user's ObjectId
        const jobs = await JobModel.find({ postedBy: new mongoose.Types.ObjectId(user.id) })
                              .sort({ createdAt: -1 }) // Sort by newest first
                              .lean(); // Use lean for performance

        console.log(`Found ${jobs.length} jobs for user ${user.id}`); // Add log
        return NextResponse.json(jobs, { status: 200 });

    } catch (error: any) {
        console.error('GET /api/jobs failed:', error); // Log the detailed error
        // Handle connection errors explicitly if needed
         if (error.message.includes('timed out') || error.message.includes('ECONNREFUSED')) {
            return NextResponse.json({ error: 'Database connection error.', details: error.message }, { status: 503 }); // 503 Service Unavailable
         }
        // Generic fallback error
        return NextResponse.json({ error: 'Failed to fetch jobs', details: error.message }, { status: 500 });
    }
}