export type Message = {
  role: string;
  content: string;
};

export type PlanState = {
  messages: Message[];
  contextTool?: AgentTool;
};

export type AgentPlanResponse = {
  message: Message;
  tool: AgentTool;
  executePermissionGranted?: boolean;
  executeDecision?: ExecuteDecision;
};

export type AgentTool = {
  tool: string;
  toolParameters: Record<string, string> | null;
  silent?: boolean; //TO BE ADDED IN THE NON-LLM LAYER!
}

export type LLMPlanResponse = {
  assistant: string;
  tool: string | null;
  toolParameters: Record<string, any> | null;
}

export type ExecuteState = {
  messages: Message[];
  tool: AgentTool;
}

export type ExecuteDecision = 'execute' | 'revise' | 'cancel';

/** Whether or not to execute the tool, and provide the updated message to the user  */
export type ExecutePermissionResponse = {
  assistant: string;
  decision: ExecuteDecision;
}

export type ExecutePermissionRouteResponseBody = {
  assistant: string;
  decision: ExecuteDecision;
  executePermissionGranted: boolean;
  tool: AgentTool;
}

export type ToolExecutionLog = {
  tool: string;
  status: 'success' | 'error';
  result: Record<string, any>;
}

export type SummarizeRouteRequestBody = {
  messages: Message[];
  toolLog: ToolExecutionLog;
}

export type SummarizeRouteResponseBody = {
  assistant: string;
}

export type ResolvedContact = {
  name: string;
  email: string;
};

export type ResolveContactResult = {
  status: 'resolved' | 'no_match';
  resolvedEmail?: string;
  allMatches: Array<{ name: string; email: string; score: number }>;
  suggestions: Array<{ name: string; email: string; score: number }>;
  reason: string;
};
