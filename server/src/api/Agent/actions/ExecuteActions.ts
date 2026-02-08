import { AgentTool } from "Types/Agent";
import { emailCreateDraftParametersSchema } from "../tools/EmailCreateDraft";
import { executeEmailCreateDraft } from "../tools/EmailCreateDraft";
import { ExecuteResult } from "Types/Agent";

export async function executeTool(tool: AgentTool): Promise<ExecuteResult>{
  switch (tool.tool) {
    case 'gmail.createDraft':
      const validatedParams = emailCreateDraftParametersSchema.parse(tool.toolParameters);
      return await executeEmailCreateDraft(validatedParams);
    default:
      throw new Error(`Unsupported tool: ${tool.tool}`);
  }
}
