import { Context } from 'koa';
import * as z from "zod";
import { AgentState, Message } from "Types/Agent";
import { generateLLMMessage } from '../Gemini';
import { PLAN_INSTRUCTION, PLAN_JSON_SCHEMA_SCHEMA, PLAN_RETRY_COUNT } from '../AgentInstructions';

const planRouteSchema = z.object({
  messages: z.array(
    z.object({
      role: z.string(),
      content: z.string(),
    })
  )
}) satisfies z.ZodType<AgentState>;

function parseModelJson(raw: string) {
  // remove ```json ... ``` if present
  const cleaned = raw
    .trim()
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "");

  return JSON.parse(cleaned);
}

export const planRoute = async (ctx: Context) => {
  console.log(ctx.request.body);
  if (!ctx.request.body) {
    ctx.status = 400;
    ctx.body = { error: "Request body is missing" };
    return;
  }
  const { messages } = planRouteSchema.parse(ctx.request.body);
  let lastError: unknown;
  for (let i = 0; i < PLAN_RETRY_COUNT; i++) {
    try{
      const raw = await generateLLMMessage(messages, PLAN_INSTRUCTION);
      // zod parse 
      const maybeObj =
        typeof raw === "string" ? parseModelJson(raw) : raw;
      const validated = PLAN_JSON_SCHEMA_SCHEMA.parse(maybeObj);
      const message: Message = {
        role: "model",
        content: validated.assistantMessage,
      };
      ctx.body = {
        message: message,
        tool: validated.tool,
      }
      ctx.status = 200;
      return;
    } catch (error) {
      lastError = error;
    }
  }

  ctx.status = 502;
  ctx.body = {
    error: "Failed to generate plan",
    details: String(lastError),
  }
};
