import { AgentTool, Message, AgentPlanResponse, ExecutePermissionRouteResponseBody } from '../../../types/Agent';
import { authFetch } from './fetchUtils';

export async function sendAgentMessage(
  messages: Message[],
  pendingTool: AgentTool | null
): Promise<AgentPlanResponse> {
  const endpoint = pendingTool ? '/api/agent/executePermission' : '/api/agent/plan';
  const body = pendingTool
    ? { messages, tool: pendingTool }
    : { messages };

  const response = await authFetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();

  if (pendingTool) {
    const result: ExecutePermissionRouteResponseBody = data;
    return {
      message: { role: 'assistant', content: result.assistant },
      tool: result.tool,
      executePermissionGranted: result.executePermissionGranted,
    };
  } else {
    const result: AgentPlanResponse = data;
    return result;
  }
}
