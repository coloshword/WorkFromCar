

# WorkFromCar

Voice-first iOS assistant for hands-free Gmail and Google Calendar — built for use while driving.

<video src="https://github.com/coloshword/WorkFromCar/releases/download/demo-assets/apiscopes.mp4" controls></video>

## How it works

1. **Capture** — on-device VAD (Picovoice) and STT (Whisper.cpp) turn speech into text.
2. **Plan** — the server uses Gemini / OpenRouter to pick a tool and extract parameters from the transcript.
3. **Execute** — Gmail, Calendar, and People APIs are called directly from the device using the user's OAuth token. Results are summarized server-side and spoken back via Kokoro TTS.

The server never touches Google data — it only plans and summarizes. All API calls happen on-device.

## Tech stack

| Layer | Stack |
|---|---|
| Mobile | React Native 0.83, React 19, TypeScript |
| Voice | Picovoice (VAD), Whisper.cpp (STT), Kokoro (TTS) — native TurboModules |
| Backend | Node.js, Koa 3, PostgreSQL 16 |
| LLM | Gemini, OpenRouter, OpenAI |
| Auth | Google Sign-In, JWT |

## Setup

Requires Node 20+, Docker, Xcode, Ruby/Bundler, and a Google Cloud project with OAuth + Gmail/Calendar/People APIs enabled.

**Backend** — create `server/.env`:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=...
POSTGRES_PASSWORD=...
POSTGRES_DB=workfromcar
JWT_SECRET=...
GEMINI_API_KEY=...
OPENAI_API_KEY=...
OPEN_ROUTER_API_KEY=...
GOOGLE_AUTH_CLIENT_ID=...        # web client id
GOOGLE_AUTH_CLIENT_ID_APP=...    # ios client id
```

```bash
cd server
make run-db
npm install && make run-server   # serves on :3000
```

**App** — create `app/.env`:

```env
API_BASE_URL=http://localhost:3000
GOOGLE_WEB_CLIENT_ID=...
GOOGLE_AUTH_CLIENT_ID_APP=...
```

```bash
cd app
npm install && bundle install
cd ios && bundle exec pod install && cd ..
npm run ios
```

## API

| Endpoint | Description |
|---|---|
| `POST /api/auth/google` | Exchange Google ID token for JWT |
| `POST /api/agent/plan` | Transcript → structured tool plan |
| `POST /api/agent/executePermission` | Validate intent for sensitive actions |
| `POST /api/agent/summarize` | Summarize tool results as natural speech |

## Voice tools

Gmail: `createDraft`, `summarizeEmails`, `readEmail`, `replyToEmail`, `forwardEmail`, `resolveContact`
Calendar: `createEvent`, `updateEvent`, `deleteEvent`, `getEvents`, `respondToEvent`
