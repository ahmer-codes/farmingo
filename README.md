# Farmingo

Farmingo is a farmer assistant SaaS for monitoring farms, tracking crop health, spotting disease signals, planning treatments, watching weather risks, and logging yield. It is **not** a marketplace.

The app pairs a Nuxt 3 web client with an Express REST API. Firebase Authentication handles sign-in on the client; the API verifies Firebase ID tokens and persists data in **Firestore** via the Firebase Admin SDK. Image uploads go through **Cloudinary** on the server.

## Features

### Farmer workspace

- **Dashboard** with farm and crop summaries
- **Farm & fields** management
- **Crop catalog** and per-farm crop tracking
- **Crop health** assessments (AI-assisted image analysis)
- **Disease detection** with scan history
- **Tasks & treatments** with due dates and reminders
- **Weather** forecasts and risk-based precautions
- **Yield logging** and trends
- **In-app notifications**
- **Support chat** with the admin team (REST polling)

### Admin console

- User management and role assignment
- Farms, crops, disease catalog, tasks, and yield oversight
- Support inbox with per-user chat threads
- Bootstrap scripts for creating or promoting admin accounts

## Tech stack

| Layer | Technologies |
|-------|----------------|
| Frontend | Nuxt 3, Vue 3, TypeScript, Tailwind CSS, Pinia, Firebase client SDK |
| Backend | Express, TypeScript, Zod, Firebase Admin SDK, Cloudinary, node-cron |
| Data | Firestore |
| Auth | Firebase Authentication (email/password) |
| Media | Cloudinary (server-side uploads) |
| Weather | Open-Meteo by default; OpenWeatherMap optional |

## Architecture

```
Browser
  │
  ├─► Nuxt 3 (port 3000)
  │     Firebase Auth (client) ──► ID token
  │     REST calls with Bearer token
  │
  └─► Express API (port 4000, mounted at /api)
        ├─► Firestore (Admin SDK)
        ├─► Cloudinary (image uploads)
        ├─► Open-Meteo / OpenWeatherMap (weather)
        └─► node-cron (background jobs in the same process)
```

Background jobs (task reminders, weather alerts, yield nudges, support auto-replies) run inside the Express process. The API host must stay **always on** for cron to work reliably.

## Project structure

```
Farmingo/
├── frontend/                 # Nuxt 3 app
│   ├── components/           # UI, layout, admin shell
│   ├── composables/
│   ├── layouts/              # default, auth, admin
│   ├── middleware/           # auth / guest guards
│   ├── pages/                # farmer + admin routes
│   ├── services/             # API client and domain services
│   ├── stores/               # Pinia
│   └── types/
├── backend/                  # Express API
│   ├── scripts/              # admin bootstrap, migrations
│   └── src/
│       ├── config/           # env, Firebase Admin, Cloudinary
│       ├── controllers/
│       ├── middleware/
│       ├── routes/
│       ├── services/         # weather, notifications, support, etc.
│       └── utils/
├── firestore.rules           # Firestore security rules
├── firestore.indexes.json
└── firebase.json             # Firebase CLI config (rules + indexes)
```

## Prerequisites

- **Node.js** 20+ (22 recommended)
- A **Firebase** project with Authentication (Email/Password) and Firestore enabled
- A **Cloudinary** account (cloud name, API key, secret)
- Firebase **service account** credentials for the backend (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`)

## Local development

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Configure environment

Copy the example env files and fill in your values:

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

See [Environment variables](#environment-variables) below.

### 3. Deploy Firestore rules and indexes (first time)

Install the [Firebase CLI](https://firebase.google.com/docs/cli), log in, and point it at your project:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

Add `localhost` (and your production domains) under **Firebase Console → Authentication → Settings → Authorized domains**.

### 4. Run the apps

Use two terminals:

```bash
# Terminal 1 — API at http://localhost:4000
npm run dev:backend

# Terminal 2 — Web at http://localhost:3000
npm run dev:frontend
```

Health check: `GET http://localhost:4000/api/health`

### 5. Create an admin user

Register a normal account in the app, then promote it from the backend directory:

```bash
cd backend
ADMIN_BOOTSTRAP_EMAILS=you@example.com npm run grant-admin -- you@example.com
```

To create a brand-new admin account (email + password) in one step:

```bash
ADMIN_BOOTSTRAP_EMAILS=you@example.com npm run create-admin -- you@example.com --name "Your Name"
```

The email must appear in `ADMIN_BOOTSTRAP_EMAILS` (comma-separated list in backend `.env` or inline as above).

## Environment variables

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `NUXT_PUBLIC_API_BASE_URL` | API base URL **including** `/api` (e.g. `http://localhost:4000/api`) |
| `NUXT_PUBLIC_FIREBASE_API_KEY` | Firebase web API key |
| `NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | e.g. `your-project.firebaseapp.com` |
| `NUXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `NUXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |

All `NUXT_PUBLIC_*` values are embedded at build time. Set them in your hosting provider before running `nuxt build`.

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Listen port (default `4000`; Render injects `PORT`) |
| `NODE_ENV` | No | `development` \| `production` |
| `CORS_ORIGIN` | Yes (prod) | Exact frontend origin, e.g. `https://your-app.vercel.app` |
| `FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Yes | Service account client email |
| `FIREBASE_PRIVATE_KEY` | Yes | Service account private key (use `\n` for newlines in env) |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary secret (server only) |
| `WEATHER_PROVIDER` | No | `openmeteo` (default) or `openweathermap` |
| `WEATHER_API_KEY` | If OWM | Required when `WEATHER_PROVIDER=openweathermap` |
| `NOTIFICATION_TIMEZONE` | No | IANA timezone for cron (default `Asia/Karachi`) |
| `ADMIN_BOOTSTRAP_EMAILS` | For scripts | Comma-separated emails allowed for admin bootstrap |

Never expose `FIREBASE_PRIVATE_KEY`, `CLOUDINARY_API_SECRET`, or other server secrets to the Nuxt client.

## API overview

All routes are under `/api`. The frontend sends `Authorization: Bearer <Firebase ID token>` on authenticated requests.

| Prefix | Purpose |
|--------|---------|
| `/api/health` | Health check |
| `/api/auth` | Session profile, registration hooks |
| `/api/farm`, `/api/fields` | Farm and field data |
| `/api/crops`, `/api/yields` | Crops and yield records |
| `/api/disease` | Disease catalog and detection |
| `/api/tasks` | Tasks and treatments |
| `/api/weather` | Weather snapshots and risks |
| `/api/notifications` | User notifications |
| `/api/support` | Support chat threads and messages |
| `/api/uploads` | Image uploads (Cloudinary) |
| `/api/admin` | Admin-only operations |

## Deployment

A typical production setup:

| Service | Role |
|---------|------|
| **Vercel** (or similar) | Nuxt frontend (`frontend/`) |
| **Render** (or similar always-on host) | Express API (`backend/`) |
| **Firebase** | Auth + Firestore |
| **Cloudinary** | Image storage |

### Frontend (e.g. Vercel)

- Root directory: `frontend`
- Build command: `npm run build`
- Output: Nitro server (`.output/server/index.mjs`) or static, depending on your Nuxt preset
- Set all `NUXT_PUBLIC_*` variables before build
- Production API URL example: `NUXT_PUBLIC_API_BASE_URL=https://your-api.onrender.com/api`

### Backend (e.g. Render)

- Root directory: `backend`
- Build: `npm run build`
- Start: `npm start` → `node dist/index.js`
- Set `NODE_ENV=production`, `CORS_ORIGIN` to your exact Vercel URL (no trailing slash), Firebase Admin vars, and Cloudinary vars
- Use a plan that keeps the process running so cron jobs execute

### Firebase

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

Add your production frontend domain to Firebase Auth authorized domains.

## Scripts

From the repo root:

| Command | Description |
|---------|-------------|
| `npm run install:all` | Install frontend and backend dependencies |
| `npm run dev:frontend` | Start Nuxt dev server |
| `npm run dev:backend` | Start Express with hot reload |
| `npm run build` | Build both apps |

From `backend/`:

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run production API |
| `npm run create-admin` | Create admin user (with allowlist) |
| `npm run grant-admin` | Promote existing user to admin |

## License

Private project. All rights reserved unless a license file is added.
