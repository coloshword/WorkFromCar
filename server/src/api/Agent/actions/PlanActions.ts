import { PLAN_JSON_SCHEMA_SCHEMA } from "../utils/AgentInstructions";
import { LLMPlanResponse } from "Types/Agent";

export const verifyLLMPlan = (lmResponseJson: object): LLMPlanResponse => {
  const plan = PLAN_JSON_SCHEMA_SCHEMA.parse(lmResponseJson);
  return plan;
}

export const verifyLLMToolCall = async (plan: LLMPlanResponse) => {
  switch (plan.tool) {

  }
}