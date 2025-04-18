import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "next-auth/react"; // Or server-side equivalent if needed

export async function POST(req: NextRequest) {
  try {
    // Ensure user is authenticated (important!)
    // This needs adjustment based on how you handle auth in API routes (e.g., next-auth getServerSession)
    // const session = await getServerSession(authOptions); // Example using next-auth v4+
    // if (!session?.user?.email) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }
    // const likerEmail = session.user.email;

    const {
      projectOwnerEmail, // Email of the user whose profile/project it is
      projectName,
      action, // "like" or "dislike"
      likerEmail, // Email of the user performing the action (passed from client for now)
    } = await req.json();

    if (!projectOwnerEmail || !projectName || !action || !likerEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (action !== "like" && action !== "dislike") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const likesCollection = db.collection("projectLikes");

    const filter = { projectOwnerEmail, projectName, likerEmail };
    const update = {
      $set: {
        action: action,
        timestamp: new Date(),
      },
    };

    // Upsert: Update if exists, insert if not
    const result = await likesCollection.updateOne(filter, update, { upsert: true });

    if (result.acknowledged) {
      // Optionally, recalculate and return updated counts for the project
      const likeCount = await likesCollection.countDocuments({ projectOwnerEmail, projectName, action: "like" });
      const dislikeCount = await likesCollection.countDocuments({ projectOwnerEmail, projectName, action: "dislike" });
      return NextResponse.json({ success: true, likes: likeCount, dislikes: dislikeCount });
    } else {
      throw new Error("Database update failed");
    }

  } catch (error) {
    console.error("Project Like API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
