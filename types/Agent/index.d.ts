export type Message = {
  role: string;
  content: string;
}

export type LMState = {
  messages: Message[];
}
