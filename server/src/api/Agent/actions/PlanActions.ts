import { PLAN_JSON_SCHEMA_SCHEMA } from "../utils/PlanInstructions";
import { LLMPlanResponse } from "Types/Agent";
import { emailCreateDraftParametersSchema } from "../tools/gmail/EmailCreateDraft";
import { emailSummarizeParametersSchema } from "../tools/gmail/EmailSummarize";
import { PLAN_INSTRUCTION, RETRY_COUNT } from "../utils/PlanInstructions";
import { Message } from "Types/Agent";
import { generateLLMMessage, generateOpenAIMessage } from "../utils/LMProviders";
import { normalizeNullStrings } from "../utils/AgentUtils";
import { jsonrepair } from "jsonrepair";

function formatZodError(err: any): string {
  if (err?.issues && Array.isArray(err.issues)) {
    return err.issues
      .slice(0, 10)
      .map((i: any) => `- ${(i.path ?? []).join(".") || "<root>"}: ${i.message}`)
      .join("\n");
  }
  return String(err?.message ?? err);
}

function buildFeedback(err: unknown): string {
  // JSON.parse failures
  if (err instanceof SyntaxError) {
    return [
      "Your last response was not valid JSON.",
      "Return ONLY valid JSON (no markdown, no extra text).",
    ].join("\n");
  }

  // Zod / validation failures (schema or toolParameters)
  return [
    "Your last response was valid JSON, but failed validation.",
    formatZodError(err as any),
    "Return ONLY corrected JSON that satisfies the schema and tool requirements.",
  ].join("\n");
}

export async function generateJsonWithRetry<T>(
  messages: Message[],
  model: string,
  systemInstruction: string,
  fn: (messages: Message[], model: string, systemInstruction: string) => Promise<string>,
  validate: (json: unknown) => T,
  retryCount = 3
): Promise<T> {
  let lastErr: unknown;

  for (let attempt = 1; attempt <= retryCount; attempt++) {
    const lmResponse = await fn(messages, model, systemInstruction);

    messages.push({ role: "assistant", content: lmResponse });

    try {
      const repaired = jsonrepair(lmResponse);
      const parsed: unknown = JSON.parse(repaired);
      return validate(parsed);
    } catch (err) {
      lastErr = err;

      messages.push({
        role: "system",
        content: buildFeedback(err),
      });

      console.log("error!");
      console.log('--------------- LM RESPONSE ---------------');
      console.log(lmResponse);
      console.log('--------------- MESSAGES ---------------');
      console.log(messages);
    }
  }

  throw new Error(
    `Failed to produce valid output after ${retryCount} attempts. Last error: ${String(
      (lastErr as any)?.message ?? lastErr
    )}`
  );
}

export const verifyLLMToolCall = (plan: LLMPlanResponse) => {
  switch (plan.tool) {
    case "gmail.createDraft":
      plan.toolParameters = emailCreateDraftParametersSchema.parse(plan.toolParameters);
      return;
    case "gmail.summarizeEmails":
      plan.toolParameters = emailSummarizeParametersSchema.parse(plan.toolParameters);
      return;
  }
};
// 6
export const generateLLMPlan = async (messages: Message[]): Promise<LLMPlanResponse> => {
  const plan = await generateJsonWithRetry(
    messages,
    "gemini-3.1-flash-lite-preview",
    PLAN_INSTRUCTION,
    generateLLMMessage,
    (json) => {
      const plan = PLAN_JSON_SCHEMA_SCHEMA.parse(json);
      verifyLLMToolCall(plan);
      return plan;
    },
    RETRY_COUNT
  );
  if (plan.toolParameters) {
    plan.toolParameters = normalizeNullStrings(plan.toolParameters);
  }
  return plan;
};
