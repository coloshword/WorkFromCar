import { SYSTEM_INSTRUCTION } from "./PlanInstructions";
import * as z from "zod";

export const SUMMARY_INSTRUCTION = `${SYSTEM_INSTRUCTION}
The user just executed a tool and here is the result. Summarize what happened in one short, natural spoken sentence.
Return ONLY JSON following this schema: { "assistant": string }`;

export const SUMMARY_JSON_SCHEMA_SCHEMA = z.object({
  assistant: z.string(),
});
