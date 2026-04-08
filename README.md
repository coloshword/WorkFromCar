# WorkFromCar

A voice-first AI assistant for hands-free email and calendar management. Built for use while driving, WorkFromCar lets you read, reply to, and compose emails, manage contacts, and create calendar events — all through natural voice interaction.

https://github.com/user-attachments/assets/4f10ea57-789b-4bf4-b2e6-c0c18d319f9b


## How It Works

1. **You speak** — audio is captured and transcribed on-device using Whisper.cpp (STT) and Picovoice (VAD).
2. **The server plans** — your transcript is sent to a backend that uses LLMs (Gemini, OpenRouter) to determine intent, select the right tool, and extract parameters.
3. **The app executes** — Gmail, Google Calendar, and Google People APIs are called directly from the device using the user's OAuth token. Results are summarized by the server and spoken back via Kokoro TTS.

The server never touches your Google data directly — it only plans and summarizes. All API calls happen on-device with your credentials.

## Features

- **Voice-driven email** — read, reply, forward, compose drafts, and summarize your inbox
- **Calendar management** — create events via voice
- **Contact resolution** — find contacts by name through Google People
- **On-device speech processing** — Whisper.cpp for transcription, Kokoro for text-to-speech
- **LLM-powered planning** — Gemini and OpenRouter models interpret requests and orchestrate tool calls
- **Permission checks** — sensitive actions require explicit user confirmation

## Tech Stack

| Layer | Technologies |
|---|---|
| Mobile | React Native 0.83, React 19, TypeScript |
| Voice | Picovoice (VAD), Whisper.cpp (STT), Kokoro (TTS) — native TurboModules |
| Backend | Node.js, Koa 3, TypeScript |
| Database | PostgreSQL 16 |
| AI/LLM | Google GenAI (Gemini), OpenRouter, OpenAI |
| Auth | Google Sign-In, JWT |

## Project Structure

```
work_from_car/
├── app/                        # React Native mobile app
│   ├── src/
│   │   ├── api/                # Gmail, Calendar, Contacts client tools
│   │   ├── components/         # VoiceListener, ToolCallGlass, AudioVisualizer
│   │   ├── screens/            # Login, VoiceDashboard
│   │   ├── services/audio/     # Voice processor
│   │   └── utils/              # TTS, fetch helpers, hooks
│   └── ios/third_party/        # whisper.cpp native dependency
├── server/
│   ├── src/api/                # routes: Auth, Agent, Account
│   ├── initdb/                 # PostgreSQL schema (init.sql)
│   └── Makefile                # DB and server run targets
├── packages/
│   ├── whisper/                # Native Whisper STT TurboModule
│   └── kokoro/                 # Native Kokoro TTS TurboModule
├── types/                      # Shared TypeScript declarations
└── site/                       # Static test/dev pages
```

## Prerequisites

- Node.js >= 20
- Docker (for PostgreSQL)
- Xcode (for iOS builds)
- Ruby + Bundler (for CocoaPods)
- A Google Cloud project with OAuth credentials and API access for Gmail, Calendar, and People

## Setup

### 1. Database

Create `server/.env` with your database and API credentials:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
POSTGRES_DB=workfromcar

JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key
OPEN_ROUTER_API_KEY=your_openrouter_key
GOOGLE_AUTH_CLIENT_ID=your_google_web_client_id
GOOGLE_AUTH_CLIENT_ID_APP=your_google_ios_client_id
```

Start PostgreSQL:

```bash
cd server
make run-db
```

### 2. Backend

```bash
cd server
npm install
make run-server
```

The server starts on port 3000.

### 3. Mobile App

Create `app/.env` with app-side config:

```env
API_BASE_URL=http://localhost:3000
GOOGLE_WEB_CLIENT_ID=your_google_web_client_id
GOOGLE_AUTH_CLIENT_ID_APP=your_google_ios_client_id
```

Install dependencies and run:

```bash
cd app
npm install
bundle install
cd ios && bundle exec pod install && cd ..
npm run ios
```

## API Endpoints

| Endpoint | Description |
|---|---|
| `POST /api/auth/google` | Authenticate with Google ID token, returns JWT |
| `POST /api/agent/plan` | Send transcript, receive structured tool plan |
| `POST /api/agent/executePermission` | Validate intent for sensitive actions |
| `POST /api/agent/summarize` | Summarize tool execution results as natural language |

## Available Voice Tools

| Tool | What it does |
|---|---|
| `gmail.createDraft` | Compose a new email draft |
| `gmail.summarizeEmails` | Summarize recent inbox messages |
| `gmail.readEmail` | Read a specific email |
| `gmail.replyToEmail` | Reply to an email |
| `gmail.forwardEmail` | Forward an email |
| `gmail.resolveContact` | Look up a contact by name |
| `gcal.createEvent` | Create a calendar event |
| `gcal.updateEvent` | Update an existing calendar event |
