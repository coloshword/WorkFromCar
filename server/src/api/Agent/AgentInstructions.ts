import * as z from "zod";

export const SYSTEM_INSTRUCTION = `
Return ONLY a raw JSON object (no markdown, no code fences).
The output MUST start with '{' and end with '}'.
Do NOT include JSON inside any string field.

`;

export const PLAN_JSON_SCHEMA =`Schema (exact):
{
  "assistantMessage": string,
  "tool": string,
}
For example:
{
  "assistantMessage": "I'll help you draft an email to John",
  "tool": "gmail.createDraft"
}
`

export const PLAN_JSON_SCHEMA_SCHEMA = z.object({
  assistantMessage: z.string(),
  tool: z.string(),
});

export const TOOL_INSTRUCTION = `
For the tool section you can choose from the following tools: 
  - gmail.createDraft
`;

export const PLAN_INSTRUCTION = `${SYSTEM_INSTRUCTION} ${PLAN_JSON_SCHEMA} ${TOOL_INSTRUCTION}`;

export const PLAN_RETRY_COUNT = 3;
