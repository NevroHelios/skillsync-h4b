import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, SessionUser } from '@/app/api/auth/[...nextauth]/route';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET handler to fetch HR profile
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined;

  // Allow fetching only own profile or if admin (optional)
  const url = new URL(req.url);
  const email = url.searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email query parameter is required" }, { status: 400 });
  }

  if (!user || (user.email !== email && user.role !== 'admin')) {
     // Allow HR to fetch their own profile
     if (user?.role !== 'hr' || user.email !== email) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
     }
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    // Store HR profiles in a separate collection or identify by role in 'profiles'
    // Using 'profiles' collection and adding a check/field for role='hr' might be simpler
    // Or use a dedicated 'hr_profiles' collection
    const profile = await db.collection("hr_profiles").findOne({ email });

    if (!profile) {
      // Return 404 but allow frontend to potentially show a 'create profile' state
      return NextResponse.json({ error: "HR Profile not found" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error fetching HR profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST handler to create/update HR profile (upsert)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined;

  if (!user || user.role !== 'hr') {
    // Only HR users can update their own profile via this route
    return NextResponse.json({ error: "Forbidden: Only HR users can update their profile." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { email, name, company, department, phone, photo } = body;

    // Ensure the user is updating their own profile
    if (user.email !== email) {
        return NextResponse.json({ error: "Forbidden: Cannot update another user's profile." }, { status: 403 });
    }

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection("hr_profiles");

    const updateData = {
      $set: {
        email,
        name: name || null,
        company: company || null,
        department: department || null,
        phone: phone || null,
        photo: photo || null, // Add photo if included
        updatedAt: new Date(),
      },
      $setOnInsert: {
         createdAt: new Date(),
      }
    };

    const result = await collection.updateOne(
      { email: email }, // Filter by email
      updateData,
      { upsert: true } // Create if doesn't exist, update if exists
    );

     if (!result.acknowledged) {
        throw new Error("Database operation failed");
     }

     // Fetch the updated/created profile to return it
     const updatedProfile = await collection.findOne({ email });

    return NextResponse.json(updatedProfile); // Return the updated/created profile data

  } catch (error: any) {
    console.error("Error saving HR profile:", error);
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}
