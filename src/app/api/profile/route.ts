import clientPromise from "@/lib/mongodb";

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
  try {
    const {
      email,
      name,
      bio,
      photo,
      linkedin,
      github,
      leetcode,
      gfg,
      certificates,
      experiences,
      projects, // This now includes skills and experience from the frontend
      cpProfiles,
      skills,
      githubRepos,
      leetCodeStats,
      gfgStats,
    } = await req.json();
    if (!email) return new Response(JSON.stringify({ error: "Email required" }), { status: 400 });
    const client = await clientPromise;

    // Save certificates as a separate collection as well as in the profile
    if (Array.isArray(certificates)) {
      const certsCollection = client.db().collection("certificates");
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
      const expCollection = client.db().collection("experiences");
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
      const projCollection = client.db().collection("projects");
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
      const cpCollection = client.db().collection("cpProfiles");
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
      const skillsCollection = client.db().collection("skills");
      await skillsCollection.updateOne(
        { email },
        { $set: { email, skills } },
        { upsert: true }
      );
    }

    // Save everything in the profile document
    const result = await client.db().collection("profiles").updateOne(
      { email },
      {
        $set: {
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
          // Ensure the projects array saved in the profile includes skills and experience
          projects: (projects || []).map(p => ({
            name: p.name,
            description: p.description,
            link: p.link,
            skills: p.skills || [], // Save skills in the profile's project array
            experience: p.experience, // Save experience in the profile's project array
          })),
          cpProfiles: cpProfiles || [],
          skills: skills || [],
          githubRepos: githubRepos || [],
          leetCodeStats: leetCodeStats || null,
          gfgStats: gfgStats || null,
        }
      },
      { upsert: true }
    );
    if (result.acknowledged !== true) {
      throw new Error("MongoDB did not acknowledge the write.");
    }
    return new Response(JSON.stringify({ success: true }));
  } catch (err) {
    console.error("MongoDB POST error:", err);
    return new Response(JSON.stringify({ error: "Database error" }), { status: 500 });
  }
}
