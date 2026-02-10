import { Context } from 'koa';
import * as z from "zod";
import { AgentPlanResponse, PlanState, Message, ExecuteState } from "Types/Agent";
import { generateLLMPlan } from '../actions/PlanActions';
import { executeTool } from '../actions/ExecuteActions';

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

export const executeRoute = async (ctx: Context) => {
  const { messages, tool } = executeToolRouteSchema.parse(ctx.request.body);
  const result = await executeTool(tool);
  ctx.body = result;
  ctx.status = 200;
}
