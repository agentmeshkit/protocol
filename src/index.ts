export type AgentId = string;
export type AgentTurnId = string;

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens?: number;
  reasoningOutputTokens?: number;
}

export type AgentStreamEvent =
  | { type: 'thread_started'; threadId: AgentId; at: number }
  | { type: 'turn_started'; turnId: AgentTurnId; at: number }
  | { type: 'turn_completed'; turnId: AgentTurnId; at: number; usage?: TokenUsage }
  | { type: 'turn_failed'; turnId: AgentTurnId; at: number; error: { message: string; code?: string } }
  | { type: 'turn_aborted'; turnId: AgentTurnId; at: number; reason?: string };

export function isTerminalTurnEvent(event: AgentStreamEvent): boolean {
  return event.type === 'turn_completed' || event.type === 'turn_failed' || event.type === 'turn_aborted';
}

