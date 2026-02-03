import { authFetch } from "./utils";
import { AgentState } from "Types/Agent";

export async function makePlanRequest(planBody: AgentState ) {
  console.log(planBody);
  const res = await authFetch("/api/agent/plan",
    {
      method: "POST",
      body: JSON.stringify(planBody)
    }
  );
  const body = await res.json();
  return body;
}
