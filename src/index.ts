export type AgentId = string;
export type AgentThreadId = string;
export type AgentSessionId = string;
export type AgentTurnId = string;
export type AgentMessageId = string;
export type AgentToolCallId = string;
export type AgentApprovalId = string;
export type AgentAttachmentId = string;

export type AgentRole = 'system' | 'user' | 'assistant' | 'tool';
export type AgentTurnStatus = 'pending' | 'running' | 'completed' | 'failed' | 'aborted';
export type AgentStreamStatus = 'connecting' | 'streaming' | 'reconnecting' | 'idle' | 'done';
export type AgentApprovalStatus = 'requested' | 'approved' | 'rejected' | 'expired' | 'cancelled';
export type AgentFileOperation = 'add' | 'change' | 'unlink';

export interface AgentModelMetadata {
  provider?: string;
  model?: string;
  displayName?: string;
  accountLabel?: string;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens?: number;
  reasoningOutputTokens?: number;
  totalTokens?: number;
}

export interface AgentError {
  message: string;
  code?: string;
  recoverable?: boolean;
  cause?: unknown;
}

export interface WorkspaceFileRef {
  path: string;
  workspaceId?: string;
  uri?: string;
  name?: string;
  mimeType?: string;
  sizeBytes?: number;
  line?: number;
  startLine?: number;
  endLine?: number;
  operation?: AgentFileOperation;
}

export interface Attachment {
  id: AgentAttachmentId;
  kind: 'file' | 'image' | 'audio' | 'video' | 'text' | 'url' | 'workspace_file' | 'other';
  name?: string;
  mimeType?: string;
  sizeBytes?: number;
  url?: string;
  file?: WorkspaceFileRef;
  data?: unknown;
}

export interface AgentToolCall {
  id: AgentToolCallId;
  name: string;
  kind?: 'function' | 'tool' | 'exec' | 'approval' | 'file' | 'other';
  args?: unknown;
  startedAt?: number;
  completedAt?: number;
  status?: 'pending' | 'running' | 'completed' | 'failed';
  result?: unknown;
  error?: AgentError;
}

export interface AgentMessage {
  id: AgentMessageId;
  role: AgentRole;
  text?: string;
  content?: unknown;
  createdAt: number;
  turnId?: AgentTurnId;
  partial?: boolean;
  attachments?: Attachment[];
  toolCalls?: AgentToolCall[];
  usage?: TokenUsage;
  metadata?: Record<string, unknown>;
}

export interface AgentTurn {
  id: AgentTurnId;
  sessionId?: AgentSessionId;
  threadId?: AgentThreadId;
  status: AgentTurnStatus;
  startedAt: number;
  completedAt?: number;
  model?: AgentModelMetadata;
  messages?: AgentMessage[];
  toolCalls?: AgentToolCall[];
  usage?: TokenUsage;
  error?: AgentError;
  metadata?: Record<string, unknown>;
}

export interface AgentSession {
  id: AgentSessionId;
  threadId?: AgentThreadId;
  title?: string;
  status?: 'active' | 'archived' | 'deleted';
  workspacePath?: string;
  createdAt: number;
  updatedAt?: number;
  model?: AgentModelMetadata;
  turns?: AgentTurn[];
  metadata?: Record<string, unknown>;
}

export interface AgentStreamEventBase {
  type: string;
  at: number;
  sessionId?: AgentSessionId;
  threadId?: AgentThreadId;
  turnId?: AgentTurnId;
  seq?: number;
}

export interface ThreadStartedEvent extends AgentStreamEventBase {
  type: 'thread_started';
  threadId: AgentThreadId;
  sessionId?: AgentSessionId;
  title?: string;
  model?: AgentModelMetadata;
}

export interface TurnStartedEvent extends AgentStreamEventBase {
  type: 'turn_started';
  turnId: AgentTurnId;
  input?: AgentMessage;
  model?: AgentModelMetadata;
}

export interface UserMessageEvent extends AgentStreamEventBase {
  type: 'user_message';
  turnId: AgentTurnId;
  messageId: AgentMessageId;
  text: string;
  attachments?: Attachment[];
}

export interface AssistantMessageEvent extends AgentStreamEventBase {
  type: 'assistant_message';
  turnId: AgentTurnId;
  messageId: AgentMessageId;
  text: string;
  partial?: boolean;
  delta?: string;
  attachments?: Attachment[];
  usage?: TokenUsage;
}

export interface ReasoningEvent extends AgentStreamEventBase {
  type: 'reasoning';
  turnId: AgentTurnId;
  itemId?: string;
  text?: string;
  delta?: string;
  partial?: boolean;
  summary?: string;
}

export interface FunctionCallEvent extends AgentStreamEventBase {
  type: 'function_call';
  turnId: AgentTurnId;
  callId: AgentToolCallId;
  name: string;
  args?: unknown;
}

export interface ToolCallEvent extends AgentStreamEventBase {
  type: 'tool_call';
  turnId: AgentTurnId;
  callId: AgentToolCallId;
  name: string;
  args?: unknown;
  toolType?: string;
}

export interface ToolResultEvent extends AgentStreamEventBase {
  type: 'tool_result';
  turnId: AgentTurnId;
  callId: AgentToolCallId;
  name?: string;
  ok: boolean;
  output?: unknown;
  error?: AgentError | string;
}

export interface ExecBeginEvent extends AgentStreamEventBase {
  type: 'exec_begin';
  turnId: AgentTurnId;
  callId: AgentToolCallId;
  command: string;
  cwd?: string;
  env?: Record<string, string>;
}

export interface ExecEndEvent extends AgentStreamEventBase {
  type: 'exec_end';
  turnId: AgentTurnId;
  callId: AgentToolCallId;
  exitCode: number | null;
  signal?: string | null;
  stdout?: string;
  stderr?: string;
  durationMs?: number;
}

export interface ApprovalRequestedEvent extends AgentStreamEventBase {
  type: 'approval_requested';
  turnId: AgentTurnId;
  approvalId: AgentApprovalId;
  reason: string;
  payload?: unknown;
  callId?: AgentToolCallId;
}

export interface ApprovalResolvedEvent extends AgentStreamEventBase {
  type: 'approval_resolved';
  turnId: AgentTurnId;
  approvalId: AgentApprovalId;
  status: Exclude<AgentApprovalStatus, 'requested'>;
  resolvedBy?: string;
  message?: string;
}

export interface AttachmentEvent extends AgentStreamEventBase {
  type: 'attachment';
  turnId?: AgentTurnId;
  messageId?: AgentMessageId;
  attachment: Attachment;
}

export interface FileReferenceEvent extends AgentStreamEventBase {
  type: 'file_reference';
  turnId?: AgentTurnId;
  messageId?: AgentMessageId;
  file: WorkspaceFileRef;
}

export interface UsageEvent extends AgentStreamEventBase {
  type: 'usage';
  turnId: AgentTurnId;
  usage: TokenUsage;
  model?: AgentModelMetadata;
}

export interface StatusEvent extends AgentStreamEventBase {
  type: 'status';
  status: AgentStreamStatus;
  message?: string;
}

export interface ErrorEvent extends AgentStreamEventBase {
  type: 'error';
  error: AgentError;
}

export interface RawEvent extends AgentStreamEventBase {
  type: 'raw';
  source?: string;
  payload: unknown;
}

export interface TurnCompletedEvent extends AgentStreamEventBase {
  type: 'turn_completed';
  turnId: AgentTurnId;
  usage?: TokenUsage;
}

export interface TurnFailedEvent extends AgentStreamEventBase {
  type: 'turn_failed';
  turnId: AgentTurnId;
  error: AgentError;
  usage?: TokenUsage;
}

export interface TurnAbortedEvent extends AgentStreamEventBase {
  type: 'turn_aborted';
  turnId: AgentTurnId;
  reason?: string;
  usage?: TokenUsage;
}

export type AgentMessageEvent = UserMessageEvent | AssistantMessageEvent | ReasoningEvent;
export type AgentToolEvent = FunctionCallEvent | ToolCallEvent | ToolResultEvent;
export type AgentApprovalEvent = ApprovalRequestedEvent | ApprovalResolvedEvent;
export type AgentExecEvent = ExecBeginEvent | ExecEndEvent;
export type TerminalTurnEvent = TurnCompletedEvent | TurnFailedEvent | TurnAbortedEvent;

export type AgentStreamEvent =
  | ThreadStartedEvent
  | TurnStartedEvent
  | UserMessageEvent
  | AssistantMessageEvent
  | ReasoningEvent
  | FunctionCallEvent
  | ToolCallEvent
  | ToolResultEvent
  | ExecBeginEvent
  | ExecEndEvent
  | ApprovalRequestedEvent
  | ApprovalResolvedEvent
  | AttachmentEvent
  | FileReferenceEvent
  | UsageEvent
  | StatusEvent
  | ErrorEvent
  | RawEvent
  | TurnCompletedEvent
  | TurnFailedEvent
  | TurnAbortedEvent;

export function isTerminalTurnEvent(event: AgentStreamEvent): event is TerminalTurnEvent {
  return event.type === 'turn_completed' || event.type === 'turn_failed' || event.type === 'turn_aborted';
}

export function isMessageEvent(event: AgentStreamEvent): event is AgentMessageEvent {
  return event.type === 'user_message' || event.type === 'assistant_message' || event.type === 'reasoning';
}

export function isToolEvent(event: AgentStreamEvent): event is AgentToolEvent {
  return event.type === 'function_call' || event.type === 'tool_call' || event.type === 'tool_result';
}

export function isApprovalEvent(event: AgentStreamEvent): event is AgentApprovalEvent {
  return event.type === 'approval_requested' || event.type === 'approval_resolved';
}

export function isExecEvent(event: AgentStreamEvent): event is AgentExecEvent {
  return event.type === 'exec_begin' || event.type === 'exec_end';
}

export type AgentStreamEventValidationIssueCode =
  | 'missing_turn_started'
  | 'event_before_turn_started'
  | 'event_after_terminal_turn'
  | 'duplicate_terminal_turn'
  | 'duplicate_turn_started';

export interface AgentStreamEventValidationIssue {
  code: AgentStreamEventValidationIssueCode;
  message: string;
  index: number;
  event: AgentStreamEvent;
  turnId?: AgentTurnId;
  firstIndex?: number;
}

export interface AgentStreamEventValidationResult {
  ok: boolean;
  issues: AgentStreamEventValidationIssue[];
}

function getEventTypeSortRank(event: AgentStreamEvent): number {
  switch (event.type) {
    case 'thread_started':
      return 0;
    case 'turn_started':
      return 1;
    case 'user_message':
      return 2;
    case 'assistant_message':
    case 'reasoning':
      return 3;
    case 'function_call':
    case 'tool_call':
    case 'exec_begin':
    case 'approval_requested':
      return 4;
    case 'tool_result':
    case 'exec_end':
    case 'approval_resolved':
      return 5;
    case 'attachment':
    case 'file_reference':
    case 'usage':
    case 'status':
    case 'error':
    case 'raw':
      return 6;
    case 'turn_completed':
    case 'turn_failed':
    case 'turn_aborted':
      return 7;
  }
}

export function sortAgentStreamEvents(events: readonly AgentStreamEvent[]): AgentStreamEvent[] {
  const useSequenceOrdering = events.every((event) => event.seq !== undefined);

  return events
    .map((event, index) => ({ event, index }))
    .sort((left, right) => {
      if (useSequenceOrdering && left.event.seq !== right.event.seq) {
        return left.event.seq! - right.event.seq!;
      }

      if (left.event.at !== right.event.at) {
        return left.event.at - right.event.at;
      }

      const rankDelta = getEventTypeSortRank(left.event) - getEventTypeSortRank(right.event);
      if (rankDelta !== 0) {
        return rankDelta;
      }

      return left.index - right.index;
    })
    .map(({ event }) => event);
}

export function validateAgentStreamEvents(
  events: readonly AgentStreamEvent[],
): AgentStreamEventValidationResult {
  const issues: AgentStreamEventValidationIssue[] = [];
  const turnStartedIndexes = new Map<AgentTurnId, number>();
  const terminalIndexes = new Map<AgentTurnId, number>();

  events.forEach((event, index) => {
    if (event.type !== 'turn_started') {
      return;
    }

    const startedIndex = turnStartedIndexes.get(event.turnId);
    if (startedIndex !== undefined) {
      issues.push({
        code: 'duplicate_turn_started',
        message: `Turn ${event.turnId} has more than one turn_started event.`,
        index,
        event,
        turnId: event.turnId,
        firstIndex: startedIndex,
      });
    } else {
      turnStartedIndexes.set(event.turnId, index);
    }
  });

  events.forEach((event, index) => {
    if (event.turnId === undefined || event.type === 'turn_started') {
      return;
    }

    const startedIndex = turnStartedIndexes.get(event.turnId);
    const terminalIndex = terminalIndexes.get(event.turnId);

    if (startedIndex === undefined) {
      issues.push({
        code: 'missing_turn_started',
        message: `Turn ${event.turnId} has no turn_started event before its ${event.type} event.`,
        index,
        event,
        turnId: event.turnId,
      });
    } else if (index < startedIndex) {
      issues.push({
        code: 'event_before_turn_started',
        message: `Turn ${event.turnId} has a ${event.type} event before its turn_started event.`,
        index,
        event,
        turnId: event.turnId,
        firstIndex: startedIndex,
      });
    }

    if (isTerminalTurnEvent(event)) {
      if (terminalIndex !== undefined) {
        issues.push({
          code: 'duplicate_terminal_turn',
          message: `Turn ${event.turnId} has more than one terminal turn event.`,
          index,
          event,
          turnId: event.turnId,
          firstIndex: terminalIndex,
        });
      } else {
        terminalIndexes.set(event.turnId, index);
      }
    } else if (terminalIndex !== undefined) {
      issues.push({
        code: 'event_after_terminal_turn',
        message: `Turn ${event.turnId} has a ${event.type} event after a terminal turn event.`,
        index,
        event,
        turnId: event.turnId,
        firstIndex: terminalIndex,
      });
    }
  });

  return {
    ok: issues.length === 0,
    issues,
  };
}

export * from './fixtures.js';
