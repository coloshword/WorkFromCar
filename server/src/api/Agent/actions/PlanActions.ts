import { PLAN_JSON_SCHEMA_SCHEMA } from "../utils/PlanInstructions";
import { LLMPlanResponse } from "Types/Agent";
import { emailCreateDraftParametersSchema } from "../tools/EmailCreateDraft";
import { RETRY_COUNT } from "../utils/PlanInstructions";

export const verifyLLMPlan = (lmResponseJson: object): LLMPlanResponse => {
  // first verify plan object schema 
  const plan = PLAN_JSON_SCHEMA_SCHEMA.parse(lmResponseJson);
  // then verify tool call schema
  verifyLLMToolCall(plan);
  return plan;
}

export const verifyLLMToolCall = (plan: LLMPlanResponse) => {
  switch (plan.tool) {
    case "gmail.createDraft":
      console.log(`Verify gmail.createDraft tool call`);
      plan.toolParameters = emailCreateDraftParametersSchema.parse(plan.toolParameters)
      break;
  }
}