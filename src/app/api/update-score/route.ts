import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from 'next/server';

type Domain = "AI/ML" | "Frontend" | "Backend" | "Cloud";

interface UpdateScorePayload {
  email: string;
  domain: Domain;
  score: number;
  repos: string[]; // Array of repository URLs
}

export async function POST(req: NextRequest) {
  try {
    const { email, domain, score, repos }: UpdateScorePayload = await req.json();

    if (!email || !domain || score === undefined || score === null || !Array.isArray(repos)) {
      return NextResponse.json({ error: "Missing required fields: email, domain, score, repos" }, { status: 400 });
    }

    // Validate domain
    const validDomains: Domain[] = ["AI/ML", "Frontend", "Backend", "Cloud"];
    if (!validDomains.includes(domain)) {
        return NextResponse.json({ error: "Invalid domain specified" }, { status: 400 });
    }

    // Validate score
    if (typeof score !== 'number' || score < 0 || score > 100) {
        return NextResponse.json({ error: "Invalid score value. Must be between 0 and 100." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const profilesCollection = db.collection("profiles");

    // Use dot notation to update a specific field within the 'scores' object
    const updateField = `scores.${domain}`; // e.g., scores.AI/ML, scores.Frontend

    const result = await profilesCollection.updateOne(
      { email },
      {
        $set: {
          [updateField]: { // Dynamically set the field based on the domain
            score: Math.round(score), // Store score as integer
            repos: repos,
            lastUpdated: new Date(),
          }
        }
      },
      { upsert: false } // Don't create a profile if it doesn't exist, just update
    );

    if (result.matchedCount === 0) {
        return NextResponse.json({ error: "Profile not found for the given email" }, { status: 404 });
    }

    if (result.modifiedCount === 0 && result.matchedCount === 1) {
        // This might happen if the data being set is identical to existing data
        console.log(`Score update for ${email} - ${domain}: No changes detected.`);
    }

    return NextResponse.json({ success: true, message: `Score for ${domain} updated successfully.` });

  } catch (err) {
    console.error("Update Score API error:", err);
    const message = err instanceof Error ? err.message : "An unknown error occurred";
    return NextResponse.json({ error: "Server error during score update.", details: message }, { status: 500 });
  }
}
