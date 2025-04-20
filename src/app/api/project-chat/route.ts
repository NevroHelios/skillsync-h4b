import Groq from "groq-sdk";
import { NextRequest, NextResponse } from 'next/server';

// Ensure GROQ_API_KEY is set in your environment variables
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

interface ProjectContext {
    name: string;
    description: string | null;
    link?: string;
    skills?: string[];
    experience?: string;
    repoUrl?: string;
    stars?: number;
    forks?: number;
    language?: string;
    topics?: string[];
    lastUpdate?: string;
    creation?: string;
}

interface ChatRequestPayload {
    project: ProjectContext;
    question: string;
    // chatHistory?: { role: 'user' | 'assistant'; content: string }[]; // Optional: For conversation history
}

// Function to construct the prompt for the LLM
function constructChatPrompt(project: ProjectContext, question: string): string {
    let prompt = `You are an expert code reviewer and technical assistant. You are helping an HR user understand a specific project from a developer's GitHub profile.

Project Details:
Name: ${project.name}
Description: ${project.description || 'No description provided.'}
${project.language ? `Primary Language: ${project.language}` : ''}
${project.skills?.length ? `Technologies/Skills: ${project.skills.join(', ')}` : ''}
${project.topics?.length ? `Topics: ${project.topics.join(', ')}` : ''}
${project.stars !== undefined ? `GitHub Stars: ${project.stars}` : ''}
${project.forks !== undefined ? `Forks: ${project.forks}` : ''}
${project.repoUrl ? `Repository URL: ${project.repoUrl}` : ''}
${project.creation ? `Created: ${new Date(project.creation).toLocaleDateString()}` : ''}
${project.lastUpdate ? `Last Updated: ${new Date(project.lastUpdate).toLocaleDateString()}` : ''}
${project.experience ? `Developer's Experience Note: ${project.experience}` : ''}

HR User's Question:
"${question}"

Based on the provided project details, please answer the HR user's question concisely and professionally. Focus on the available information and highlight relevant technical aspects. If certain information isn't available in the provided details, state that clearly.`;

    return prompt;
}

export async function POST(req: NextRequest) {
  // Explicit check (though Next.js routing handles this by export name)
  if (req.method !== 'POST') {
    return NextResponse.json({ error: `Method ${req.method} Not Allowed` }, { status: 405 });
  }

  try {
    // TODO: Add authentication check here to ensure only authorized users (e.g., HR) can use this.
    // const session = await getServerSession(authOptions);
    // if (!session || session.user.role !== 'hr') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const body: ChatRequestPayload = await req.json();

    // Basic validation
    if (!body || !body.project || !body.project.name || !body.question) {
      return NextResponse.json({ error: 'Invalid request body. Missing project details or question.' }, { status: 400 });
    }

    const prompt = constructChatPrompt(body.project, body.question);

    const stream = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a technical assistant helping an HR user evaluate a developer's project based on the provided details. Answer concisely and professionally, focusing only on the given information.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "gemma2-9b-it", // Or your preferred model like llama3-70b-8192
      temperature: 0.3, // Lower temperature for more factual, less creative answers
      max_tokens: 350,  // Limit response length
      stream: true,
    });

    // Create a streaming response
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) { // Only enqueue if there's content
              controller.enqueue(new TextEncoder().encode(content));
            }
          }
        } catch (error) {
          console.error("Error during Groq stream processing:", error);
          try {
             const errorMessage = `\n\n[Error processing response: ${error instanceof Error ? error.message : 'Unknown error'}]`;
             controller.enqueue(new TextEncoder().encode(errorMessage));
          } catch (e) { /* Ignore if controller is closed */ }
          controller.error(error); // Signal stream error
        } finally {
          try {
            controller.close();
          } catch (e) { /* Ignore if already closed */ }
        }
      },
       cancel(reason) {
         console.log('Stream cancelled:', reason);
       }
    });

    // Return the stream with specific headers
    return new NextResponse(readableStream, {
      status: 200, // Explicitly set status to 200 OK
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache', // Prevent caching issues
        'Connection': 'keep-alive', // Suggest keeping connection open for stream
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff',
        // Allow POST method explicitly (might help with some proxy/server configs)
        'Allow': 'POST',
      },
    });

  } catch (error) {
    console.error("Error in project chat API (POST handler):", error);
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    // Return JSON error for issues before streaming starts
    return NextResponse.json({ error: "Failed to process chat request.", details: message }, { status: 500 });
  }
}
