import { LLMPlanResponse } from "Types/Agent";
import { ALL_TOOLS_DESCRIPTION } from "./AgentToolSpec";
import * as z from "zod";

export const SYSTEM_INSTRUCTION = `
Return ONLY a raw JSON object (no markdown, no code fences).
The output MUST start with '{' and end with '}'.
Do NOT include JSON inside any string field.
`;

export const PLAN_JSON_SCHEMA =`Schema (exact):
{
  "assistant": string,
  "tool": string | null,
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
  tool: z.string().nullable(),
  toolParameters: z.record(z.string(), z.any()).nullable()
}) satisfies z.ZodType<LLMPlanResponse>;

export const TOOL_INSTRUCTION = `
For tool use, follow the tool instructions. For tool parameters, if you don't know the parameter, set it to null and nothing else. Do not fill in with example values that weren't explicitly provided. Instead, ask the user for any required parameter. If a required parameter is null, ask the user for it. Keep asking until all required parameters are provided. Optional parameters may remain null when the tool instructions allow it.
${ALL_TOOLS_DESCRIPTION}
Rules:
- Only set a parameter if the user explicitly provided it or if it was resolved by a prior tool result (e.g. resolvedEmail from gmail.resolveContact).
- If a prior silent tool resolved a value needed by a downstream tool, continue with that downstream tool immediately in the same response.
- Do not drop to tool: null after a successful silent tool if the downstream tool allows null placeholders for still-missing fields. Return the downstream tool with the resolved parameter filled in and any remaining missing fields set to null, while asking the user for the next missing field.
- If gmail.resolveContact returns status "resolved", treat resolvedEmail as the chosen email address for downstream planning even if the result also includes suggestions or a reason like "multiple_close_matches".
- If any required parameter is missing, ask the user for it (ask for one missing parameter at a time), then set it.
- Never invent recipients, subjects, or email body content. If not provided, leave null until the user supplies it.
- Once you have all required parameters, in the assistant message, you must ask them for confirmation to execute the tool.
`;

export const PLAN_INSTRUCTION = `${SYSTEM_INSTRUCTION} ${PLAN_JSON_SCHEMA} ${TOOL_INSTRUCTION}`;

export const RETRY_COUNT = 3;
