export const SYSTEM_INSTRUCTION = `
Return ONLY a raw JSON object (no markdown, no code fences).
The output MUST start with '{' and end with '}'.
Do NOT include JSON inside any string field.

`;

export const PLAN_JSON_SCHEMA =`Schema (exact):
{
  "assistantMessage": string,              // plain English, no JSON, no code fences
  "proposedAction": {
    "tool": "gmail.createDraft",
    "args": {
      "to": string,
      "subject": string,
      "body": string
    }
  } | null
}`

export const TOOL_INSTRUCTION = `
For the tool section you can choose from the following tools: 
  - gmail.createDraft
`;

export const PLAN_INSTRUCTION = `${SYSTEM_INSTRUCTION} ${PLAN_JSON_SCHEMA} ${TOOL_INSTRUCTION}`;