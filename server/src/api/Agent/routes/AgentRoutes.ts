import { Context } from 'koa';
import * as z from "zod";
import { AgentState } from "Types/Agent";
import { generateAssistantMessage } from '../Gemini';
import { PLAN_INSTRUCTION } from '../AgentInstructions';

const planRouteSchema = z.object({
  messages: z.array(
    z.object({
      role: z.string(),
      content: z.string(),
    })
  )
}) satisfies z.ZodType<AgentState>;

export const planRoute = async (ctx: Context) => {
  const { messages } = planRouteSchema.parse(ctx.request.body);
  const systemInstruction = PLAN_INSTRUCTION;
  console.log(systemInstruction);
  const assistantMessage = await generateAssistantMessage(messages, systemInstruction);
  ctx.body = {
    assistantMessage,
  };
  ctx.status = 200;
};
