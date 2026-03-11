import { AgentTool, ToolExecutionLog } from "../../../types/Agent";
import { sendEmail } from "./sendEmail";
import { resolveContact } from "./resolveContact";
import { emailCreateDraftSchema } from "./toolSchemas/email";

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
      const name = tool.toolParameters?.['name'];
      if (!name) return { tool: tool.tool, status: 'error', result: { message: 'Missing name parameter' } };
      try {
        const { resolvedEmail, allMatches } = await resolveContact(name, accessToken);
        return { tool: tool.tool, status: 'success', result: { resolvedEmail, allMatches } };
      } catch (e: any) {
        console.log(`[executeTool] error: ${e.message}`);
        return { tool: tool.tool, status: 'error', result: { message: e.message } };
      }
    }
    default:
      return { tool: tool.tool, status: 'error', result: { message: `Unknown tool: ${tool.tool}` } };
  }
}
