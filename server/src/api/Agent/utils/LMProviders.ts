import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import { GEMINI_API_KEY, OPENAI_API_KEY, OPEN_ROUTER_API_KEY } from '../../Utils';
import { Message } from 'Types/Agent';

if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not defined");
const gemini = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
});

if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not defined");
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

if (!OPEN_ROUTER_API_KEY) throw new Error("OPEN_ROUTER_API_KEY is not defined");
const openrouter = new OpenAI({
  apiKey: OPEN_ROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

export async function generateLLMMessage(
  messages: Message[], 
  systemInstruction: string
): Promise<string> {
  // Transform messages to Google GenAI format
  const contents = messages.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.content }]
  }));

  const response = await gemini.models.generateContent({
    model: "gemini-3-flash-preview",
    contents,
    config: {
      systemInstruction: systemInstruction || "You are a helpful assistant.",
    }
  });
  return response?.text ?? "";
}

export async function generateOpenAIMessage(
  messages: Message[],
  model: string,
  systemInstruction: string
): Promise<string> {
  // Prepare messages array with optional system instruction
  const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  
  if (systemInstruction) {
    openaiMessages.push({
      role: "system",
      content: systemInstruction
    });
  }
  
  // Add user/assistant messages
  openaiMessages.push(...messages.map(msg => ({
    role: msg.role as "user" | "assistant" | "system",
    content: msg.content
  })));

  const completion = await openai.chat.completions.create({
    model,
    messages: openaiMessages,
  });

  return completion.choices[0]?.message?.content ?? "";
}

export async function generateOpenRouterMessage(
  messages: Message[],
  model: string,
  systemInstruction: string
): Promise<string> {
  // Prepare messages array with optional system instruction
  const openrouterMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  
  if (systemInstruction) {
    openrouterMessages.push({
      role: "system",
      content: systemInstruction
    });
  }
  
  // Add user/assistant messages
  openrouterMessages.push(...messages.map(msg => ({
    role: msg.role as "user" | "assistant" | "system",
    content: msg.content
  })));

  const completion = await openrouter.chat.completions.create({
    model,
    messages: openrouterMessages,
  });

  return completion.choices[0]?.message?.content ?? "";
}
