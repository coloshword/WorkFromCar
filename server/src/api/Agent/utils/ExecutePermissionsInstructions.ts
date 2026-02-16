import { SYSTEM_INSTRUCTION } from "./PlanInstructions";
import { ALL_TOOLS_DESCRIPTION } from "./AgentToolSpec";
import * as z from "zod";
import { ExecutePermissionResponse } from "Types/Agent";

export const EXECUTE_PERMISSION_JSON_SCHEMA =`Schema (exact):
{
  "assistant": string,
  "executePermissionGranted": boolean,
}
For example:
{
  "assistant": "Got it, you gave permission to send the email to John. Sending email now... ",
  "executePermissionGranted": true,
}
`

const AGENT_INSTRUCTION = `
Determine if the user gave intent to execute the specified tool call based on the chat history. If they did, output JSON following the schema. If not, output JSON asking what needs to be changed.
`

export const EXECUTE_PERMISSION_JSON_SCHEMA_SCHEMA = z.object({
  assistant: z.string(),
  executePermissionGranted: z.boolean(),
}) satisfies z.ZodType<ExecutePermissionResponse>;

export const EXECUTE_PERMISSION_INSTRUCTION = `${SYSTEM_INSTRUCTION} ${AGENT_INSTRUCTION} ${EXECUTE_PERMISSION_JSON_SCHEMA}`;
