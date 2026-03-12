import { AgentTool, ResolvedContact, ToolExecutionLog } from "../../../types/Agent";
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
        const contactResult = await resolveContact(name, accessToken);
        if (contactResult.status === 'resolved') {
          return { tool: tool.tool, status: 'success', result: contactResult };
        }
        // 'ambiguous' or 'no_match' — surface suggestions so the assistant can ask the user
        return {
          tool: tool.tool,
          status: 'error',
          result: {
            message:
              contactResult.status === 'ambiguous'
                ? `Could not confidently resolve "${name}". Did you mean one of these? ${contactResult.suggestions.map((s: ResolvedContact) => `${s.name} (${s.email})`).join(', ')}`
                : `No contact found for "${name}".${contactResult.suggestions.length > 0 ? ` Closest matches: ${contactResult.suggestions.map((s: ResolvedContact) => `${s.name} (${s.email})`).join(', ')}` : ''}`,
            contactResult,
          },
        };
      } catch (e: any) {
        console.log(`[executeTool] error: ${e.message}`);
        return { tool: tool.tool, status: 'error', result: { message: e.message } };
      }
    }
    default:
      return { tool: tool.tool, status: 'error', result: { message: `Unknown tool: ${tool.tool}` } };
  }
}
