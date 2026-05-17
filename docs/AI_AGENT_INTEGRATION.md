# AI Agent Integration

Compact integration contract for AI agents producing or consuming
`@agentmeshkit/protocol` streams.

## Import

```ts
import {
  sortAgentStreamEvents,
  validateAgentStreamEvents,
  type AgentStreamEvent,
} from '@agentmeshkit/protocol';
```

`AgentStreamEvent` is a discriminated union keyed by `type`.

## Base Event Contract

Every event has:

```ts
{
  type: string;
  at: number;
  sessionId?: string;
  threadId?: string;
  turnId?: string;
  seq?: number;
}
```

Use `seq` for transport ordering when available. Use `at` as a timestamp in
Unix epoch milliseconds.

Sorting rule: `sortAgentStreamEvents` uses `seq` only when every event has one.
If any event lacks `seq`, sorting falls back to `at`, event lifecycle rank, and
original input order. Producers should either populate `seq` on all events or
omit it entirely.

## Minimal Turn Stream

```ts
const events: AgentStreamEvent[] = [
  { type: 'thread_started', threadId, sessionId, at: now() },
  { type: 'turn_started', threadId, sessionId, turnId, at: now() },
  {
    type: 'assistant_message',
    threadId,
    sessionId,
    turnId,
    messageId,
    text: 'Hello',
    partial: false,
    at: now(),
  },
  { type: 'turn_completed', threadId, sessionId, turnId, at: now() },
];
```

Turn-scoped events must follow `turn_started`. Emit exactly one terminal event
per `turnId`: `turn_completed`, `turn_failed`, or `turn_aborted`.

## Common Event Types

- Lifecycle: `thread_started`, `turn_started`, `turn_completed`,
  `turn_failed`, `turn_aborted`
- Messages: `user_message`, `assistant_message`, `reasoning`
- Tools: `function_call`, `tool_call`, `tool_result`
- Exec: `exec_begin`, `exec_end`
- Approval: `approval_requested`, `approval_resolved`
- Attachments/files: `attachment`, `file_reference`
- Diagnostics: `usage`, `status`, `error`, `raw`

## Validate And Replay

```ts
const sorted = sortAgentStreamEvents(events);
const validation = validateAgentStreamEvents(sorted);

if (!validation.ok) {
  report(validation.issues);
}
```

Validation is a lightweight replay check, not runtime schema validation. It
catches:

- `missing_turn_started`
- `event_before_turn_started`
- `event_after_terminal_turn`
- `duplicate_terminal_turn`
- `duplicate_turn_started`

## Type Guards

```ts
import {
  isApprovalEvent,
  isExecEvent,
  isMessageEvent,
  isTerminalTurnEvent,
  isToolEvent,
} from '@agentmeshkit/protocol';
```

Use guards in renderers and persistence reducers.

## Producer Rules

- Generate stable `threadId`, `sessionId`, `turnId`, `messageId`, and call ids.
- Preserve append-only order; do not mutate old persisted events.
- For assistant streaming, reuse `messageId`, set `text` to the current full
  message, include `delta` when available, and set `partial: true` until final.
- Pair `function_call`, `tool_call`, and `tool_result` by `callId`.
- Use `exec_begin` and `exec_end` for shell/process commands.
- Emit `approval_requested` before the gated action and `approval_resolved`
  after the user/system decision.
- Put unknown upstream payloads in `raw` instead of dropping them.
- Use `AgentError` shape for failures: `{ message, code?, recoverable?, cause? }`.
