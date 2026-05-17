# PRD: AgentMeshKit Protocol

## Summary

`@agentmeshkit/protocol` is the stable contract package for AI agent workbench
projects. It gives chat renderers, composers, runners, workspace managers, and
approval systems one shared vocabulary instead of each project inventing
slightly different event and payload shapes.

## Problem

AgentWeb already has several overlapping models: persisted chat rows, live SSE
events, Codex tool events, token usage, approvals, attachments, and session
metadata. Future sibling projects will repeat this unless the protocol is
defined once.

## Users

- App authors building Codex-style agent workbenches.
- UI package authors building transcript and composer components.
- Runtime package authors wrapping coding-agent CLIs.
- Backend authors storing and replaying agent sessions.

## Goals

- Provide small, framework-free TypeScript types.
- Define canonical events for turns, messages, tools, exec, approvals, usage,
  attachments, and stream status.
- Support persisted history and live streaming with the same event model.
- Keep the package usable from browser and Node runtimes.

## Non-Goals

- No React components.
- No Codex CLI process management.
- No OAuth or secret handling.
- No storage implementation.

## MVP Scope

- `AgentSession` and `AgentTurn` identifiers.
- `AgentSession`, `AgentTurn`, `AgentMessage`, `AgentToolCall`,
  `TokenUsage`, `Attachment`, and `WorkspaceFileRef` data types.
- `AgentStreamEvent` discriminated union keyed by `type`.
- Message events: `user_message`, `assistant_message`, and `reasoning`.
- Tool events: `function_call`, `tool_call`, and `tool_result`.
- Exec events: `exec_begin` and `exec_end`.
- Approval events: `approval_requested` and `approval_resolved`.
- Reference events: `attachment` and `file_reference`.
- Diagnostic/control events: `usage`, `status`, `error`, and `raw`.
- Terminal lifecycle events: `turn_completed`, `turn_failed`, and
  `turn_aborted`.
- `TokenUsage` and model metadata.
- Helper type guards for event narrowing:
  `isTerminalTurnEvent`, `isMessageEvent`, `isToolEvent`,
  `isApprovalEvent`, and `isExecEvent`.
- Lightweight replay helpers:
  `sortAgentStreamEvents` and `validateAgentStreamEvents`.

## Public API Sketch

```ts
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

export function isTerminalTurnEvent(event: AgentStreamEvent): event is TerminalTurnEvent;
export function isMessageEvent(event: AgentStreamEvent): event is AgentMessageEvent;
export function isToolEvent(event: AgentStreamEvent): event is AgentToolEvent;
export function isApprovalEvent(event: AgentStreamEvent): event is AgentApprovalEvent;
export function isExecEvent(event: AgentStreamEvent): event is AgentExecEvent;

export function sortAgentStreamEvents(events: readonly AgentStreamEvent[]): AgentStreamEvent[];
export function validateAgentStreamEvents(
  events: readonly AgentStreamEvent[],
): AgentStreamEventValidationResult;
```

## Implemented Event Semantics

Events use Unix epoch milliseconds in `at`. `sessionId`, `threadId`, `turnId`,
and `seq` are optional on the base event so live transports can add ordering and
storage context without changing each payload shape.

Streaming assistant text should emit `assistant_message` with the current full
`text`; producers may also include the incremental `delta`. Persisted history
should emit the final `assistant_message` with `partial: false`.

Generic functions use `function_call` plus `tool_result`. Non-function tools can
use `tool_call` plus `tool_result`. Shell/process execution should use
`exec_begin` and `exec_end` so renderers can present command-specific details
without parsing generic tool arguments.

Approval systems should emit `approval_requested` before the gated action and
`approval_resolved` with `approved`, `rejected`, `expired`, or `cancelled`.

`raw` exists only for forward compatibility and debugging. Stable consumers
should prefer the canonical typed events above.

## Second-Round Implementation Notes

The second round adds dependency-free replay helpers for packages that consume
persisted or live event streams without taking a storage or UI dependency.

`sortAgentStreamEvents` returns a new array. It prefers `seq` when every event
has a sequence number, then falls back to `at` for sparse sequence streams. A
small lifecycle rank keeps `thread_started` and `turn_started` before content
and terminal turn events after turn activity. Original input order is the final
tie-breaker, so sorting remains stable.

`validateAgentStreamEvents` returns `{ ok, issues }` instead of throwing. It
checks basic stream consistency:

- Turn-scoped events without any `turn_started`.
- Turn-scoped events that appear before their `turn_started`.
- Non-terminal events after a terminal turn event.
- Duplicate terminal turn events.
- Duplicate `turn_started` events.

This validation is intentionally shallow. It does not enforce provider-specific
tool pairing, message aggregation rules, attachment storage, or complete turn
closure, so streaming consumers can validate in-flight turns before a terminal
event exists.

## Fixtures

The package includes fixtures for:

- Persisted two-message turn.
- Live streaming partial assistant message.
- `run_command` exec begin/end.
- Generic function call and result.
- Approval request and resolution.
- Failed turn.

## Acceptance Criteria

- The package builds to ESM and type declarations.
- The event union can model AgentWeb chat history and live streaming events.
- Type tests prove common events narrow correctly.
- Docs include one persisted-history example and one live-stream example.
- Docs include validation and replay usage.
- Fixtures pass the lightweight event stream validator.
- Docs include a compact `docs/AI_AGENT_INTEGRATION.md` contract covering event
  shape, sorting, validation issue codes, and producer rules.
- `pnpm build`, `pnpm typecheck`, and `pnpm test` pass.

## Milestones

1. Draft event model and type guards.
2. Back-port AgentWeb event examples as fixtures.
3. Add type tests and generated API docs.
4. Publish `0.1.0`.
