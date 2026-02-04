import { PLAN_JSON_SCHEMA_SCHEMA } from "../utils/AgentInstructions";
import { LLMPlanResponse } from "Types/Agent";

export const verifyLLMPlan = (lmResponse: string): LLMPlanResponse => {
  const lmResponseJson = JSON.parse(lmResponse);
  // verify that it is of plan type 
  const plan = PLAN_JSON_SCHEMA_SCHEMA.parse(lmResponseJson);
  return plan;
}

export const verifyLLMToolCall = async (plan: LLMPlanResponse) => {
  switch (plan.tool) {

  }
}