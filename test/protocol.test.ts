import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  allFixtures,
  approvalRequestFixture,
  failedTurnFixture,
  genericFunctionCallFixture,
  isApprovalEvent,
  isExecEvent,
  isMessageEvent,
  isTerminalTurnEvent,
  isToolEvent,
  liveStreamingPartialAssistantMessageFixture,
  persistedTwoMessageTurnFixture,
  runCommandExecFixture,
  type AgentApprovalEvent,
  type AgentExecEvent,
  type AgentMessageEvent,
  type AgentStreamEvent,
  type AgentToolEvent,
  type TerminalTurnEvent,
} from '../src/index.js';

describe('AgentStreamEvent fixtures', () => {
  it('exports every required fixture', () => {
    expect(Object.keys(allFixtures).sort()).toEqual([
      'approvalRequest',
      'failedTurn',
      'genericFunctionCall',
      'liveStreamingPartialAssistantMessage',
      'persistedTwoMessageTurn',
      'runCommandExec',
    ]);
  });

  it('models a persisted two-message turn', () => {
    expect(persistedTwoMessageTurnFixture.map((event) => event.type)).toEqual([
      'thread_started',
      'turn_started',
      'user_message',
      'assistant_message',
      'usage',
      'turn_completed',
    ]);
    expect(isTerminalTurnEvent(persistedTwoMessageTurnFixture.at(-1)!)).toBe(true);
  });

  it('models partial assistant streaming', () => {
    const assistantEvents = liveStreamingPartialAssistantMessageFixture.filter(isMessageEvent);
    expect(assistantEvents).toHaveLength(2);
    expect(assistantEvents.every((event) => event.type === 'assistant_message' && event.partial)).toBe(true);
  });

  it('models run_command exec begin and end events', () => {
    const execEvents = runCommandExecFixture.filter(isExecEvent);
    expect(execEvents.map((event) => event.type)).toEqual(['exec_begin', 'exec_end']);
    expect(execEvents[0]).toMatchObject({ command: 'pnpm test' });
    expect(execEvents[1]).toMatchObject({ exitCode: 0 });
  });

  it('models a generic function call and result', () => {
    const toolEvents = genericFunctionCallFixture.filter(isToolEvent);
    expect(toolEvents.map((event) => event.type)).toEqual(['function_call', 'tool_result']);
  });

  it('models approval request and resolution', () => {
    const approvalEvents = approvalRequestFixture.filter(isApprovalEvent);
    expect(approvalEvents.map((event) => event.type)).toEqual([
      'approval_requested',
      'approval_resolved',
    ]);
    expect(approvalEvents[1]).toMatchObject({ status: 'approved' });
  });

  it('models a failed terminal turn', () => {
    const terminal = failedTurnFixture.find(isTerminalTurnEvent);
    expect(terminal).toMatchObject({
      type: 'turn_failed',
      error: { code: 'PROCESS_EXIT' },
    });
  });
});

describe('type guards', () => {
  it('narrow terminal turn events', () => {
    const event: AgentStreamEvent = {
      type: 'turn_aborted',
      turnId: 'turn_1',
      reason: 'stream disconnected',
      at: 1,
    };

    if (isTerminalTurnEvent(event)) {
      expectTypeOf(event).toMatchTypeOf<TerminalTurnEvent>();
      expect(event.turnId).toBe('turn_1');
    }
  });

  it('narrow message events', () => {
    const event: AgentStreamEvent = {
      type: 'user_message',
      turnId: 'turn_1',
      messageId: 'message_1',
      text: 'Hello',
      at: 1,
    };

    if (isMessageEvent(event)) {
      expectTypeOf(event).toMatchTypeOf<AgentMessageEvent>();
      expect(event.text).toBe('Hello');
    }
  });

  it('narrow tool events', () => {
    const event: AgentStreamEvent = {
      type: 'tool_call',
      turnId: 'turn_1',
      callId: 'call_1',
      name: 'read_file',
      args: { path: 'README.md' },
      at: 1,
    };

    if (isToolEvent(event)) {
      expectTypeOf(event).toMatchTypeOf<AgentToolEvent>();
      expect(event.callId).toBe('call_1');
    }
  });

  it('narrow approval events', () => {
    const event: AgentStreamEvent = {
      type: 'approval_resolved',
      turnId: 'turn_1',
      approvalId: 'approval_1',
      status: 'rejected',
      at: 1,
    };

    if (isApprovalEvent(event)) {
      expectTypeOf(event).toMatchTypeOf<AgentApprovalEvent>();
      expect(event.approvalId).toBe('approval_1');
    }
  });

  it('narrow exec events', () => {
    const event: AgentStreamEvent = {
      type: 'exec_begin',
      turnId: 'turn_1',
      callId: 'call_1',
      command: 'pnpm build',
      at: 1,
    };

    if (isExecEvent(event)) {
      expectTypeOf(event).toMatchTypeOf<AgentExecEvent>();
      expect(event.callId).toBe('call_1');
    }
  });
});
