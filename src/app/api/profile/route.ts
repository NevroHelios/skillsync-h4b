import clientPromise from "@/lib/mongodb";
import { authOptions, SessionUser } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from "next-auth";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url!);
    const email = url.searchParams.get("email");
    if (!email) return new Response(JSON.stringify({ error: "Email required" }), { status: 400 });
    const client = await clientPromise;
    const profile = await client.db().collection("profiles").findOne({ email });
    if (!profile) return new Response(JSON.stringify({ error: "Profile not found" }), { status: 404 });
    return new Response(JSON.stringify(profile));
  } catch (err) {
    console.error("MongoDB GET error:", err);
    return new Response(JSON.stringify({ error: "Database error" }), { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions as any);
  const user = (session as any)?.user as SessionUser | undefined;

  // Authentication Check
  if (!session || !user || !user.email) {
    return new Response(JSON.stringify({ error: "Unauthorized: Please sign in." }), { status: 401 });
  }

  try {
    const body = await req.json();
    const email = user.email; // Use email from session for security

    // Destructure expected fields, including wallet
    const {
      name,
      bio,
      photo,
      linkedin,
      github,
      leetcode,
      gfg,
      certificates,
      experiences,
      projects,
      cpProfiles,
      skills,
      githubRepos,
      leetCodeStats,
      gfgStats,
      wallet, // Add wallet address here
    } = body;

    // Basic validation (add more as needed)
    if (!email) return new Response(JSON.stringify({ error: "Email required" }), { status: 400 });

    const client = await clientPromise;
    const db = client.db();
    const profilesCollection = db.collection("profiles");

    // Get existing projects to compare with new projects list
    const existingProfile = await profilesCollection.findOne(
      { email },
      { projection: { projects: 1 } }
    );

    const existingProjects = existingProfile?.projects || [];
    const newProjectNames = projects ? projects.map(p => p.name) : [];
    const deletedProjects = existingProjects.filter(
      (existingProj) => !newProjectNames.includes(existingProj.name)
    );

    // Clean up likes and comments for deleted projects
    if (deletedProjects.length > 0) {
      const deletedProjectNames = deletedProjects.map(p => p.name);

      // Delete likes for deleted projects
      await db.collection("projectLikes").deleteMany({
        projectOwnerEmail: email,
        projectName: { $in: deletedProjectNames }
      });

      // Delete comments for deleted projects
      await db.collection("projectComments").deleteMany({
        projectOwnerEmail: email,
        projectName: { $in: deletedProjectNames }
      });

      // Delete projects themselves
      await db.collection("projects").deleteMany({
        userEmail: email,
        name: { $in: deletedProjectNames }
      });
    }

    // Save certificates as a separate collection as well as in the profile
    if (Array.isArray(certificates)) {
      const certsCollection = db.collection("certificates");
      for (const cert of certificates) {
        await certsCollection.updateOne(
          { title: cert.title, issuer: cert.issuer, year: cert.year, email },
          { $set: { ...cert, email } },
          { upsert: true }
        );
      }
    }

    // Save experiences as a separate collection as well as in the profile
    if (Array.isArray(experiences)) {
      const expCollection = db.collection("experiences");
      for (const exp of experiences) {
        await expCollection.updateOne(
          { company: exp.company, years: exp.years, email },
          { $set: { ...exp, email } },
          { upsert: true }
        );
      }
    }

    // Save projects as a separate collection as well as in the profile
    if (Array.isArray(projects)) {
      const projCollection = db.collection("projects");
      for (const proj of projects) {
        // Define the structure to be saved in the 'projects' collection
        const projectData = {
          userEmail: email, // Associate project with the user
          name: proj.name,
          description: proj.description,
          link: proj.link,
          skills: proj.skills || [], // Ensure skills is saved
          experience: proj.experience, // Ensure experience is saved
          // Add any other relevant project-specific fields here
        };

        // Use project name and user email as a unique identifier for upsert
        await projCollection.updateOne(
          { name: proj.name, userEmail: email },
          { $set: projectData },
          { upsert: true }
        );
      }
    }

    // Save cpProfiles as a separate collection as well as in the profile
    if (Array.isArray(cpProfiles)) {
      const cpCollection = db.collection("cpProfiles");
      for (const cp of cpProfiles) {
        await cpCollection.updateOne(
          { platform: cp.platform, handle: cp.handle, email },
          { $set: { ...cp, email } },
          { upsert: true }
        );
      }
    }

    // Save skills as a separate collection as well as in the profile
    if (Array.isArray(skills)) {
      const skillsCollection = db.collection("skills");
      await skillsCollection.updateOne(
        { email },
        { $set: { email, skills } },
        { upsert: true }
      );
    }

    // Prepare the main profile update object
    const profileUpdateData: any = {
      email,
      name,
      bio,
      photo,
      linkedin,
      github,
      leetcode,
      gfg,
      certificates: certificates || [],
      experiences: experiences || [],
      projects: (projects || []).map(p => ({
        name: p.name,
        description: p.description,
        link: p.link,
        skills: p.skills || [],
        experience: p.experience,
      })),
      cpProfiles: cpProfiles || [],
      skills: skills || [],
      githubRepos: githubRepos || [],
      leetCodeStats: leetCodeStats || null,
      gfgStats: gfgStats || null,
      wallet: wallet || null, // Include wallet address in the update
      updatedAt: new Date(), // Manually set update timestamp
    };

    // Perform the upsert operation
    const result = await profilesCollection.updateOne(
      { email },
      {
        $set: profileUpdateData,
        $setOnInsert: { createdAt: new Date() } // Set createdAt only on insert
      },
      { upsert: true }
    );

    if (result.acknowledged !== true) {
      throw new Error("MongoDB did not acknowledge the write.");
    }

    // Fetch the updated profile to return it (optional, but good practice)
    const updatedProfile = await profilesCollection.findOne({ email });

    return new Response(JSON.stringify(updatedProfile), { status: 200 }); // Return updated profile

  } catch (err) {
    console.error("MongoDB POST /api/profile error:", err);
    const errorMessage = err instanceof Error ? err.message : "Database error";
    return new Response(JSON.stringify({ error: "Database error", details: errorMessage }), { status: 500 });
  }
}
