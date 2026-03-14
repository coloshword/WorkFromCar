import { Context } from 'koa';
import * as z from "zod";
import { AgentPlanResponse, PlanState, Message, SummarizeRouteRequestBody, ToolExecutionLog } from "Types/Agent";
import { generateLLMPlan, shouldBeSilent } from '../actions/PlanActions';
import { checkUserIntent, validateToolCall, summarizeToolResult } from '../actions/ExecutePermissionsActions';
import { isSilent } from '../utils/isSilent';

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
      silent: shouldBeSilent(plan.tool),
    }
  }
  if (isSilent(response.tool)) {
    response.tool.silent = true;
  }
  // append silent if the tool is supplementary
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
    toolParameters: z.record(z.string(), z.any()).nullable(),
    silent: z.boolean().nullable(),
  })
});

/**
 * Purpose of this route is to 1) validate tool call parameters
 * 2) Check user intent 
 */
export const executePermissionRoute = async (ctx: Context) => {
  const { messages, tool } = executeToolRouteSchema.parse(ctx.request.body);
  console.log("START OF PERMISSION ROUTE", messages);
  await validateToolCall(tool);
  const userIntent = await checkUserIntent(messages);
  ctx.body = {
    ...userIntent,
    tool,
  }
  ctx.status = 200;
}

const summarizeRouteSchema = z.object({
  messages: z.array(
    z.object({
      role: z.string(),
      content: z.string(),
    })
  ),
  toolLog: z.object({
    tool: z.string(),
    status: z.enum(['success', 'error']),
    result: z.record(z.string(), z.any()),
  })
}) satisfies z.ZodType<SummarizeRouteRequestBody>;

export const summarizeRoute = async (ctx: Context) => {
  const { messages, toolLog } = summarizeRouteSchema.parse(ctx.request.body);
  const summary = await summarizeToolResult(messages, toolLog as ToolExecutionLog);
  ctx.body = summary;
  ctx.status = 200;
}
