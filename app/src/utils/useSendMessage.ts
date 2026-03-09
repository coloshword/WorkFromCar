import React from 'react';
import { ExecuteState, Message, AgentPlanResponse, ExecutePermissionRouteResponseBody } from '../../../types/Agent';
import { authFetch } from './fetchUtils';
import { speak } from './ttsUtils';

type sendMessageParams = {
  transcript: string;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  planOrExecute: 'plan' | 'execute';
  executeObj: ExecuteState;
}

export async function useSendMessage({
  transcript,
  messages,
  setMessages,
  planOrExecute,
  executeObj,
}: sendMessageParams): Promise<AgentPlanResponse | null> {
  if (!transcript.trim()) return null;
  const userMessage: Message = { role: 'user', content: transcript.trim() };
  const updatedMessages = [...messages, userMessage];
  setMessages(updatedMessages);
  console.log('useSendMessage:', updatedMessages);

  const endpoint = planOrExecute === 'execute' ? '/api/agent/executePermission' : '/api/agent/plan';
  const body = planOrExecute === 'execute'
    ? { messages: updatedMessages, tool: executeObj.tool }
    : { messages: updatedMessages };
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
  if (planOrExecute === 'execute') {
    const executePermission: ExecutePermissionRouteResponseBody = data;
    console.log('executePermission:', executePermission);
    const assistantMessage: Message = { role: 'assistant', content: executePermission.assistant };
    setMessages((prev: Message[]) => [...prev, assistantMessage]);
    return { message: assistantMessage, tool: executePermission.tool };
  } else {
    const assistantMessage: AgentPlanResponse = data;
    console.log('assistantMessage:', assistantMessage);
    console.log(executeObj);
    setMessages((prev: Message[]) => [...prev, assistantMessage.message]);
    return assistantMessage;
  }
}
