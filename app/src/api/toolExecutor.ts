import { AgentTool, ToolExecutionLog } from "../../../types/Agent";
import { resolveContact } from "./resolveContact";
import { sendEmail } from "./sendEmail";
import { emailCreateDraftSchema, resolveContactParametersSchema } from "./toolSchemas/email";

export async function executeTool(tool: AgentTool, accessToken: string): Promise<ToolExecutionLog> {
  switch (tool.tool) {
    case 'gmail.createDraft': {
      const params = emailCreateDraftSchema.parse(tool.toolParameters);
      try {
        const result = await sendEmail({ ...params, accessToken });
        return { tool: tool.tool, status: 'success', result };
      } catch (e: any) {
        return { tool: tool.tool, status: 'error', result: { message: e.message } };
      }
    }
    case 'gmail.resolveContact': {
      const params = resolveContactParametersSchema.parse(tool.toolParameters);
      try {
        const result = await resolveContact(params.value, accessToken);
        return { tool: tool.tool, status: 'success', result };
      } catch (e: any) {
        return { tool: tool.tool, status: 'error', result: { message: e.message } };
      }
    }
    default:
      return { tool: tool.tool, status: 'error', result: { message: `Unknown tool: ${tool.tool}` } };
  }
}
