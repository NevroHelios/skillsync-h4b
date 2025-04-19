import Groq from "groq-sdk";
import { NextRequest, NextResponse } from 'next/server';

// Ensure GROQ_API_KEY is set in your environment variables
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

interface ProjectContext {
    name: string;
    description: string | null;
    // language?: string | null; // Could add more context if available
    // readmeContent?: string | null; // Future: Add README content here
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

HR User's Question:
"${question}"

Based *only* on the provided project name and description, please answer the HR user's question concisely. If the information isn't available in the provided details, state that clearly. Do not invent details or assume information from external sources.\`;
    
        `;
    return prompt;
}


export async function POST(req: NextRequest) {
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
          content: "You are an expert code reviewer and technical assistant helping an HR user understand a specific GitHub project based *only* on the provided name and description.",
        },
        {
          role: "user",
          content: prompt,
        },
        // TODO: Optionally include chatHistory here if implementing multi-turn conversation
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
            controller.enqueue(new TextEncoder().encode(content));
          }
        } catch (error) {
          console.error("Error during Groq stream processing:", error);
          // Try to send an error message back through the stream if possible
          try {
             controller.enqueue(new TextEncoder().encode(`\\n\\n[Error processing stream: \${error instanceof Error ? error.message : 'Unknown error'}]`));
          } catch (e) {
             // Ignore if controller is already closed
          }
          controller.error(error); // Signal stream error
        } finally {
          try {
            controller.close();
          } catch (e) {
             // Ignore if already closed
          }
        }
      },
       cancel(reason) {
         console.log('Stream cancelled:', reason);
         // Handle cancellation if needed
       }
    });

    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff', // Prevent browser from interpreting content type
      },
    });

  } catch (error) {
    console.error("Error in project chat API:", error);
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    // Return a JSON error response if stream hasn't started
    return NextResponse.json({ error: "Failed to get chat response from AI model.", details: message }, { status: 500 });
  }
}
