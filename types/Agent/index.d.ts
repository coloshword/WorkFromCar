export type Message = {
  role: string;
  content: string;
};

export type AgentState = {
  messages: Message[];
};

export type AgentResponse = {
  message: Message;
  tool: string;
};
