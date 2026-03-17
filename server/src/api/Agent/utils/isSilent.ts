import { AgentTool } from "Types/Agent";

// calls is silent if it is not a tool call
export const isSilent = (call: AgentTool) => {
  switch (call.tool) {
    case "gmail.resolveContact":
    case "gmail.summarizeEmails":
      return true;
    default:
      return false;
  }
}