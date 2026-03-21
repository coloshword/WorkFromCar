import { AgentTool, ToolExecutionLog } from "../../../types/Agent";
import { readEmail } from "./readEmail";
import { resolveContact } from "./resolveContact";
import { sendEmail } from "./sendEmail";
import { replyEmail } from "./replyEmail";
import { forwardEmail } from "./forwardEmail";
import { summarizeEmails } from "./summarizeEmails";
import { emailCreateDraftSchema, resolveContactParametersSchema, emailSummarizeParametersSchema, readEmailParametersSchema, emailReplyParametersSchema, emailForwardParametersSchema } from "./toolSchemas/email";

export async function executeTool(tool: AgentTool, accessToken: string): Promise<ToolExecutionLog> {
  switch (tool.tool) {
    case 'gmail.createDraft': {
      try {
        const params = emailCreateDraftSchema.parse(tool.toolParameters);
        const result = await sendEmail({ ...params, accessToken });
        return { tool: tool.tool, status: 'success', result };
      } catch (e: any) {
        return { tool: tool.tool, status: 'error', result: { message: e.message } };
      }
    }
    case 'gmail.resolveContact': {
      try {
        const params = resolveContactParametersSchema.parse(tool.toolParameters);
        const result = await resolveContact(params.value, accessToken);
        return { tool: tool.tool, status: 'success', result };
      } catch (e: any) {
        return { tool: tool.tool, status: 'error', result: { message: e.message } };
      }
    }
    case 'gmail.summarizeEmails': {
      try {
        const params = emailSummarizeParametersSchema.parse(tool.toolParameters);
        const result = await summarizeEmails(accessToken, params.query, params.maxResults);
        return { tool: tool.tool, status: 'success', result };
      } catch (e: any) {
        return { tool: tool.tool, status: 'error', result: { message: e.message } };
      }
    }
    case 'gmail.readEmail': {
      try {
        const params = readEmailParametersSchema.parse(tool.toolParameters);
        const result = await readEmail({ token: accessToken, emailId: params.messageId });
        console.log(result);
        return { tool: tool.tool, status: 'success', result };
      } catch (e: any) {
        return { tool: tool.tool, status: 'error', result: { message: e.message } };
      }
    }
    case 'gmail.replyToEmail': {
      try {
        const params = emailReplyParametersSchema.parse(tool.toolParameters);
        const result = await replyEmail({ ...params, accessToken });
        return { tool: tool.tool, status: 'success', result };
      } catch (e: any) {
        return { tool: tool.tool, status: 'error', result: { message: e.message } };
      }
    }
    case 'gmail.forwardEmail': {
      try {
        const params = emailForwardParametersSchema.parse(tool.toolParameters);
        const result = await forwardEmail({ ...params, accessToken });
        return { tool: tool.tool, status: 'success', result };
      } catch (e: any) {
        return { tool: tool.tool, status: 'error', result: { message: e.message } };
      }
    }
    default:
      return { tool: tool.tool, status: 'error', result: { message: `Unknown tool: ${tool.tool}` } };
  }
}
