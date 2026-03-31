# Main Tool Continuity Proposal

## Problem

The current flow is good at executing silent helper tools like `gmail.resolveContact`, but it is weak at preserving the user's chosen **main tool** across turns and across silent replanning.

Today, once the planner has effectively chosen a non-silent direction like:

- `gmail.createDraft`
- `gcal.createEvent`
- `gmail.replyToEmail`
- `gmail.forwardEmail`

the app can still "drop" that direction if the next planner response comes back with no tool or only a silent helper tool.

That creates two visible issues:

1. The tool UI goes blank or falls back to the helper tool.
2. Multi-turn completion of the main tool relies too much on raw conversation history instead of structured tool state.

This is why prompt-only fixes help for one path but do not solve the general architectural issue.

## Desired Behavior

Once the agent has chosen the main non-silent tool for the user's request, that tool should remain the active structured context until one of these happens:

- the tool becomes executable and moves into confirmation flow
- the user revises the task into a different main tool
- the user cancels the task
- execution completes

Silent tools should be treated as helper steps in service of that main tool, not as replacements for it.

## Rollout Plan

### Phase 1: App-Side MVP

Goal:

- stop dropping the chosen main non-silent tool in the UI and planning flow

Scope:

- add and preserve `contextTool` in the app
- keep the chosen main tool visible while silent helpers execute
- pass `contextTool` back into planning after silent tool results
- promote `contextTool` into `pendingTool` once executable

Why first:

- this is where the main continuity bug actually shows up to the user
- it should fix most of the visible regression without requiring route or shared-type changes

### Phase 2: Server Cleanup And Hardening

Goal:

- make the planning contract cleaner and reduce ambiguity in the server response shape

Scope:

- return `tool: null` instead of fake empty tools
- generalize `contextTool` semantics beyond revise-only flows
- optionally add server-side planner framing that helper tools should continue the existing main tool rather than replace it

Why second:

- these changes make the system more robust and easier to reason about
- they are useful, but they are not required to land the first user-visible continuity improvement

## Proposed Model

Introduce a second piece of client state:

- `pendingTool`: a fully executable non-silent tool waiting for confirmation
- `contextTool`: the current main non-silent tool being built, even if incomplete

`contextTool` should exist as soon as the planner has chosen the main direction.

Examples:

- "send an email to Laura"
  - main tool: `gmail.createDraft`
  - helper tool: `gmail.resolveContact`
- "invite John and Sarah to lunch tomorrow"
  - main tool: `gcal.createEvent`
  - helper tool: `gmail.resolveContact` for each attendee

## Proposed Flow

### 1. Lock in the main tool

When planning returns a non-silent tool, store it in `contextTool` immediately, even if required fields are still `null`.

If the planner returns a silent helper tool while a `contextTool` already exists, keep the existing `contextTool`.

### 2. Replan with structured main-tool context

After each silent tool execution, call `/api/agent/plan` with:

- conversation `messages`
- `contextTool` when present

That way the server is not inferring the main direction only from free-form history. It is explicitly told:

- which main tool is currently being built
- which parameters are already known
- which helper result just arrived

### 3. Show the main tool in the UI

The visible tool panel should prefer:

1. current non-silent planned tool
2. otherwise `contextTool`
3. otherwise the active silent tool only while it is executing

This preserves continuity for the user. The helper tool can still appear transiently, but the main tool should remain the stable object the user is effectively working on.

### 4. Upgrade `contextTool` to `pendingTool`

When `contextTool` becomes executable according to frontend schema validation:

- copy it into `pendingTool`
- keep showing it in the UI
- ask for confirmation

`pendingTool` is about execution permission.
`contextTool` is about planning continuity.

### 5. Clear state only at terminal moments

Clear `contextTool` when:

- the user cancels
- execution succeeds
- the planner deliberately switches to a different main non-silent tool

Do not clear it just because the latest plan response has `tool: null`.

## Phase 2 Server Changes

### Return `tool: null`

`/api/agent/plan` should return `tool: null` when no tool is planned, rather than:

```json
{ "tool": "", "toolParameters": null }
```

This removes fake empty-tool states and makes the client logic much simpler.

### Generalize `contextTool` semantics

Right now `contextTool` is mainly used for the explicit revise flow.

It should be generalized so the planner can receive a system message like:

> Current main tool under construction: ...
> Continue updating this tool unless the user clearly changed intent.

This should apply both:

- when revising a pending tool
- when continuing a partially built main tool after silent helper calls

## Phase 1 Client Changes

### `VoiceDashboard2.tsx`

Add:

- `contextTool` state

Update behavior:

- set `contextTool` as soon as a non-silent tool is chosen
- preserve `contextTool` across silent tool loops
- pass `contextTool` into `sendAgentMessage(..., null, contextTool)` during replanning
- only clear `contextTool` on cancel, success, or explicit intent switch

### `useSendMessage.ts`

No API redesign is needed if the existing `contextTool` parameter stays.

The main change is just to use it much more consistently from the app.

### `ToolCallGlass.tsx`

Potentially no structural change is required if the screen passes the right tool to display.

The main UI change is choosing the display source correctly:

- active helper tool when it is running
- otherwise the current main `contextTool`

## Why This Is Better Than Prompt Fixes

Prompt fixes are still useful, but they are not sufficient because they rely on the model to always remember that a silent helper result should roll forward into the main tool immediately.

The more robust rule is:

> once the system knows the main tool, preserve it as application state

That makes the flow resilient for:

- email drafts
- calendar events with attendee resolution
- forwards
- replies
- any future non-silent tool that depends on silent preprocessing

## Acceptance Criteria

The fix is correct if:

1. After the main direction is chosen, the UI does not drop it while helper tools execute.
2. Silent helper calls can fill parameters for the main tool without replacing the main tool in state.
3. Partial non-silent tools survive across turns as structured context.
4. `gmail.createDraft` and `gcal.createEvent` both behave consistently under helper-tool chaining.
5. The client no longer depends on fake empty tool objects.

## Suggested Implementation Order

### Phase 1

1. Add `contextTool` state to `VoiceDashboard2`.
2. Preserve and reuse `contextTool` during silent replanning.
3. Update display logic so the main tool remains visible.
4. Promote `contextTool` to `pendingTool` only when executable.
5. Retest email and calendar flows with silent helper chaining.

### Phase 2

1. Change shared types and route responses so plan responses can return `tool: null`.
2. Generalize server `contextTool` prompting from "revise only" to "current main tool under construction".
3. Remove any client logic that depends on fake empty tool objects.
4. Retest the same flows to confirm the app-side MVP still behaves the same on the cleaner contract.

## Open Questions

1. Should the helper tool still be shown briefly while it is actively executing, or should the UI always show the main tool once chosen?
2. Do we want to preserve `contextTool` only for non-silent tools, or for any tool with multi-turn parameter collection?
3. Should a planner response with a different non-silent tool automatically replace `contextTool`, or should that require stronger intent evidence?
