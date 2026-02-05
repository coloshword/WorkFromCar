import { Context } from 'koa';
import * as z from "zod";
import { AgentPlanResponse, AgentState, Message } from "Types/Agent";
import { generateLLMMessage, generateOpenAIMessage, generateOpenRouterMessage } from '../utils/Gemini';
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
  //const lmResponse = await generateLLMMessage(messages, PLAN_INSTRUCTION);
  //const lmResponse = await generateOpenAIMessage(messages, 'gpt-4o-mini', PLAN_INSTRUCTION);
  //const lmResponse = await generateOpenRouterMessage(messages, 'openai/gpt-oss-120b', PLAN_INSTRUCTION);
  //const lmResponse = await generateOpenRouterMessage(messages, 'meta-llama/llama-3.1-8b-instruct', PLAN_INSTRUCTION);
  const lmResponse = await generateOpenRouterMessage(messages, 'qwen/qwen-2.5-coder-32b-instruct', PLAN_INSTRUCTION);
  console.log(lmResponse);
  const plan = verifyLLMPlan(lmResponse);

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
