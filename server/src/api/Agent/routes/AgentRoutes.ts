import { Context } from 'koa';
import * as z from "zod";
import { AgentPlanResponse, PlanState, Message, SummarizeRouteRequestBody, ToolExecutionLog } from "Types/Agent";
import { generateLLMPlan } from '../actions/PlanActions';
import { checkUserIntent, validateToolCall, summarizeToolResult } from '../actions/ExecutePermissionsActions';
import { isSilent } from '../utils/isSilent';
import infra from '../..';

const planRouteSchema = z.object({
  messages: z.array(
    z.object({
      role: z.string(),
      content: z.string(),
    })
  ),
  contextTool: z.object({
    tool: z.string(),
    toolParameters: z.record(z.string(), z.any()).nullable()
  }).optional()
}) satisfies z.ZodType<PlanState>;

export const planRoute = async (ctx: Context) => {
  const { messages, contextTool } = planRouteSchema.parse(ctx.request.body);
  const lastMessage = messages[messages.length - 1];
  const planningMessages = contextTool
    ? [
        ...messages.slice(0, -1),
        {
          role: "system",
          content: `Pending tool awaiting confirmation: ${JSON.stringify(contextTool)}. The latest user message asked to revise this pending tool. Revise the existing tool call instead of treating it as permission to execute the old one.`
        },
        ...(lastMessage ? [lastMessage] : []),
      ]
    : messages;
  const plan = await generateLLMPlan(planningMessages);
  const message: Message = {
    role: "assistant",
    content: plan.assistant,
  }
  const response: AgentPlanResponse = {
    message,
    tool: {
      tool: plan.tool ?? '',
      toolParameters: plan.toolParameters,
    }
  }
  if (isSilent(response.tool)) {
    response.tool.silent = true;
  }
  // append silent if the tool is supplementary
  void infra.db.events.logEvent("plan_call", ctx.state.auth?.accountId ?? null, {
    tool: response.tool.tool,
    silent: response.tool.silent ?? false,
    messageCount: messages.length,
  });
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
  void infra.db.events.logEvent("execute_permission", ctx.state.auth?.accountId ?? null, {
    tool: tool.tool,
    decision: userIntent.decision,
    granted: userIntent.decision === 'execute',
  });
  ctx.body = {
    ...userIntent,
    executePermissionGranted: userIntent.decision === 'execute',
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
  void infra.db.events.logEvent("summarize", ctx.state.auth?.accountId ?? null, {
    tool: toolLog.tool,
    status: toolLog.status,
  });
  ctx.body = summary;
  ctx.status = 200;
}
