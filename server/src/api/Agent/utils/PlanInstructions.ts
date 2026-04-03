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
- If any required parameter is missing, ask the user for it (ask for one missing parameter at a time), then set it.
- Never invent recipients, subjects, or email body content. If not provided, leave null until the user supplies it.
- Once you have all required parameters, in the assistant message, you must ask them for confirmation to execute the tool.
- After receiving a silent tool result (e.g. gmail.resolveContact), you must return the main non-silent tool you are building (e.g. gmail.createDraft, gcal.createEvent) with its current parameters. Fill in any parameters that were resolved; leave unresolved ones as null. Never return tool as null or empty while a non-silent tool is still in progress.
- When asking the user a clarifying question (e.g. which email to use), still return the main tool with its current parameters. The tool should remain visible while you gather information.
- When calling a silent tool, the "assistant" message will be spoken aloud to the user via text-to-speech. Write a brief, natural status update that tells the user what you're about to do (e.g. "Let me look up John's contact" or "Checking your calendar for tomorrow"). Keep it to one short sentence.
`;

export const PLAN_INSTRUCTION = `${SYSTEM_INSTRUCTION} ${PLAN_JSON_SCHEMA} ${TOOL_INSTRUCTION}`;

export const RETRY_COUNT = 3;
