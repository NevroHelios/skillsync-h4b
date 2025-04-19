import Groq from "groq-sdk";
import { NextRequest, NextResponse } from 'next/server';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// --- Interfaces matching frontend ---
interface SelectedGitHubRepo {
  name: string;
  description: string | null;
  language: string | null;
  languages: Record<string, number>;
  topics: string[];
  stargazers_count: number;
  forks_count: number;
  pushed_at: string;
  created_at: string;
}

interface LeetCodeStats {
  status: string;
  message?: string;
  totalSolved?: number;
  totalQuestions?: number;
  easySolved?: number;
  totalEasy?: number;
  mediumSolved?: number;
  totalMedium?: number;
  hardSolved?: number;
  totalHard?: number;
  acceptanceRate?: number;
  ranking?: number;
  contributionPoints?: number;
  reputation?: number;
}

interface GfgStats {
  info?: {
    codingScore?: number;
    monthlyScore?: number;
    totalProblemsSolved?: number;
    currentStreak?: string;
    maxStreak?: string;
  };
  solvedStats?: {
    basic?: { count: number };
    easy?: { count: number };
    medium?: { count: number };
    hard?: { count: number };
  };
}

type Domain = "AI/ML" | "Frontend" | "Backend" | "Cloud" | "DSA"; // Add DSA

interface ScoreRequestPayload {
  selectedRepos: SelectedGitHubRepo[]; // Keep this, but understand it might contain *all* repos for profile page use case
  leetCodeStats: LeetCodeStats | null;
  gfgStats: GfgStats | null;
  githubUsername?: string;
  leetcodeUsername?: string;
  gfgUsername?: string;
  domain: Domain;
  scoringType: "Domain" | "General"; // Add scoringType
}
// --- End Interfaces ---


// Function to construct the prompt for the LLM
function constructPrompt(data: ScoreRequestPayload): string {
  const targetDomain = data.domain;
  const analysisType = data.scoringType === "General" ? "General Analysis" : `Domain Analysis for ${targetDomain}`;

  let prompt = `Perform a **${analysisType}** based on the following developer profile data.
Focus primarily on the developer's GitHub activity and competitive programming stats (if provided).

Developer Usernames:
- GitHub: ${data.githubUsername || 'Not provided'}
- LeetCode: ${data.leetcodeUsername || 'Not provided'}
- GeeksforGeeks: ${data.gfgUsername || 'Not provided'}

GitHub Repositories:\n`;

  if (data.selectedRepos.length > 0) {
    // List all provided repos, indicate if it's for domain-specific analysis
    prompt += `Analyzing ${data.selectedRepos.length} repositories${data.scoringType === 'Domain' ? ` with a focus on **${targetDomain}** relevance` : ''}:\n`;
    data.selectedRepos.forEach((repo, index) => {
      prompt += `${index + 1}. ${repo.name} (${repo.language || 'N/A'}): ${repo.description || 'No description'}. Stars: ${repo.stargazers_count}, Forks: ${repo.forks_count}. Topics: ${repo.topics?.join(', ') || 'None'}. Last Push: ${repo.pushed_at}\n`;
    });
  } else {
    prompt += "No specific repositories provided for analysis.\n";
  }

  prompt += "\nCompetitive Programming Stats:\n";
  if (data.leetCodeStats && data.leetCodeStats.status === 'success') {
    prompt += `- LeetCode: ${data.leetCodeStats.totalSolved || 0} solved (${data.leetCodeStats.easySolved || 0}E/${data.leetCodeStats.mediumSolved || 0}M/${data.leetCodeStats.hardSolved || 0}H). Acceptance: ${data.leetCodeStats.acceptanceRate?.toFixed(1) || 'N/A'}%. Rank: ${data.leetCodeStats.ranking || 'N/A'}.\n`;
  } else {
    prompt += "- LeetCode: Stats not available or failed to fetch.\n";
  }
  if (data.gfgStats && data.gfgStats.info) {
     prompt += `- GeeksforGeeks: ${data.gfgStats.info.totalProblemsSolved || 0} solved. Score: ${data.gfgStats.info.codingScore || 0}.\n`;
  } else {
    prompt += "- GeeksforGeeks: Stats not available or failed to fetch.\n";
  }

  prompt += `\nInstructions:
1.  Evaluate the developer's proficiency, focusing on the **${targetDomain}** domain${data.scoringType === 'General' ? ' and general software engineering skills' : ''}.
2.  Consider the relevance, complexity, and activity of the GitHub repositories provided. Look for evidence of ${targetDomain} skills, patterns, and best practices. For "DSA", look for algorithm implementations, data structure usage, contest solutions, etc., across repos AND consider CP stats heavily.
3.  Factor in LeetCode/GFG performance as indicators of problem-solving ability, especially relevant for "DSA" and "Backend".
4.  Provide a concise analysis (2-3 paragraphs) summarizing strengths and potential areas for improvement related to ${targetDomain}${data.scoringType === 'General' ? ' and overall profile' : ''}.
5.  Conclude with an overall score reflecting their estimated proficiency **specifically in the ${targetDomain} domain** on a scale of 0-100. Format the score clearly as: "Overall Score: [score]/100". Base the score primarily on demonstrated skills and experience shown in the provided data relevant to the target domain.
`;

  return prompt;
}


export async function POST(req: NextRequest) {
  try {
    const body: ScoreRequestPayload = await req.json();

    // Basic validation
    if (!body || !Array.isArray(body.selectedRepos) || !body.scoringType) {
      return NextResponse.json({ error: 'Invalid request body. Missing selectedRepos or scoringType.' }, { status: 400 });
    }
    // Domain is required only if scoringType is 'Domain'
    if (body.scoringType === 'Domain' && !body.domain) {
        return NextResponse.json({ error: 'Domain is required for Domain scoring type.' }, { status: 400 });
    }

     // Validate domain if provided
    if (body.domain) {
        const validDomains: Domain[] = ["AI/ML", "Frontend", "Backend", "Cloud", "DSA"]; // Add DSA
        if (!validDomains.includes(body.domain)) {
            return NextResponse.json({ error: "Invalid domain specified" }, { status: 400 });
        }
    }

    const prompt = constructPrompt(body);

    const stream = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert technical profiler evaluating developer skills based on provided data for a specific domain.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "gemma2-9b-it", // Or your preferred model
      temperature: 0.3,
      max_tokens: 500,
      stream: true,
    });

    // Create a streaming response
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            controller.enqueue(new TextEncoder().encode(content));
          }
        } catch (error) {
          console.error("Error during stream processing:", error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });

  } catch (error) {
    console.error("Error in score-profile API:", error);
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: "Failed to get score from AI model.", details: message }, { status: 500 });
  }
}
