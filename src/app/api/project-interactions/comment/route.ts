import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next"; // Import server-side session handler
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path if necessary
import { ObjectId } from 'mongodb'; // Import ObjectId

export async function POST(req: NextRequest) {
  try {
    // Ensure user is authenticated using server-side session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Get email and name reliably from the server session
    const commenterEmail = session.user.email;
    // Use email as fallback if name is not present in the session
    const commenterName = session.user.name || commenterEmail;

    const {
      projectOwnerEmail,
      projectName,
      comment,
      parentId, // Add parentId
    } = await req.json();

    // Validate required fields
    if (!projectOwnerEmail || !projectName || !comment) {
      return NextResponse.json({ error: "Missing required fields: projectOwnerEmail, projectName, comment" }, { status: 400 });
    }

    if (typeof comment !== 'string' || comment.trim().length === 0) {
       return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
    }

    // Validate parentId if provided
    let validParentId = null;
    if (parentId) {
        try {
            validParentId = new ObjectId(parentId);
        } catch (e) {
            return NextResponse.json({ error: "Invalid parentId format" }, { status: 400 });
        }
    }

    const client = await clientPromise;
    const db = client.db();
    const commentsCollection = db.collection("projectComments");

    // If parentId is valid, check if the parent comment exists (optional but good practice)
    if (validParentId) {
        const parentComment = await commentsCollection.findOne({ _id: validParentId, projectOwnerEmail, projectName });
        if (!parentComment) {
            return NextResponse.json({ error: "Parent comment not found" }, { status: 404 });
        }
    }

    const commentDoc = {
      projectOwnerEmail,
      projectName,
      commenterEmail, // From session
      commenterName, // From session (or email fallback)
      text: comment.trim(),
      timestamp: new Date(),
      parentId: validParentId, // Store ObjectId or null
    };

    const result = await commentsCollection.insertOne(commentDoc);

    if (result.acknowledged) {
      // Return the inserted comment including its _id and parentId
      return NextResponse.json({ success: true, comment: { ...commentDoc, _id: result.insertedId } });
    } else {
      throw new Error("Database insert failed");
    }

  } catch (error) {
    console.error("Project Comment API Error:", error);
    // Check if it's a duplicate key error (if you add unique indexes later)
    if (error instanceof Error && 'code' in error && error.code === 11000) {
        return NextResponse.json({ error: "Duplicate comment detected." }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
