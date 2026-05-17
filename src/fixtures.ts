import type { AgentSession, AgentStreamEvent } from './index.js';

const baseAt = Date.UTC(2026, 0, 1, 0, 0, 0);

export const persistedTwoMessageTurnFixture: AgentStreamEvent[] = [
  {
    type: 'thread_started',
    threadId: 'thread_persisted_1',
    sessionId: 'session_persisted_1',
    at: baseAt,
  },
  {
    type: 'turn_started',
    threadId: 'thread_persisted_1',
    turnId: 'turn_persisted_1',
    at: baseAt + 1,
  },
  {
    type: 'user_message',
    threadId: 'thread_persisted_1',
    turnId: 'turn_persisted_1',
    messageId: 'message_user_1',
    text: 'Summarize this repository.',
    at: baseAt + 2,
  },
  {
    type: 'assistant_message',
    threadId: 'thread_persisted_1',
    turnId: 'turn_persisted_1',
    messageId: 'message_assistant_1',
    text: 'This repository defines shared protocol types for agent workbench apps.',
    partial: false,
    at: baseAt + 3,
  },
  {
    type: 'usage',
    threadId: 'thread_persisted_1',
    turnId: 'turn_persisted_1',
    usage: {
      inputTokens: 84,
      cachedInputTokens: 12,
      outputTokens: 19,
    },
    at: baseAt + 4,
  },
  {
    type: 'turn_completed',
    threadId: 'thread_persisted_1',
    turnId: 'turn_persisted_1',
    usage: {
      inputTokens: 84,
      cachedInputTokens: 12,
      outputTokens: 19,
    },
    at: baseAt + 5,
  },
];

export const liveStreamingPartialAssistantMessageFixture: AgentStreamEvent[] = [
  {
    type: 'thread_started',
    threadId: 'thread_live_1',
    sessionId: 'session_live_1',
    at: baseAt,
  },
  {
    type: 'turn_started',
    threadId: 'thread_live_1',
    turnId: 'turn_live_1',
    at: baseAt + 1,
  },
  {
    type: 'assistant_message',
    threadId: 'thread_live_1',
    turnId: 'turn_live_1',
    messageId: 'message_stream_1',
    text: 'I will inspect',
    delta: 'I will inspect',
    partial: true,
    at: baseAt + 2,
  },
  {
    type: 'assistant_message',
    threadId: 'thread_live_1',
    turnId: 'turn_live_1',
    messageId: 'message_stream_1',
    text: 'I will inspect the files first.',
    delta: ' the files first.',
    partial: true,
    at: baseAt + 3,
  },
];

export const runCommandExecFixture: AgentStreamEvent[] = [
  {
    type: 'turn_started',
    turnId: 'turn_exec_1',
    at: baseAt,
  },
  {
    type: 'exec_begin',
    turnId: 'turn_exec_1',
    callId: 'call_exec_1',
    command: 'pnpm test',
    cwd: '/workspace/project',
    at: baseAt + 1,
  },
  {
    type: 'exec_end',
    turnId: 'turn_exec_1',
    callId: 'call_exec_1',
    exitCode: 0,
    stdout: '2 tests passed',
    stderr: '',
    durationMs: 1240,
    at: baseAt + 2,
  },
];

export const genericFunctionCallFixture: AgentStreamEvent[] = [
  {
    type: 'turn_started',
    turnId: 'turn_function_1',
    at: baseAt,
  },
  {
    type: 'function_call',
    turnId: 'turn_function_1',
    callId: 'call_function_1',
    name: 'search_docs',
    args: { query: 'AgentStreamEvent' },
    at: baseAt + 1,
  },
  {
    type: 'tool_result',
    turnId: 'turn_function_1',
    callId: 'call_function_1',
    name: 'search_docs',
    ok: true,
    output: [{ title: 'Protocol PRD', path: 'docs/PRD.md' }],
    at: baseAt + 2,
  },
];

export const approvalRequestFixture: AgentStreamEvent[] = [
  {
    type: 'turn_started',
    turnId: 'turn_approval_1',
    at: baseAt,
  },
  {
    type: 'approval_requested',
    turnId: 'turn_approval_1',
    approvalId: 'approval_1',
    callId: 'call_exec_approval_1',
    reason: 'Command writes outside the workspace.',
    payload: {
      command: 'touch /tmp/protocol-check',
    },
    at: baseAt + 1,
  },
  {
    type: 'approval_resolved',
    turnId: 'turn_approval_1',
    approvalId: 'approval_1',
    status: 'approved',
    resolvedBy: 'user',
    at: baseAt + 2,
  },
];

export const failedTurnFixture: AgentStreamEvent[] = [
  {
    type: 'thread_started',
    threadId: 'thread_failed_1',
    sessionId: 'session_failed_1',
    at: baseAt,
  },
  {
    type: 'turn_started',
    threadId: 'thread_failed_1',
    turnId: 'turn_failed_1',
    at: baseAt + 1,
  },
  {
    type: 'error',
    threadId: 'thread_failed_1',
    turnId: 'turn_failed_1',
    error: {
      message: 'codex exit 1',
      code: 'PROCESS_EXIT',
      recoverable: false,
    },
    at: baseAt + 2,
  },
  {
    type: 'turn_failed',
    threadId: 'thread_failed_1',
    turnId: 'turn_failed_1',
    error: {
      message: 'codex exit 1',
      code: 'PROCESS_EXIT',
      recoverable: false,
    },
    at: baseAt + 3,
  },
];

export const fixtureSession: AgentSession = {
  id: 'session_persisted_1',
  threadId: 'thread_persisted_1',
  title: 'Protocol fixture session',
  status: 'active',
  createdAt: baseAt,
  updatedAt: baseAt + 5,
  turns: [
    {
      id: 'turn_persisted_1',
      sessionId: 'session_persisted_1',
      threadId: 'thread_persisted_1',
      status: 'completed',
      startedAt: baseAt + 1,
      completedAt: baseAt + 5,
      usage: {
        inputTokens: 84,
        cachedInputTokens: 12,
        outputTokens: 19,
      },
      messages: [
        {
          id: 'message_user_1',
          role: 'user',
          text: 'Summarize this repository.',
          createdAt: baseAt + 2,
          turnId: 'turn_persisted_1',
        },
        {
          id: 'message_assistant_1',
          role: 'assistant',
          text: 'This repository defines shared protocol types for agent workbench apps.',
          createdAt: baseAt + 3,
          turnId: 'turn_persisted_1',
          partial: false,
        },
      ],
    },
  ],
};

export const allFixtures: Record<string, AgentStreamEvent[]> = {
  persistedTwoMessageTurn: persistedTwoMessageTurnFixture,
  liveStreamingPartialAssistantMessage: liveStreamingPartialAssistantMessageFixture,
  runCommandExec: runCommandExecFixture,
  genericFunctionCall: genericFunctionCallFixture,
  approvalRequest: approvalRequestFixture,
  failedTurn: failedTurnFixture,
};
