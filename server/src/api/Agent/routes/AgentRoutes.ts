import { Context } from 'koa';
import * as z from "zod";
import { AgentPlanResponse, AgentState, Message } from "Types/Agent";
import { generateLLMMessage } from '../utils/Gemini';
import { PLAN_INSTRUCTION, PLAN_JSON_SCHEMA_SCHEMA, PLAN_RETRY_COUNT } from '../utils/AgentInstructions';

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
  const lmResponseJson = JSON.parse(lmResponse);
  console.log(lmResponseJson);
  // create the message
  const message: Message = {
    role: "assistant",
    content: lmResponseJson.assistant,
  }
  console.log(message);
  delete lmResponseJson.assistant;
  const response: AgentPlanResponse = {
    ...lmResponseJson,
    message
  }
  ctx.body = response;
  ctx.status = 200;
};
