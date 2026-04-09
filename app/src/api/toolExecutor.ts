import { AgentTool, ToolExecutionLog } from "../../../types/Agent";
import { readEmail } from "./readEmail";
import { resolveContact } from "./resolveContact";
import { sendEmail } from "./sendEmail";
import { replyEmail } from "./replyEmail";
import { forwardEmail } from "./forwardEmail";
import { summarizeEmails } from "./summarizeEmails";
import { emailCreateDraftSchema, resolveContactParametersSchema, emailSummarizeParametersSchema, readEmailParametersSchema, emailReplyParametersSchema, emailForwardParametersSchema } from "./toolSchemas/email";
import { gcalCreateEventSchema, gcalDeleteEventSchema, gcalGetEventsSchema, gcalRespondToEventSchema, gcalUpdateEventSchema } from "./toolSchemas/gcal";
import { createEvent } from "./gcalCreateEvent";
import { deleteEvent } from "./gcalDeleteEvent";
import { getEvents } from "./gcalGetEvents";
import { respondToEvent } from "./gcalRespondToEvent";
import { updateEvent } from "./gcalUpdateEvent";

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
    case 'gcal.createEvent': {
      try {
        const params = gcalCreateEventSchema.parse(tool.toolParameters);
        const result = await createEvent({ ...params, accessToken });
        return { tool: tool.tool, status: 'success', result };
      } catch (e: any) {
        console.error('[executeTool] gcal.createEvent failed', {
          toolParameters: tool.toolParameters,
          message: e?.message,
        });
        return { tool: tool.tool, status: 'error', result: { message: e.message } };
      }
    }
    case 'gcal.getEvents': {
      try {
        const params = gcalGetEventsSchema.parse(tool.toolParameters);
        const result = await getEvents({ ...params, accessToken });
        return { tool: tool.tool, status: 'success', result };
      } catch (e: any) {
        console.error('[executeTool] gcal.getEvents failed', {
          toolParameters: tool.toolParameters,
          message: e?.message,
        });
        return { tool: tool.tool, status: 'error', result: { message: e.message } };
      }
    }
    case 'gcal.respondToEvent': {
      try {
        const params = gcalRespondToEventSchema.parse(tool.toolParameters);
        const result = await respondToEvent({
          accessToken,
          eventId: params.eventId,
          responseStatus: params.responseStatus,
        });
        return { tool: tool.tool, status: 'success', result };
      } catch (e: any) {
        console.error('[executeTool] gcal.respondToEvent failed', {
          toolParameters: tool.toolParameters,
          message: e?.message,
        });
        return { tool: tool.tool, status: 'error', result: { message: e.message } };
      }
    }
    case 'gcal.updateEvent': {
      try {
        const params = gcalUpdateEventSchema.parse(tool.toolParameters);
        const result = await updateEvent({
          accessToken,
          eventId: params.eventId,
          newSummary: params.newSummary,
          startIso: params.startIso,
          endIso: params.endIso,
          timeZone: params.timeZone,
          newLocation: params.newLocation,
          newDescription: params.newDescription,
          attendees: params.attendees,
        });
        return { tool: tool.tool, status: 'success', result };
      } catch (e: any) {
        console.error('[executeTool] gcal.updateEvent failed', {
          toolParameters: tool.toolParameters,
          message: e?.message,
        });
        return { tool: tool.tool, status: 'error', result: { message: e.message } };
      }
    }
    case 'gcal.deleteEvent': {
      try {
        const params = gcalDeleteEventSchema.parse(tool.toolParameters);
        const result = await deleteEvent({
          accessToken,
          eventId: params.eventId,
        });
        return { tool: tool.tool, status: 'success', result };
      } catch (e: any) {
        console.error('[executeTool] gcal.deleteEvent failed', {
          toolParameters: tool.toolParameters,
          message: e?.message,
        });
        return { tool: tool.tool, status: 'error', result: { message: e.message } };
      }
    }
    default:
      return { tool: tool.tool, status: 'error', result: { message: `Unknown tool: ${tool.tool}` } };
  }
}
