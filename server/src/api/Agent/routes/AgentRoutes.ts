import { Context } from 'koa';
import * as z from "zod";
import { AgentPlanResponse, AgentState, Message } from "Types/Agent";
import { generateLLMMessage, generateOpenAIMessage, generateOpenRouterMessage, JSONRetryPolicyGenerate } from '../utils/Gemini';
import { PLAN_INSTRUCTION, PLAN_JSON_SCHEMA_SCHEMA, PLAN_RETRY_COUNT } from '../utils/AgentInstructions';
import { verifyLLMPlan } from '../actions/PlanActions';

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
  const lmResponseJson = await JSONRetryPolicyGenerate(messages, 'openai/gpt-oss-120b', PLAN_INSTRUCTION, generateOpenRouterMessage);
  const plan = verifyLLMPlan(lmResponseJson);

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
