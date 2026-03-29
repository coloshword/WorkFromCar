import { AgentTool } from '../../../types/Agent';

function hasRequiredParameters(tool: AgentTool, requiredParameters: string[]): boolean {
  const params = tool.toolParameters as Record<string, unknown> | null;

  if (!params) {
    return false;
  }

  return requiredParameters.every((parameter) => params[parameter] !== null && params[parameter] !== undefined);
}

export function isToolReadyForExecution(tool: AgentTool | null | undefined): boolean {
  if (!tool || tool.silent) {
    return false;
  }

  switch (tool.tool) {
    case 'gmail.createDraft':
      return hasRequiredParameters(tool, ['to', 'subject', 'body']);
    case 'gmail.replyToEmail':
      return hasRequiredParameters(tool, ['to', 'subject', 'body', 'messageId', 'threadId']);
    case 'gmail.forwardEmail':
      return hasRequiredParameters(tool, ['messageId', 'to']);
    case 'gcal.createEvent':
      return hasRequiredParameters(tool, ['summary', 'startIso', 'endIso', 'timeZone']);
    default:
      return false;
  }
}
