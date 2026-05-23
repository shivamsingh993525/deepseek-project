import { createOpenAI } from "@ai-sdk/openai";
import { frontendTools } from "@assistant-ui/react-ai-sdk";
import { streamText } from "ai";
import { auth } from "@clerk/nextjs/server";

export const runtime = "edge";
export const maxDuration = 30;

// Configure OpenAI SDK for OpenRouter with DeepSeek
const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENAI_API_KEY,
  headers: {
    "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000", // Optional. Site URL for rankings on openrouter.ai.
    "X-Title": process.env.SITE_NAME || "DeepSeek Assistant", // Optional. Site title for rankings on openrouter.ai.
  },
});

export async function POST(req: Request) {
  // Check authentication
  const { userId } = await auth();
  
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages, system, tools } = await req.json();

  const result = streamText({
   model: openrouter("deepseek/deepseek-chat"),
    messages,
    // forward system prompt and tools from the frontend
    toolCallStreaming: true,
    system: system || `You are a helpful AI assistant. The user's ID is ${userId}.`,
    tools: {
      ...frontendTools(tools),
    },
    onError: console.log,
  });

  return result.toDataStreamResponse();
}
