import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Compute cosine similarity between two skill vectors
function cosineSimilarity(jobSkills: string[], devSkills: { [key: string]: number }): number {
  // Convert job skills to a vector (weight of 1 for each required skill)
  const jobVector: { [key: string]: number } = {};
  jobSkills.forEach(skill => {
    jobVector[skill.toLowerCase()] = 1;
  });
  
  // Get all unique skills
  const allSkills = [...new Set([
    ...Object.keys(jobVector),
    ...Object.keys(devSkills)
  ])];
  
  // Calculate dot product
  let dotProduct = 0;
  let jobMagnitude = 0;
  let devMagnitude = 0;
  
  allSkills.forEach(skill => {
    const jobValue = jobVector[skill] || 0;
    const devValue = devSkills[skill] || 0;
    
    dotProduct += jobValue * devValue;
    jobMagnitude += jobValue * jobValue;
    devMagnitude += devValue * devValue;
  });
  
  jobMagnitude = Math.sqrt(jobMagnitude);
  devMagnitude = Math.sqrt(devMagnitude);
  
  // Avoid division by zero
  if (jobMagnitude === 0 || devMagnitude === 0) return 0;
  
  // Return cosine similarity as a percentage
  return (dotProduct / (jobMagnitude * devMagnitude)) * 100;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url!);
    const jobId = url.searchParams.get("jobId");
    
    if (!jobId) {
      return new Response(JSON.stringify({ error: "jobId is required" }), { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db();
    
    // Get the job
    const job = await db.collection("jobs").findOne({ _id: new ObjectId(jobId) });
    
    if (!job) {
      return new Response(JSON.stringify({ error: "Job not found" }), { status: 404 });
    }
    
    // Get all developer profiles
    const developers = await db.collection("profiles").find({}).toArray();
    
    // Extract skills from GitHub data and generate simple skill vectors
    // In a full implementation, this would use more sophisticated analysis from GitHub/LeetCode data
    const matchedDevelopers = developers.map(dev => {
      // Construct a simple skill vector - in a real app this would be more sophisticated
      const skills: { [key: string]: number } = {};
      
      // Add explicitly mentioned skills
      if (Array.isArray(dev.skills)) {
        dev.skills.forEach((skill: string) => {
          skills[skill.toLowerCase()] = 80; // Assume high proficiency for listed skills
        });
      }
      
      // Extract skills from GitHub repos (simulated)
      if (dev.githubData) {
        // In a real app, we'd analyze the language distribution of the user's repos
        // For this MVP, we'll randomly assign skills based on the GitHub username
        const githubUsername = dev.github?.toLowerCase() || '';
        
        if (githubUsername.includes('py') || githubUsername.length % 5 === 0) {
          skills['python'] = skills['python'] ? skills['python'] + 20 : 70;
        }
        if (githubUsername.includes('js') || githubUsername.length % 3 === 0) {
          skills['javascript'] = skills['javascript'] ? skills['javascript'] + 20 : 75;
        }
        if (githubUsername.includes('web') || githubUsername.length % 2 === 0) {
          skills['react'] = skills['react'] ? skills['react'] + 15 : 60;
          skills['html'] = skills['html'] ? skills['html'] + 15 : 80;
          skills['css'] = skills['css'] ? skills['css'] + 15 : 75;
        }
      }
      
      // Calculate match score using cosine similarity
      const matchScore = cosineSimilarity(job.skills, skills);
      
      // Return developer with match info
      return {
        wallet: dev.wallet,
        github: dev.github,
        githubData: dev.githubData,
        skills,
        matchScore
      };
    });
    
    // Sort developers by match score (highest first)
    const sortedDevelopers = matchedDevelopers
      .filter(dev => dev.matchScore > 0) // Only include those with some match
      .sort((a, b) => b.matchScore - a.matchScore);
    
    return new Response(JSON.stringify(sortedDevelopers));
  } catch (err) {
    console.error("Matching API error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}