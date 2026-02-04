import { LLMPlanResponse } from "Types/Agent";
import { TOOLS } from "./AgentToolSpec";
import * as z from "zod";

export const SYSTEM_INSTRUCTION = `
Return ONLY a raw JSON object (no markdown, no code fences).
The output MUST start with '{' and end with '}'.
Do NOT include JSON inside any string field.
`;

export const PLAN_JSON_SCHEMA =`Schema (exact):
{
  "assistant": string,
  "tool": string,
  "toolParameters": object | null,
}
For example:
{
  "assistant": "I'll help you draft an email to John... ",
  "tool": "gmail.createDraft",
  "toolParameters": {
    "to": null,
    "subject": null,
    "body": null
  }
}
`

export const PLAN_JSON_SCHEMA_SCHEMA = z.object({
  assistant: z.string(),
  tool: z.string(),
  toolParameters: z.record(z.string(), z.any())
}) satisfies z.ZodType<LLMPlanResponse>;

export const TOOL_INSTRUCTION = `
For tool use, follow the tool instructions. For tool parameters, if you don't know the parameter, set it to null and nothing else. Do not fill in with example values that weren't explicitly provided. Instead, ask the user for the parameter. If a parameter is null, ask the user for it. Keep asking until none of the parameters are null. 
${TOOLS}
Rules:
- Only set a parameter if the user explicitly provided it.
- If any required parameter is missing, ask the user for it (ask for one missing parameter at a time), then set it.
- Never invent recipients, subjects, or email body content. If not provided, leave null until the user supplies it.
`;

export const PLAN_INSTRUCTION = `${SYSTEM_INSTRUCTION} ${PLAN_JSON_SCHEMA} ${TOOL_INSTRUCTION}`;

export const PLAN_RETRY_COUNT = 3;
