---
name: Launch Readiness Tracker
overview: Launch readiness assessment at ~65% overall, with percentage completion per category and prioritized next killer features.
todos:
  - id: security-fixes
    content: "Must-fix security: remove commented token from readEmail.ts, lock down CORS, make port configurable"
    status: pending
  - id: stability-fixes
    content: "Must-fix stability: add Koa centralized error handler, fix Load Model button, align summarizeEmails max limits"
    status: pending
  - id: calendar-tools
    content: Add Google Calendar tools (getUpcoming, createEvent, respondToInvite)
    status: pending
  - id: wake-word
    content: Add wake word detection (Picovoice Porcupine)
    status: pending
  - id: onboarding-ui
    content: Add onboarding screen and settings
    status: pending
  - id: notes-tools
    content: Add quick notes/reminders tools
    status: pending
  - id: conversation-memory
    content: Add conversation memory (persist messages per account)
    status: pending
isProject: false
---

# Launch Readiness and Next Features

## Overall Launch Readiness: ~65%

The core product loop (voice -> agent -> email tools -> TTS) works end-to-end. Email workflow is feature-complete with 6 tools. The gap is hardening, polish, and one more feature domain to make the app compelling.

---

## Launch Readiness by Category

### Core Product Loop -- 90%

What works:

- Voice input (Whisper STT + VAD) on-device
- LLM planning (Gemini) with tool selection, retries, JSON repair
- Full email workflow: compose, summarize, read, reply, forward, resolve contacts
- Silent vs non-silent tool confirmation flow
- TTS output (Kokoro) on-device
- Google OAuth login with JWT

What's missing:

- Token refresh handling (expired Google access tokens mid-session)
- readEmail returns empty body for image-heavy emails (HTML fallback needed)

### Error Handling and Resilience -- 30%

What works:

- Client-side try/catch in VoiceDashboard2 and toolExecutor
- Zod validation on tool parameters
- LLM retry logic with JSON repair (3 attempts)

What's missing:

- No Koa centralized error handler on server
- No handling for LLM provider outages (429s, 500s)
- No graceful degradation when offline
- Load Model button has no onPress handler
- Schema mismatch: EmailSummarize instructions say "Max 25" but client throws at >10

### Security -- 50%

What works:

- JWT auth middleware on agent routes
- API keys and secrets from env vars
- Keychain storage for JWT on client

What's missing:

- Commented-out access token in readEmail.ts (must remove + rotate)
- CORS allows all origins
- Server port hardcoded (not from env)
- No rate limiting
- No .env.example files

### UI/UX -- 40%

What works:

- Login screen with Google Sign-In
- Voice dashboard with audio visualizer, mode labels, tool panel
- DEV_TEXT_MODE for testing

What's missing:

- No onboarding / first-run experience
- No settings screen
- No explanation of what the user can say
- Terms/Privacy links are empty
- No conversation history display
- No offline state indicator

### Testing -- 15%

What exists:

- 1 smoke test for App component
- JWT utils tests
- isSilent tests

What's missing:

- No tests for any of the 6 email tools
- No tests for agent routes or actions
- No tests for VoiceDashboard
- No integration or E2E tests

### Production Infrastructure -- 20%

What exists:

- Docker for PostgreSQL
- Makefile for dev commands
- .env for secrets

What's missing:

- No production deployment config (Dockerfile is outdated/MySQL)
- No structured logging (all console.log)
- No health/readiness endpoint
- No graceful shutdown
- No env var validation at startup
- Android release build uses debug signing

### Android -- 10%

What exists:

- Android build scaffolding (gradle, manifest, etc.)
- React Native cross-platform screens

What's missing:

- Whisper and Kokoro native modules are iOS-only
- RECORD_AUDIO permission not declared
- Model paths use iOS-specific MainBundlePath

---

## Next Killer Features (Priority Order)

### 1. Google Calendar (HIGH IMPACT, MEDIUM EFFORT)

The single most valuable feature addition for commuters. Same tool architecture as email.

- `calendar.getUpcoming` (silent) -- "What's my schedule today?" / "When's my next meeting?"
- `calendar.createEvent` (non-silent) -- "Schedule a meeting with Sarah tomorrow at 2pm"
- `calendar.respondToInvite` (non-silent) -- "Accept the 3pm meeting"
- Requires: new OAuth scopes (`calendar.readonly`, `calendar.events`)

### 2. Wake Word / Always-On Listening (HIGH IMPACT, MEDIUM EFFORT)

Makes the app truly hands-free. Currently user has no way to know when the app is listening without looking at the screen. Picovoice Porcupine is a natural fit since you're already using Picovoice voice processor for mic capture. Wake word runs continuously in low-power mode, triggers the full VAD+Whisper pipeline.

### 3. Quick Notes / Reminders (MEDIUM IMPACT, LOW EFFORT)

"Remind me to follow up with the client" / "Note: pick up groceries on the way home." Store locally or in a simple server-side table. No external API needed.

- `notes.create` (non-silent) -- Save a text note with optional timestamp
- `notes.list` (silent) -- "What are my notes?"

### 4. Conversation Memory (MEDIUM IMPACT, MEDIUM EFFORT)

Messages reset each session. Store last N interactions in PostgreSQL so the agent has context across sessions: "You emailed Jake about the Q3 report yesterday."

### 5. SMS / iMessage (HIGH IMPACT, HIGH EFFORT)

"Text Sarah I'm running 5 minutes late." Uses iOS native messaging APIs or Shortcuts. Complex due to platform restrictions on programmatic messaging.