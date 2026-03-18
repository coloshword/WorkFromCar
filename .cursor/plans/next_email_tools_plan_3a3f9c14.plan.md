---
name: Next Email Tools Plan
overview: Complete the email workflow by adding tools that let users interact with existing inbox emails -- reading, replying, and forwarding -- all within the current OAuth scopes.
todos: []
isProject: false
---

# Next Tools: Complete the Email Workflow

The current 3 tools let you **compose new emails** and **glance at your inbox**, but you can't actually interact with any email you see. For a voice-first driving assistant, the conversation "what's in my inbox?" -> "read that one" -> "reply saying I'll be 10 minutes late" is the core loop, and it's broken after step 1.

## Recommended tools (in priority order)

### 1. `gmail.readEmail` (silent)

**Why:** `summarizeEmails` returns a list of email snippets/subjects, but the user has no way to hear the full content of one. This is the most obvious gap -- every "read me that email" request currently dead-ends.

- Parameters: `messageId` (from a prior `summarizeEmails` result)
- Returns: full body text, sender, date, subject, threadId
- Silent because it's read-only, no confirmation needed
- Feeds naturally into reply/forward tools via `threadId`

### 2. `gmail.replyToEmail` (non-silent)

**Why:** The most common email action while commuting is quick replies -- "sounds good", "I'll be there at 3", "let me check and get back to you". Currently you can only compose *new* emails. A reply needs `threadId` + `messageId` (from `readEmail` or `summarizeEmails`) plus a `body`.

- Parameters: `threadId`, `messageId`, `body`
- Non-silent because it sends a message; requires spoken confirmation
- Uses the same Gmail `messages/send` endpoint with `threadId` and `In-Reply-To`/`References` headers

### 3. `gmail.forwardEmail` (non-silent)

**Why:** Lower frequency than reply, but still common -- "forward that to Sarah". Combines naturally with `resolveContact` for name-to-email resolution.

- Parameters: `messageId`, `to` (email address)
- Non-silent; requires confirmation
- Fetches original message, prepends "Forwarded message" header, sends to recipient

## What this enables

The complete voice conversation becomes:

> "Check my email" -> summarizeEmails (silent)
> "Read the one from Jake" -> resolveContact (silent) -> readEmail (silent)
> "Reply and say I'll call him after lunch" -> replyToEmail (confirmed)
> "Forward the budget email to Sarah" -> resolveContact (silent) -> forwardEmail (confirmed)

All three tools work within the existing `gmail.send` + `gmail.readonly` + `contacts.readonly` scopes -- no auth changes needed.

## Implementation pattern

Each tool follows the same structure already established:

- **Server side:** Tool spec file in `server/src/api/Agent/tools/gmail/` (Zod schema + LLM instructions), register in [AgentToolSpec.ts](server/src/api/Agent/utils/AgentToolSpec.ts)
- **Client side:** API function in `app/src/api/`, Zod schema in [app/src/api/toolSchemas/email.ts](app/src/api/toolSchemas/email.ts), case in [app/src/api/toolExecutor.ts](app/src/api/toolExecutor.ts)
- **Silent config:** Add to [isSilent.ts](server/src/api/Agent/utils/isSilent.ts) if read-only

