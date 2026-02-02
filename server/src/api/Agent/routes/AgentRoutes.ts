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

export const planRoute = async (ctx: Context) => {
  const { messages } = planRouteSchema.parse(ctx.request.body);
  const lmResponse = await generateLLMMessage(messages, PLAN_INSTRUCTION);
  console.log(lmResponse);
};
