# Resume Builder — backend

A small Express + PostgreSQL API that lets the React app save resumes to a
database and load them back by id, instead of only keeping them in the
browser's localStorage.

No user accounts: a resume's id (an unguessable UUID) is what you share to
let someone reopen/edit it — the same trust model as a Google Docs
"anyone with the link" share.

## Endpoints

| Method | Path              | Body                                         | Description              |
|--------|-------------------|-----------------------------------------------|---------------------------|
| POST   | `/api/resumes`     | `{ resume, sectionOrder, hiddenSections }`   | Create a resume, returns its `id` |
| GET    | `/api/resumes/:id` | —                                             | Fetch a resume            |
| PUT    | `/api/resumes/:id` | `{ resume, sectionOrder, hiddenSections }`   | Overwrite a resume        |
| DELETE | `/api/resumes/:id` | —                                             | Delete a resume           |

## Local development

Requires a local PostgreSQL instance.

```bash
cd server
cp .env.example .env   # edit DATABASE_URL if your local Postgres differs
npm install
npm run dev
```

The server creates its `resumes` table automatically on first start.

## Deploying (Railway — easiest option)

1. Push this repo to GitHub (if it isn't already there).
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → pick this repo.
3. When asked for the root directory, set it to `server` (since the repo also contains the frontend).
4. Add a database: **New** → **Database** → **PostgreSQL**. Railway automatically
   sets `DATABASE_URL` as an environment variable on your backend service —
   no manual configuration needed.
5. Once deployed, Railway gives you a public URL like
   `https://your-service.up.railway.app`. Use that as `VITE_API_URL` when
   building the frontend (see the root `.env.example`).

Other hosts (Render, Fly.io, a VPS) work the same way: set `DATABASE_URL` to
a reachable Postgres instance and `PORT` if the platform requires a specific
one; everything else is standard Node/Express.

## CORS

`cors()` is enabled with no origin restriction, since there's no auth to
protect — any origin can call the API using a resume's id. If you'd rather
restrict it to just your deployed frontend's domain, change
`app.use(cors())` in `index.js` to
`app.use(cors({ origin: 'https://your-frontend-domain' }))`.
