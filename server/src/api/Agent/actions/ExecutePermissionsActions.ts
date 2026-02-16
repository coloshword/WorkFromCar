import { AgentTool } from "Types/Agent";
import { emailCreateDraftParametersSchema } from "../tools/gmail/EmailCreateDraft";
import { Message, ExecutePermissionResponse } from "Types/Agent";
import { generateJsonWithRetry } from "./PlanActions";
import { generateOpenRouterMessage } from "../utils/LMProviders";
import { EXECUTE_PERMISSION_INSTRUCTION, EXECUTE_PERMISSION_JSON_SCHEMA_SCHEMA } from "../utils/ExecutePermissionsInstructions";

export async function validateToolCall(tool: AgentTool): Promise<void>{
  switch (tool.tool) {
    case 'gmail.createDraft':
      const validatedParams = emailCreateDraftParametersSchema.parse(tool.toolParameters);
      return;
    default:
      throw new Error(`Unsupported tool: ${tool.tool}`);
  }
}

/**
 * Confirms if user gave intent to the tool call
 */
export async function checkUserIntent(Messages: Message[]): Promise<ExecutePermissionResponse> {
  const response = await generateJsonWithRetry(
    Messages,
    "openai/gpt-oss-120b",
    EXECUTE_PERMISSION_INSTRUCTION,
    generateOpenRouterMessage,
    (json) => {
      return EXECUTE_PERMISSION_JSON_SCHEMA_SCHEMA.parse(json);
    }
  );
  return response;
}
