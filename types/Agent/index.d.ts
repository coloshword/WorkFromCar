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
  executePermissionGranted?: boolean;
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

/** Whether or not to execute the tool, and provide the updated message to the user  */
export type ExecutePermissionResponse = {
  assistant: string;
  executePermissionGranted: boolean;
}

export type ExecutePermissionRouteResponseBody = {
  assistant: string;
  executePermissionGranted: boolean;
  tool: AgentTool;
}
