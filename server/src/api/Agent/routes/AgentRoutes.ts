import { Context } from 'koa';
import * as z from "zod";
import { AgentPlanResponse, PlanState, Message, ExecuteState } from "Types/Agent";
import { generateLLMPlan } from '../actions/PlanActions';
import { checkUserIntent, validateToolCall } from '../actions/ExecutePermissionsActions';

const planRouteSchema = z.object({
  messages: z.array(
    z.object({
      role: z.string(),
      content: z.string(),
    })
  )
}) satisfies z.ZodType<PlanState>;

export const planRoute = async (ctx: Context) => {
  const { messages } = planRouteSchema.parse(ctx.request.body);
  const plan = await generateLLMPlan(messages);
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

const executeToolRouteSchema = z.object({
  messages: z.array(
    z.object({
      role: z.string(),
      content: z.string(),
    })
  ),
  tool: z.object({
    tool: z.string(),
    toolParameters: z.record(z.string(), z.any()).nullable()
  })
}) satisfies z.ZodType<ExecuteState>;

/**
 * 
 * Purpose of this route is to 1) validate tool call parameters
 * 2) Check user intent 
 */
export const executePermissionRoute = async (ctx: Context) => {
  const { messages, tool } = executeToolRouteSchema.parse(ctx.request.body);
  console.log("START OF PERMISSION ROUTE", messages);
  await validateToolCall(tool);
  // check user intent 
  const userIntent = await checkUserIntent(messages);
  ctx.body = {
    ...userIntent,
    tool,
  }
  ctx.status = 200;
}
