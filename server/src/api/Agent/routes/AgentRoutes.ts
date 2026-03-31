import { Context } from 'koa';
import * as z from "zod";
import { AgentPlanResponse, PlanState, Message, SummarizeRouteRequestBody, ToolExecutionLog } from "Types/Agent";
import { generateLLMPlan } from '../actions/PlanActions';
import { checkUserIntent, validateToolCall, summarizeToolResult } from '../actions/ExecutePermissionsActions';
import { isSilent } from '../utils/isSilent';

const toolLogSchema = z.object({
  tool: z.string(),
  status: z.enum(['success', 'error']),
  result: z.record(z.string(), z.any()),
});

const resolveContactSuccessSchema = z.object({
  status: z.literal('resolved'),
  resolvedEmail: z.string(),
  reason: z.string().optional(),
});

const parseToolLogMessage = (message?: Message) => {
  if (!message || message.role !== 'system') {
    return null;
  }

  try {
    const parsed = JSON.parse(message.content);
    const result = toolLogSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
};

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
  const lastToolLog = parseToolLogMessage(lastMessage);
  const resolvedContactResult = lastToolLog?.tool === 'gmail.resolveContact' && lastToolLog.status === 'success'
    ? resolveContactSuccessSchema.safeParse(lastToolLog.result)
    : null;
  const postResolveContactInstruction = resolvedContactResult?.success
    ? {
        role: "system",
        content: `The previous silent tool gmail.resolveContact succeeded and already chose the verified email address ${resolvedContactResult.data.resolvedEmail}. Continue the user's original task immediately. If the user is drafting a new email, emit gmail.createDraft now with "to" set to that email and any still-missing fields left null. Do not return tool: null only because subject or body is still missing. Treat suggestions as informational only because the resolve status is already "resolved".`
      }
    : null;
  const planningMessages = contextTool
    ? [
        ...messages.slice(0, -1),
        {
          role: "system",
          content: `Pending tool awaiting confirmation: ${JSON.stringify(contextTool)}. The latest user message asked to revise this pending tool. Revise the existing tool call instead of treating it as permission to execute the old one.`
        },
        ...(lastMessage ? [lastMessage] : []),
      ]
    : [
        ...messages,
        ...(postResolveContactInstruction ? [postResolveContactInstruction] : []),
      ];
  if (resolvedContactResult?.success) {
    console.log('[planRoute] replanning after resolved contact', {
      resolvedEmail: resolvedContactResult.data.resolvedEmail,
      reason: resolvedContactResult.data.reason,
    });
  }
  const plan = await generateLLMPlan(planningMessages);
  if (resolvedContactResult?.success) {
    console.log('[planRoute] post-resolveContact plan', {
      assistant: plan.assistant,
      tool: plan.tool,
      toolParameters: plan.toolParameters,
    });
  }
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
  ctx.body = summary;
  ctx.status = 200;
}
