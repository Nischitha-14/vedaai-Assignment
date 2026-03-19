# VedaAI

VedaAI is a full-stack AI assessment creator for teachers. It lets educators create assignments, generate structured question papers, track live progress, and download a printable PDF.

## Architecture

```text
                            +----------------------+
                            |      Next.js App     |
                            |  App Router + RHF    |
                            |  Zustand + Socket.io |
                            +----------+-----------+
                                       |
                        REST / WebSocket|
                                       v
                            +----------------------+
                            |    Express Server    |
                            |  Routes + Uploads    |
                            |  Socket.io + PDF     |
                            +----+-----------+-----+
                                 |           |
                      MongoDB     |           | Redis / BullMQ
                                 v           v
                        +----------------+  +------------------+
                        | Assignment DB  |  | Question Queue   |
                        | Mongoose       |  | Cache + Jobs      |
                        +--------+-------+  +---------+--------+
                                 |                    |
                                 +---------+----------+
                                           |
                                           v
                              +---------------------------+
                              | Generation Worker         |
                              | Claude API + JSON parser  |
                              | Local resilient fallback  |
                              +---------------------------+
```

## Monorepo Structure

```text
root/
├── backend/    Express API, worker, PDF export
├── frontend/   Next.js application
├── compose.yml Docker services for MongoDB and Redis
└── package.json Root workspace scripts
```

## Tech Stack

- Frontend: Next.js 14, TypeScript, Zustand, TailwindCSS, React Hook Form, Zod, Socket.io Client
- Backend: Node.js, Express, TypeScript, MongoDB, Mongoose, Redis, BullMQ, Socket.io
- AI: Claude API with `claude-sonnet-4-20250514`
- PDF: `@react-pdf/renderer`

## Setup

### 1. Prerequisites

- Node.js 20+
- npm 10+
- Docker Desktop running

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment files

The repo already includes local defaults for development:

- [`backend/.env`](/Users/nischithasrinivas/Desktop/vedaiproject/backend/.env)
- [`frontend/.env.local`](/Users/nischithasrinivas/Desktop/vedaiproject/frontend/.env.local)

Set a real Claude API key in [`backend/.env`](/Users/nischithasrinivas/Desktop/vedaiproject/backend/.env):

```env
CLAUDE_API_KEY=your_real_key
```

### 4. Run locally

```bash
npm run dev
```

What happens:

1. Docker Compose starts MongoDB and Redis.
2. The backend starts on `http://localhost:3001`.
3. The frontend starts on `http://localhost:3000`.

Open:

- `http://localhost:3000/assignments`

### 5. Stop local infrastructure

```bash
npm run infra:down
```

## Scripts

### Root

```bash
npm run dev
npm run build
npm run test
npm run typecheck
npm run infra:down
```

### Backend

```bash
npm run dev --workspace backend
npm run build --workspace backend
npm run test --workspace backend
```

### Frontend

```bash
npm run dev --workspace frontend
npm run build --workspace frontend
npm run test --workspace frontend
```

## API Documentation

### `GET /api/health`

Returns backend readiness.

Response:

```json
{ "status": "ok" }
```

### `POST /api/assignments`

Creates an assignment and queues generation.

Request:

- Content type: `multipart/form-data`
- Fields:
  - `title`
  - `subject`
  - `gradeLevel`
  - `dueDate`
  - `additionalInstructions`
  - `difficulty`
  - `questionTypes` as JSON string
  - `file` optional PDF or TXT

Response:

```json
{ "assignmentId": "..." }
```

### `GET /api/assignments`

Returns all assignments sorted by newest first.

### `GET /api/assignments/:id`

Returns a single assignment and embedded generated result if available.

### `GET /api/assignments/:id/paper`

Returns the generated structured question paper. Cached in Redis for one hour.

### `GET /api/assignments/:id/paper/pdf`

Returns a downloadable PDF.

### `POST /api/assignments/:id/regenerate`

Queues a fresh generation job for an existing assignment.

## WebSocket Events

Client emits:

- `assignment:join`
- `assignment:leave`

Server emits:

- `job:progress`
- `job:completed`
- `job:failed`

## Product Features

- Assignment dashboard with status badges and empty state
- Multi-step assignment creation flow with validation
- Optional PDF/TXT upload with text extraction
- Real-time progress tracking over Socket.io
- Structured question paper rendering with sections and answer key
- Sticky action bar with regenerate and PDF download
- Responsive dashboard shell with desktop sidebar and mobile nav

## Tech Decisions

### Docker-backed dev startup

The root `npm run dev` script starts MongoDB and Redis automatically through Docker Compose so the app can be launched from one command.

### Claude-first, resilient generation

The worker calls Claude with a strict JSON-only prompt and validates the output before saving it. If Claude is unavailable or returns invalid JSON, VedaAI falls back to a local structured generator so the development flow remains end to end and the UI never renders raw model output.

### Embedded question paper on the assignment

The generated paper is stored directly on the assignment document to keep reads simple for the list, detail, paper, and PDF endpoints.

### Redis for both queueing and caching

BullMQ uses Redis for background jobs while the paper endpoint uses Redis caching to reduce repeated database reads and PDF preparation overhead.

### Server-side PDF rendering

`@react-pdf/renderer` keeps PDF generation fully server-side and avoids browser-only dependencies.

## Validation Rules

- Required title, subject, class, and future due date
- At least one enabled question type
- Question counts: `1-50`
- Marks per question: `1-20`
- Upload size limit: `5MB`
- Upload types: `.pdf` and `.txt`

## Verification Performed

The following checks were completed locally:

- `npm run typecheck --workspace backend`
- `npm run typecheck --workspace frontend`
- `npm test --workspace backend`
- `npm test --workspace frontend`
- `npm run build --workspace backend`
- `npm run build --workspace frontend`
- `npm run dev`
- Live API verification for assignment creation, paper generation, PDF export, and websocket progress events

## Notes

- On the first `npm run dev`, Docker may spend time pulling the MongoDB image.
- With a real Claude API key configured, generation uses Claude directly.
- Without a Claude key, development still completes end to end using the resilient local generator path.
