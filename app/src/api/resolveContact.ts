// resolves contact tool
import { resolveContactParameters } from "../../../server/src/api/Agent/tools/gmail/ResolveContact";
import { AgentTool, ToolExecutionLog } from "../../../types/Agent";

export async function resolveContact(params: resolveContactParameters): Promise<ToolExecutionLog> {
  // call the resolve contact tool
  throw new Error('Error resolving contact');
  return {
    tool: 'gmail.resolveContact',
    status: 'success',
    result: {
      email: 'aceliang2001@gmail.com'
    }
  }
}