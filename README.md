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

Create your local environment files from the checked-in examples:

- Copy [`backend/.env.example`](/Users/nischithasrinivas/Desktop/vedaiproject/backend/.env.example) to `backend/.env`
- Copy [`frontend/.env.local.example`](/Users/nischithasrinivas/Desktop/vedaiproject/frontend/.env.local.example) to `frontend/.env.local`

Set a real Claude API key in `backend/.env`:

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

## Deployment

### Backend on Vercel

Deploy the `backend` folder as its own Vercel project.

Files added for Vercel:

- [`backend/vercel.json`](/Users/nischithasrinivas/Desktop/vedaiproject/backend/vercel.json)
- [`backend/api/[[...route]].ts`](/Users/nischithasrinivas/Desktop/vedaiproject/backend/api/[[...route]].ts)

Required Vercel environment variables:

```env
MONGODB_URI=your_mongodb_connection_string
REDIS_URL=your_redis_connection_string
# or use Upstash REST in serverless mode instead of REDIS_URL:
UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_rest_token
CLAUDE_API_KEY=your_claude_api_key
FRONTEND_URL=https://your-frontend-domain
SCHOOL_NAME=VedaAI Public School
BACKEND_RUNTIME_MODE=serverless
```

Redis note:

- Local `server` mode still requires `REDIS_URL` because BullMQ workers run over a standard Redis connection.
- Deployed `serverless` mode can use either `REDIS_URL` or the `UPSTASH_REDIS_REST_URL` plus `UPSTASH_REDIS_REST_TOKEN` pair.

Important deployment note:

- Vercel does not support running this app's Socket.io server as a long-lived websocket backend.
- In deployed mode, VedaAI switches to status polling plus persisted progress updates in MongoDB.
- Local development still keeps BullMQ plus Socket.io for the full real-time workflow.
- The hosted deployment is configured for a 4MB upload limit so Vercel request limits do not reject teacher uploads.

Suggested Vercel project settings:

1. Root Directory: `backend`
2. Install Command: `npm install`
3. Build Command: leave default
4. Output setting: leave default for Vercel Functions

### Frontend on Firebase App Hosting

Deploy the `frontend` folder with Firebase App Hosting.

Files added for Firebase:

- [`frontend/apphosting.yaml`](/Users/nischithasrinivas/Desktop/vedaiproject/frontend/apphosting.yaml)

Recommended Firebase App Hosting environment variables:

```env
NEXT_PUBLIC_API_URL=https://your-backend-project.vercel.app
NEXT_PUBLIC_WS_URL=
NEXT_PUBLIC_ENABLE_WS=false
NEXT_PUBLIC_MAX_UPLOAD_MB=4
```

Suggested Firebase App Hosting setup:

1. Create or open a Firebase project
2. Choose App Hosting
3. Connect this GitHub repo
4. Set the app root directory to `frontend`
5. Add the environment variables above
6. Deploy

### Cross-platform support

The deployed app is designed to work as a responsive web application across:

- Windows browsers
- macOS browsers
- Android browsers
- iPhone Safari and other iOS browsers

Mobile-readiness included in this repo:

- Responsive sidebar plus bottom navigation
- Safe-area padding for mobile devices with notches
- Web app manifest and mobile-friendly metadata
- Polling-based progress tracking when websockets are unavailable in hosted environments

## API Documentation

### `GET /api/health`

Returns backend readiness.

Response:

```json
{ "status": "ok", "runtimeMode": "server" }
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

Local development uses Socket.io. Hosted deployments use polling as the primary progress transport.

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

### Dual runtime backend strategy

The backend now supports two runtime modes:

- `server`: local Express plus Socket.io plus BullMQ worker
- `serverless`: Vercel Functions plus background generation through `waitUntil()`

This keeps local development feature-complete while making the hosted backend compatible with Vercel's serverless model.

### Claude-first, resilient generation

The worker calls Claude with a strict JSON-only prompt and validates the output before saving it. If Claude is unavailable or returns invalid JSON, VedaAI falls back to a local structured generator so the development flow remains end to end and the UI never renders raw model output.

### Embedded question paper on the assignment

The generated paper is stored directly on the assignment document to keep reads simple for the list, detail, paper, and PDF endpoints.

### Redis for both queueing and caching

BullMQ uses Redis for background jobs in local mode while the paper endpoint uses Redis caching to reduce repeated database reads and PDF preparation overhead. In Vercel mode, Redis remains available for caching while question generation is scheduled in the serverless background flow.

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
- For deployment, set `BACKEND_RUNTIME_MODE=serverless` on Vercel and `NEXT_PUBLIC_ENABLE_WS=false` on Firebase App Hosting.
