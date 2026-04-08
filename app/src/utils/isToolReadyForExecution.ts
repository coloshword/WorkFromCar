import { AgentTool } from '../../../types/Agent';
import {
  emailCreateDraftSchema,
  emailForwardParametersSchema,
  emailReplyParametersSchema,
} from '../api/toolSchemas/email';
import { gcalCreateEventSchema, gcalRespondToEventSchema, gcalUpdateEventSchema } from '../api/toolSchemas/gcal';
import * as z from 'zod';

const EXECUTABLE_TOOL_SCHEMAS: Record<string, z.ZodTypeAny> = {
  'gmail.createDraft': emailCreateDraftSchema,
  'gmail.replyToEmail': emailReplyParametersSchema,
  'gmail.forwardEmail': emailForwardParametersSchema,
  'gcal.createEvent': gcalCreateEventSchema,
  'gcal.respondToEvent': gcalRespondToEventSchema,
  'gcal.updateEvent': gcalUpdateEventSchema,
};

export function isToolReadyForExecution(tool: AgentTool | null | undefined): boolean {
  if (!tool || tool.silent) {
    return false;
  }

  const schema = EXECUTABLE_TOOL_SCHEMAS[tool.tool];
  return schema ? schema.safeParse(tool.toolParameters).success : false;
}
