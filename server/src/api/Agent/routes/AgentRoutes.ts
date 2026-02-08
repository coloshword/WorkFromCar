import { Context } from 'koa';
import * as z from "zod";
import { AgentPlanResponse, AgentState, Message } from "Types/Agent";
import { generateLLMPlan } from '../actions/PlanActions';

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
  const plan = await generateLLMPlan(messages);
  if (!plan.toolParameters) {
    throw new Error("Tool parameters are null");
  }
  const message: Message = {
    role: "assistant",
    content: plan.assistant,
  }
  const response: AgentPlanResponse = {
    message,
    tool: {
      tool: plan.tool,
      toolParameters: plan.toolParameters,
    }
  }
  ctx.body = response;
  ctx.status = 200;
};

export const executeToolRoute = async (ctx: Context) => {
  
}
