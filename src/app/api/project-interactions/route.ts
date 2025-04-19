import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const projectOwnerEmail = url.searchParams.get("email");
    const viewerEmail = url.searchParams.get("viewerEmail");

    if (!projectOwnerEmail) {
      return NextResponse.json({ error: "Project owner email required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const likesCollection = db.collection("projectLikes");
    const commentsCollection = db.collection("projectComments");
    const projectsCollection = db.collection("projects");

    // 1. Get all projects for the owner
    const ownerProjects = await projectsCollection.find(
        { userEmail: projectOwnerEmail },
        { projection: { name: 1, _id: 0 } }
    ).toArray();

    const projectNames = ownerProjects.map(p => p.name);
    if (projectNames.length === 0) {
        return NextResponse.json({}); // No projects, return empty object
    }

    // 2. Aggregate Likes/Dislikes for these projects
    const likeAgg = await likesCollection.aggregate([
      { $match: { projectOwnerEmail: projectOwnerEmail, projectName: { $in: projectNames } } },
      {
        $group: {
          _id: "$projectName",
          likes: { $sum: { $cond: [{ $eq: ["$action", "like"] }, 1, 0] } },
          dislikes: { $sum: { $cond: [{ $eq: ["$action", "dislike"] }, 1, 0] } },
          userLike: {
            $max: {
              $cond: [
                { $eq: ["$likerEmail", viewerEmail] },
                 "$action",
                 null
              ]
            }
          }
        }
      }
    ]).toArray();

    // 3. Fetch ALL Comments for these projects (including replies)
    const allComments = await commentsCollection.find(
       { projectOwnerEmail: projectOwnerEmail, projectName: { $in: projectNames } },
       { sort: { timestamp: 1 } } // Sort by time
    ).toArray();

    // 4. Group comments by project name on the server side
    const commentsByProject: Record<string, any[]> = {};
    allComments.forEach(comment => {
        const projName = comment.projectName;
        if (!commentsByProject[projName]) {
            commentsByProject[projName] = [];
        }
        commentsByProject[projName].push({
            _id: comment._id.toString(), // Return _id as string
            user: comment.commenterName,
            text: comment.text,
            date: comment.timestamp, // Keep as Date object or ISO string
            parentId: comment.parentId ? comment.parentId.toString() : null, // Return parentId as string or null
        });
    });


    // 5. Combine results into the final structure
    const interactions: Record<string, {
      likes: number;
      dislikes: number;
      userLike: "like" | "dislike" | null;
      // Update comment type to include _id and parentId
      comments: { _id: string; user: string; text: string; date: string | Date; parentId: string | null }[];
    }> = {};

    // Initialize with all projects
    projectNames.forEach(name => {
        interactions[name] = { likes: 0, dislikes: 0, userLike: null, comments: [] };
    });

    // Populate with like/dislike counts and userLike status
    likeAgg.forEach(item => {
      if (interactions[item._id]) {
        interactions[item._id].likes = item.likes;
        interactions[item._id].dislikes = item.dislikes;
        interactions[item._id].userLike = (item.userLike === 'like' || item.userLike === 'dislike') ? item.userLike : null;
      }
    });

    // Populate with comments grouped by project
    Object.keys(commentsByProject).forEach(projectName => {
       if (interactions[projectName]) {
         interactions[projectName].comments = commentsByProject[projectName];
       }
    });

    return NextResponse.json(interactions);

  } catch (error) {
    console.error("Get Project Interactions API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
