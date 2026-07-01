# CMS E-Commerce Frontend

Next.js frontend for the CMS e-commerce platform. The API lives in a separate repo: [`CMS_backend`](../CMS_backend).

## Prerequisites

- Node.js 20+
- [`CMS_backend`](../CMS_backend) running locally (or a deployed API URL)

## Local development

Run backend and frontend in **two terminals**:

```bash
# Terminal 1 — Backend (CMS_backend)
cd ../CMS_backend
npm install
npm run dev
# http://localhost:5000 — health: GET /api/health
```

```bash
# Terminal 2 — Frontend (this repo)
npm install
cp .env.example .env.local   # then fill in Firebase values
npm run dev
# http://localhost:3000
```

## Environment

Copy [`.env.example`](.env.example) to `.env.local` and set:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | Backend base URL (default `http://localhost:5000`) |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase client auth and storage |
| `NEXT_PUBLIC_BASE_DOMAIN` | Subdomain base for published sites |
| `NEXT_PUBLIC_SITE_HOST` | Host used for site preview links |

On the backend, set `CORS_ORIGIN` and `FRONTEND_URL` to your frontend origin (e.g. `http://localhost:3000`).

## Architecture

- Most API calls go through same-origin Next.js routes under `/api/*`, which proxy to `NEXT_PUBLIC_API_URL` (keeps HttpOnly auth cookies on the frontend domain).
- Socket.IO and the design editor call the backend directly via `NEXT_PUBLIC_API_URL`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (webpack, LAN-friendly) |
| `npm run dev:turbo` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |
