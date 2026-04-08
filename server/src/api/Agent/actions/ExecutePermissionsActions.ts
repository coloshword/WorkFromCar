import { AgentTool, ToolExecutionLog } from "Types/Agent";
import { emailCreateDraftParametersSchema } from "../tools/gmail/EmailCreateDraft";
import { Message, ExecutePermissionResponse } from "Types/Agent";
import { generateJsonWithRetry } from "./PlanActions";
import { generateLLMMessage, generateOpenRouterMessage } from "../utils/LMProviders";
import { EXECUTE_PERMISSION_INSTRUCTION, EXECUTE_PERMISSION_JSON_SCHEMA_SCHEMA } from "../utils/ExecutePermissionsInstructions";
import { SUMMARY_INSTRUCTION, SUMMARY_JSON_SCHEMA_SCHEMA } from "../utils/SummaryInstructions";
import { emailReplyParametersSchema } from "../tools/gmail/EmailReply";
import { emailForwardParametersSchema } from "../tools/gmail/EmailForward";
import { gcalCreateEventParametersSchema } from "../tools/gcal/GcalCreateEvent";
import { gcalRespondToEventExecutableParametersSchema } from "../tools/gcal/GcalRespondToEvent";
import { gcalUpdateEventExecutableParametersSchema } from "../tools/gcal/GcalUpdateEvent";

export async function validateToolCall(tool: AgentTool): Promise<void>{
  switch (tool.tool) {
    case 'gmail.createDraft':
      emailCreateDraftParametersSchema.parse(tool.toolParameters);
      return;
    case 'gmail.replyToEmail':
      emailReplyParametersSchema.parse(tool.toolParameters);
      return;
    case 'gmail.forwardEmail':
      emailForwardParametersSchema.parse(tool.toolParameters);
      return;
    case 'gcal.createEvent':
      gcalCreateEventParametersSchema.parse(tool.toolParameters);
      return;
    case 'gcal.respondToEvent':
      gcalRespondToEventExecutableParametersSchema.parse(tool.toolParameters);
      return;
    case 'gcal.updateEvent':
      gcalUpdateEventExecutableParametersSchema.parse(tool.toolParameters);
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

/**
 * Narrates the outcome of a tool execution in natural language
 */
export async function summarizeToolResult(
  messages: Message[],
  toolLog: ToolExecutionLog,
): Promise<{ assistant: string }> {
  const augmented = [
    ...messages,
    { role: 'user', content: `Tool result: ${JSON.stringify(toolLog)}` }
  ];
  return generateJsonWithRetry(
    augmented,
    "gemini-3.1-flash-lite-preview",
    SUMMARY_INSTRUCTION,
    generateLLMMessage,
    (json) => SUMMARY_JSON_SCHEMA_SCHEMA.parse(json)
  );
}
