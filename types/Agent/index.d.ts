export type Message = {
  role: string;
  content: string;
};

export type PlanState = {
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

export type ExecuteState = {
  messages: Message[];
  tool: AgentTool;
}
