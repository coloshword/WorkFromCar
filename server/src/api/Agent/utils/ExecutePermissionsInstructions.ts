import { SYSTEM_INSTRUCTION } from "./PlanInstructions";
import { ALL_TOOLS_DESCRIPTION } from "./AgentToolSpec";
import * as z from "zod";
import { ExecutePermissionResponse } from "Types/Agent";

export const EXECUTE_PERMISSION_JSON_SCHEMA =`Schema (exact):
{
  "assistant": string,
  "decision": "execute" | "revise" | "cancel",
}
For example:
{
  "assistant": "Got it, you gave permission to send the email to John. Sending email now... ",
  "decision": "execute",
}
`

const AGENT_INSTRUCTION = `
Determine whether the latest user message confirms executing the specified pending tool exactly as-is, requests a revision to it, or cancels it.
- Return "execute" only when the user clearly confirms running the current pending tool without changes.
- Return "revise" when the user changes any detail, adds details, asks a follow-up question, or otherwise does not clearly confirm the current tool as-is.
- Return "cancel" when the user clearly declines, cancels, or says not to proceed.
- The assistant message should briefly reflect that decision in natural language.
`

export const EXECUTE_PERMISSION_JSON_SCHEMA_SCHEMA = z.object({
  assistant: z.string(),
  decision: z.enum(['execute', 'revise', 'cancel']),
}) satisfies z.ZodType<ExecutePermissionResponse>;

export const EXECUTE_PERMISSION_INSTRUCTION = `${SYSTEM_INSTRUCTION} ${AGENT_INSTRUCTION} ${EXECUTE_PERMISSION_JSON_SCHEMA}`;
