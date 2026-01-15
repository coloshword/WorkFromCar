export type Message = {
  role: string;
  content: string;
};

export type AgentState = {
  messages: Message[];
};

export type ProposedAction = {
  tool: string;
};

export type AgentResponse = {
  assistantMessage: string;
  proposedAction: ProposedAction;
};