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
  "assistant": "I'll help you draft an email to John",
  "tool": "gmail.createDraft",
  "toolParameters": {
    "to": "john@example.com",
    "subject": "Follow up",
    "body": "Hi John..."
  }
}
`

export const PLAN_JSON_SCHEMA_SCHEMA = z.object({
  assistant: z.string(),
  tool: z.string(),
  toolParameters: z.record(z.string(), z.any())
});

export const TOOL_INSTRUCTION = `
For the tool section you can choose from the following tools. If you don't know the parameter, set it to null. Do NOT set a parameter unless you know it definitively. No example emails for example unless they're provided. If you don't know, set it to null:
1. "gmail.createDraft"
When you decide to use this tool, output JSON with:
- assistantMessage (string)
- tool: "gmail.createDraft"
- toolParameters:
  - to: string | null
  - subject: string | null
  - body: string | null

Rules:
- Only set a parameter if the user explicitly provided it.
- If any required parameter is missing, ask the user for it (ask for one missing parameter at a time), then set it.
- Never invent recipients, subjects, or email body content. If not provided, leave null until the user supplies it.
`;

export const PLAN_INSTRUCTION = `${SYSTEM_INSTRUCTION} ${PLAN_JSON_SCHEMA} ${TOOL_INSTRUCTION}`;

export const PLAN_RETRY_COUNT = 3;
