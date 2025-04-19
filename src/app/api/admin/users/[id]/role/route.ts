import { getServerSession } from "next-auth";
import { authOptions, SessionUser } from "@/app/api/auth/[...nextauth]/route"; // Correctly import SessionUser
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession((authOptions as any));
  const user = session?.user as SessionUser | undefined;

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { role } = await req.json();
  const validRoles = ["user", "admin", "hr"]; // Define valid roles

  if (!role || !validRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
  }

  let userId;
  try {
    userId = new ObjectId(params.id);
  } catch (error) {
    return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 });
  }

  // Prevent admin from changing their own role via this endpoint for safety
  if (user.id === params.id) { // Check against user.id from session
      return NextResponse.json({ error: "Admin cannot change their own role here" }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const result = await client.db().collection("users").updateOne(
      { _id: userId },
      { $set: { role: role } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `User role updated to ${role}` });
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
