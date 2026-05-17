# @agentmeshkit/protocol

Shared TypeScript protocol for AI agent workbench apps.

This package defines framework-free session, turn, message, tool, approval,
attachment, workspace file, usage, and stream event contracts for browser and
Node runtimes.

## Install

```sh
pnpm add @agentmeshkit/protocol
```

## Event Protocol

`AgentStreamEvent` is a discriminated union keyed by `type`. Events are append
friendly: the same union can represent persisted transcript history and live
streaming updates.

Core lifecycle events:

- `thread_started`: a logical agent thread/session became known.
- `turn_started`: a user request or resumed agent turn started.
- `turn_completed`, `turn_failed`, `turn_aborted`: terminal turn events.

Content events:

- `user_message`: user-visible input text and attachments.
- `assistant_message`: assistant text. Streaming producers may set `partial`
  and `delta`.
- `reasoning`: optional reasoning summary or partial reasoning text.
- `attachment`: attachment metadata not tied to a single message shape.
- `file_reference`: workspace file reference or file-change notice.

Tooling events:

- `function_call`: generic function invocation.
- `tool_call`: named non-function tool invocation.
- `tool_result`: result for either `function_call` or `tool_call`.
- `exec_begin`, `exec_end`: command execution with command, cwd, exit code,
  stdout, stderr, and duration.

Control and diagnostics:

- `approval_requested`, `approval_resolved`: approval lifecycle.
- `usage`: token usage and model metadata.
- `status`: stream connection/status updates.
- `error`: non-terminal stream error.
- `raw`: opaque source event for forward compatibility.

## Example: Persisted History

```ts
import type { AgentStreamEvent } from '@agentmeshkit/protocol';

export const events: AgentStreamEvent[] = [
  { type: 'thread_started', threadId: 'thread_1', sessionId: 'session_1', at: 1 },
  { type: 'turn_started', threadId: 'thread_1', turnId: 'turn_1', at: 2 },
  {
    type: 'user_message',
    threadId: 'thread_1',
    turnId: 'turn_1',
    messageId: 'message_user_1',
    text: 'Summarize this repository.',
    at: 3,
  },
  {
    type: 'assistant_message',
    threadId: 'thread_1',
    turnId: 'turn_1',
    messageId: 'message_assistant_1',
    text: 'This repository defines shared protocol types.',
    partial: false,
    at: 4,
  },
  {
    type: 'turn_completed',
    threadId: 'thread_1',
    turnId: 'turn_1',
    usage: { inputTokens: 84, cachedInputTokens: 12, outputTokens: 19 },
    at: 5,
  },
];
```

## Example: Live Streaming

```ts
import {
  isMessageEvent,
  isTerminalTurnEvent,
  type AgentStreamEvent,
} from '@agentmeshkit/protocol';

function reduceTranscript(events: AgentStreamEvent[]) {
  let assistantText = '';
  let done = false;

  for (const event of events) {
    if (isMessageEvent(event) && event.type === 'assistant_message') {
      assistantText = event.text;
    }
    if (isTerminalTurnEvent(event)) {
      done = true;
    }
  }

  return { assistantText, done };
}
```

## Example: Validation And Replay

```ts
import {
  sortAgentStreamEvents,
  validateAgentStreamEvents,
  type AgentStreamEvent,
} from '@agentmeshkit/protocol';

export function prepareReplay(input: AgentStreamEvent[]) {
  const events = sortAgentStreamEvents(input);
  const validation = validateAgentStreamEvents(events);

  if (!validation.ok) {
    return {
      events,
      ready: false,
      issues: validation.issues.map((issue) => ({
        code: issue.code,
        index: issue.index,
        turnId: issue.turnId,
        message: issue.message,
      })),
    };
  }

  return {
    events,
    ready: true,
    issues: [],
  };
}
```

`sortAgentStreamEvents` returns a new array and keeps replay ordering stable by
using `seq` when every event provides it. Sparse sequence streams fall back to
`at`, lifecycle rank, and original input order.

`validateAgentStreamEvents` is intentionally lightweight. It checks basic turn
stream consistency such as missing `turn_started`, events before
`turn_started`, events after a terminal turn event, duplicate terminal events,
and duplicate `turn_started`.

## Fixtures

Fixtures are exported from the root package and from
`@agentmeshkit/protocol/fixtures`:

- `persistedTwoMessageTurnFixture`
- `liveStreamingPartialAssistantMessageFixture`
- `runCommandExecFixture`
- `genericFunctionCallFixture`
- `approvalRequestFixture`
- `failedTurnFixture`

## Utilities

```ts
import {
  isApprovalEvent,
  isExecEvent,
  isMessageEvent,
  isTerminalTurnEvent,
  isToolEvent,
  sortAgentStreamEvents,
  validateAgentStreamEvents,
} from '@agentmeshkit/protocol';
```

Each guard narrows `AgentStreamEvent` to the matching exported event subtype.
The sort and validation helpers are dependency-free utilities for stream
consumers that need to validate persisted history before replaying it.
