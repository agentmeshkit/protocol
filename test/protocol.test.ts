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
  sortAgentStreamEvents,
  validateAgentStreamEvents,
  type AgentApprovalEvent,
  type AgentExecEvent,
  type AgentMessageEvent,
  type AgentStreamEvent,
  type AgentStreamEventValidationResult,
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

describe('event replay helpers', () => {
  it('sorts complete sequence streams by seq before timestamps', () => {
    const events: AgentStreamEvent[] = [
      {
        type: 'turn_completed',
        turnId: 'turn_seq_1',
        at: 1,
        seq: 3,
      },
      {
        type: 'turn_started',
        turnId: 'turn_seq_1',
        at: 3,
        seq: 1,
      },
      {
        type: 'assistant_message',
        turnId: 'turn_seq_1',
        messageId: 'message_assistant_1',
        text: 'Done',
        at: 2,
        seq: 2,
      },
    ];

    expect(sortAgentStreamEvents(events).map((event) => event.type)).toEqual([
      'turn_started',
      'assistant_message',
      'turn_completed',
    ]);
  });

  it('sorts sparse sequence streams by timestamp, lifecycle rank, and original order', () => {
    const events: AgentStreamEvent[] = [
      {
        type: 'assistant_message',
        turnId: 'turn_sort_1',
        messageId: 'message_assistant_1',
        text: 'Hello',
        at: 3,
      },
      {
        type: 'turn_completed',
        turnId: 'turn_sort_1',
        at: 4,
        seq: 4,
      },
      {
        type: 'user_message',
        turnId: 'turn_sort_1',
        messageId: 'message_user_1',
        text: 'Hello',
        at: 3,
      },
      {
        type: 'turn_started',
        turnId: 'turn_sort_1',
        at: 2,
        seq: 2,
      },
    ];

    expect(sortAgentStreamEvents(events).map((event) => event.type)).toEqual([
      'turn_started',
      'user_message',
      'assistant_message',
      'turn_completed',
    ]);
    expect(events[0]!.type).toBe('assistant_message');
  });

  it('accepts exported fixtures as valid turn streams', () => {
    for (const [name, events] of Object.entries(allFixtures)) {
      expect(validateAgentStreamEvents(events), name).toEqual({
        ok: true,
        issues: [],
      });
    }
  });

  it('reports turn events without turn_started', () => {
    const result = validateAgentStreamEvents([
      {
        type: 'assistant_message',
        turnId: 'turn_missing_start',
        messageId: 'message_1',
        text: 'Missing start',
        at: 1,
      },
    ]);

    expect(result.ok).toBe(false);
    expect(result.issues).toMatchObject([
      {
        code: 'missing_turn_started',
        index: 0,
        turnId: 'turn_missing_start',
      },
    ]);
  });

  it('reports events that appear before their turn_started event', () => {
    const result = validateAgentStreamEvents([
      {
        type: 'user_message',
        turnId: 'turn_out_of_order',
        messageId: 'message_1',
        text: 'Before start',
        at: 1,
      },
      {
        type: 'turn_started',
        turnId: 'turn_out_of_order',
        at: 2,
      },
    ]);

    expect(result.issues).toMatchObject([
      {
        code: 'event_before_turn_started',
        index: 0,
        firstIndex: 1,
      },
    ]);
  });

  it('reports duplicate terminal events', () => {
    const result = validateAgentStreamEvents([
      {
        type: 'turn_started',
        turnId: 'turn_duplicate_terminal',
        at: 1,
      },
      {
        type: 'turn_completed',
        turnId: 'turn_duplicate_terminal',
        at: 2,
      },
      {
        type: 'turn_failed',
        turnId: 'turn_duplicate_terminal',
        error: { message: 'already completed' },
        at: 3,
      },
    ]);

    expect(result.issues).toMatchObject([
      {
        code: 'duplicate_terminal_turn',
        index: 2,
        firstIndex: 1,
      },
    ]);
  });

  it('reports duplicate turn_started events', () => {
    const result = validateAgentStreamEvents([
      {
        type: 'turn_started',
        turnId: 'turn_duplicate_start',
        at: 1,
      },
      {
        type: 'turn_started',
        turnId: 'turn_duplicate_start',
        at: 2,
      },
    ]);

    expect(result.issues).toMatchObject([
      {
        code: 'duplicate_turn_started',
        index: 1,
        firstIndex: 0,
      },
    ]);
  });

  it('reports non-terminal events after a terminal turn event', () => {
    const result = validateAgentStreamEvents([
      {
        type: 'turn_started',
        turnId: 'turn_after_terminal',
        at: 1,
      },
      {
        type: 'turn_completed',
        turnId: 'turn_after_terminal',
        at: 2,
      },
      {
        type: 'usage',
        turnId: 'turn_after_terminal',
        usage: { inputTokens: 1, outputTokens: 1 },
        at: 3,
      },
    ]);

    expect(result.issues).toMatchObject([
      {
        code: 'event_after_terminal_turn',
        index: 2,
        firstIndex: 1,
      },
    ]);
  });
});

describe('type guards', () => {
  it('types validation results', () => {
    const result = validateAgentStreamEvents(persistedTwoMessageTurnFixture);
    expectTypeOf(result).toMatchTypeOf<AgentStreamEventValidationResult>();
  });

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
