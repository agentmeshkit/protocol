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
- `AgentStreamEvent` discriminated union.
- `AgentMessageEvent`, `AgentToolCallEvent`, `AgentExecEvent`, and terminal
  lifecycle events.
- `AgentApprovalRequest` / `AgentApprovalResponse`.
- `AgentAttachment` and workspace file reference types.
- `TokenUsage` and model metadata.
- Helper type guards for event narrowing.

## Public API Sketch

```ts
export type AgentStreamEvent =
  | ThreadStartedEvent
  | TurnStartedEvent
  | UserMessageEvent
  | AssistantMessageEvent
  | ToolCallEvent
  | ToolResultEvent
  | ExecStartedEvent
  | ExecFinishedEvent
  | ApprovalRequestedEvent
  | ApprovalResolvedEvent
  | TurnCompletedEvent
  | TurnFailedEvent
  | TurnAbortedEvent;

export function isTerminalTurnEvent(event: AgentStreamEvent): boolean;
```

## Acceptance Criteria

- The package builds to ESM and type declarations.
- The event union can model AgentWeb chat history and live streaming events.
- Type tests prove common events narrow correctly.
- Docs include one persisted-history example and one live-stream example.

## Milestones

1. Draft event model and type guards.
2. Back-port AgentWeb event examples as fixtures.
3. Add type tests and generated API docs.
4. Publish `0.1.0`.

