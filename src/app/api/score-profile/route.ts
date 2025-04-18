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
    maxStreak?: string;
  };
  solvedStats?: {
    basic?: { count: number };
    easy?: { count: number };
    medium?: { count: number };
    hard?: { count: number };
  };
}

type Domain = "AI/ML" | "Frontend" | "Backend" | "Cloud";

interface ScoreRequestPayload {
  selectedRepos: SelectedGitHubRepo[];
  leetCodeStats: LeetCodeStats | null;
  gfgStats: GfgStats | null;
  githubUsername?: string;
  leetcodeUsername?: string;
  gfgUsername?: string;
  domain: Domain; // Add domain field
}
// --- End Interfaces ---


// Function to construct the prompt for the LLM
function constructPrompt(data: ScoreRequestPayload): string {
  let prompt = `Analyze the following developer profile data focused on the **${data.domain}** domain and provide a concise evaluation.

Developer Usernames:
- GitHub: ${data.githubUsername || 'Not provided'}
- LeetCode: ${data.leetcodeUsername || 'Not provided'}
- GeeksforGeeks: ${data.gfgUsername || 'Not provided'}

Selected GitHub Repositories (focused on ${data.domain}):\n`;

  if (data.selectedRepos.length > 0) {
    data.selectedRepos.forEach((repo, index) => {
      prompt += `${index + 1}. ${repo.name} (${repo.language || 'N/A'}): ${repo.description || 'No description'}. Stars: ${repo.stargazers_count}, Forks: ${repo.forks_count}. Topics: ${repo.topics?.join(', ') || 'None'}. Last Push: ${repo.pushed_at}\n`;
    });
  } else {
    prompt += "- None selected.\n";
  }

  prompt += "\nCompetitive Programming Stats:\n";
  if (data.leetCodeStats) {
    prompt += `- LeetCode: Solved ${data.leetCodeStats.totalSolved}/${data.leetCodeStats.totalQuestions}, Acceptance ${data.leetCodeStats.acceptanceRate?.toFixed(1)}%, Rank ${data.leetCodeStats.ranking}, Points ${data.leetCodeStats.contributionPoints}\n`;
  } else {
    prompt += "- LeetCode: Not provided or N/A.\n";
  }
  if (data.gfgStats?.info) {
    prompt += `- GeeksforGeeks: Score ${data.gfgStats.info.codingScore}, Solved ${data.gfgStats.info.totalProblemsSolved}, Streak ${data.gfgStats.info.currentStreak} (Max ${data.gfgStats.info.maxStreak})\n`;
  } else {
    prompt += "- GeeksforGeeks: Not provided or N/A.\n";
  }

  prompt += `
Instructions:
- Evaluate the profile strictly based on the provided data and its relevance to the **${data.domain}** domain.
- Consider repository activity (last push), topics, languages, stars/forks, and CP stats.
- Provide a brief summary of strengths and potential weaknesses specifically related to the **${data.domain}** domain.
- Conclude with an overall score out of 100, reflecting their proficiency and activity in the **${data.domain}** domain based *only* on the given information.

Output Format (Strict):
- Mention only the points without any descriptions.
1. Strengths (related to ${data.domain})
2. Potential Weaknesses (related to ${data.domain})
3. Overall Score: [score]/100

`;

  return prompt;
}


export async function POST(req: NextRequest) {
  try {
    const body: ScoreRequestPayload = await req.json();

    // Basic validation
    if (!body || !Array.isArray(body.selectedRepos) || !body.domain) {
      return NextResponse.json({ error: 'Invalid request body. Missing selectedRepos or domain.' }, { status: 400 });
    }
     // Validate domain
    const validDomains: Domain[] = ["AI/ML", "Frontend", "Backend", "Cloud"];
    if (!validDomains.includes(body.domain)) {
        return NextResponse.json({ error: "Invalid domain specified" }, { status: 400 });
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
