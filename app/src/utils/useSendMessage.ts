import { AgentTool, Message, AgentPlanResponse, ExecutePermissionRouteResponseBody, SummarizeRouteResponseBody, ToolExecutionLog } from '../../../types/Agent';
import { authFetch } from './fetchUtils';

export async function sendAgentMessage(
  messages: Message[],
  pendingTool: AgentTool | null,
  contextTool?: AgentTool | null
): Promise<AgentPlanResponse> {
  const endpoint = pendingTool ? '/api/agent/executePermission' : '/api/agent/plan';
  const body = pendingTool
    ? { messages, tool: pendingTool }
    : { messages, ...(contextTool ? { contextTool } : {}) };

  const response = await authFetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.log(errorText);
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();

  if (pendingTool) {
    const result: ExecutePermissionRouteResponseBody = data;
    return {
      message: { role: 'assistant', content: result.assistant },
      tool: result.tool,
      executePermissionGranted: result.executePermissionGranted,
      executeDecision: result.decision,
    };
  } else {
    const result: AgentPlanResponse = data;
    return result;
  }
}

export async function callSummarize(
  messages: Message[],
  toolLog: ToolExecutionLog,
): Promise<SummarizeRouteResponseBody> {
  const response = await authFetch('/api/agent/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, toolLog }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return response.json();
}
