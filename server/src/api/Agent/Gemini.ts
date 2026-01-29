import { GoogleGenAI } from '@google/genai';
import { GEMINI_API_KEY } from '../Utils';
import { Message } from 'Types/Agent';

if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not defined");
const gemini = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
});

export async function generateLLMMessage(
  messages: Message[], 
  systemInstruction?: string
): Promise<string> {
  // Transform messages to Google GenAI format
  const contents = messages.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.content }]
  }));

  const response = await gemini.models.generateContent({
    model: "gemini-2.5-flash",
    contents,
    config: {
      systemInstruction: systemInstruction || "You are a helpful assistant.",
    }
  });
  return response?.text ?? "";
}
