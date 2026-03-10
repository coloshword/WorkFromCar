import { AgentTool } from "../../../types/Agent";
import { sendEmail } from "./sendEmail";
import { emailCreateDraftSchema } from "./toolSchemas/email";

export async function executeTool(tool: AgentTool, accessToken: string): Promise<string> {
  switch (tool.tool) {
    case 'gmail.createDraft': {
      const { to, subject, body } = emailCreateDraftSchema.parse(tool.toolParameters);
      const result = await sendEmail({ to, subject, body, accessToken });
      return JSON.stringify(result);
    }
    default:
      throw new Error(`Unknown tool: ${tool.tool}`);
  }
}
