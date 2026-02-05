export type Message = {
  role: string;
  content: string;
};

export type AgentState = {
  messages: Message[];
};

export type AgentPlanResponse = {
  message: Message;
  tool: AgentTool;
};

export type AgentTool = {
  tool: string;
  toolParameters: Record<string, string> | null;
}

export type LLMPlanResponse = {
  assistant: string;
  tool: string;
  toolParameters: Record<string, any> | null;
}
