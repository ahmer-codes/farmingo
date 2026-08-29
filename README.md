# Farmingo

Farmer assistant SaaS — monitor farms, crop health, disease signals, weather precautions, treatments, and yield. **Not a marketplace.**

## Structure

```
Farmingo/
├── assets/                 # Source image library (kept intact)
├── frontend/               # Nuxt 3 + Vue 3 + TS + Tailwind + Pinia
│   ├── assets/             # App assets + design tokens (CSS)
│   ├── components/         # UI + layout primitives
│   ├── composables/        # Thin store/service accessors
│   ├── layouts/            # auth + default app shell
│   ├── middleware/         # auth / guest guards
│   ├── pages/              # Route shells
│   ├── services/           # API client + domain services
│   ├── stores/             # Pinia
│   └── types/
└── backend/                # Express + TypeScript REST API
    └── src/
        ├── config/
        ├── controllers/
        ├── data/           # Mock data (swap for DB later)
        ├── jobs/
        ├── middleware/
        ├── models/
        ├── routes/
        ├── services/
        └── utils/
```

## Quick start

```bash
# Install
npm run install:all

# Terminal 1 — API (http://localhost:4000)
npm run dev:backend

# Terminal 2 — Web (http://localhost:3000)
npm run dev:frontend
```

### Demo credentials

- Email: `farmer@farmingo.local`
- Password: `farmingo123`

## Environment

Copy `.env.example` files in `frontend/` and `backend/` (local `.env` files are already present for development).

| Variable | Purpose |
|----------|---------|
| `NUXT_PUBLIC_API_BASE_URL` | Frontend → API base |
| `DATABASE_URL` | Future DB connection |
| `JWT_*` | Auth secrets |
| `WEATHER_API_*` | Weather provider |
| `NOTIFICATION_*` | Notification provider |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud (backend only) |
| `CLOUDINARY_API_KEY` | Cloudinary API key (backend only) |
| `CLOUDINARY_API_SECRET` | Cloudinary secret — **never** expose to Nuxt |

## Current phase

Full farmer workspace: auth, dashboard, farm/crops/yield, crop health assessment (AI-assisted), tasks, weather, and notifications. External GIS/satellite and push channels remain extensible.
