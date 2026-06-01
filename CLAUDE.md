# CLAUDE.md — frikkinwave frontend

Orientation for a new session. Read **this + `README.md`** to get full context —
you should not need to read the whole tree.

## What this is

React 18 + Vite SPA for **frikkinwave**, a social network for musicians (find jam
partners / bandmates / session players). It is a pure client that talks to a
separate Django/DRF backend over HTTPS. **Live at https://frikkinwave.com** (Vercel).

## Two-repo project — both checked out locally

| Repo | Path | Hosts | Deploys to |
|---|---|---|---|
| Frontend (this) | `~/Desktop/frikkinwave/frikkinwave-frontend` | the SPA | Vercel → `frikkinwave.com` |
| Backend | `~/Desktop/frikkinwave/frikkinwave-backend` | Django/DRF API | AWS ECS → `api.frikkinwave.com` |

The **backend repo is the source of truth for the API + infra.** Read its docs
rather than guessing: `PROJECT.md`, `CODEBASE.md` (endpoint table), `DATAMODEL.md`,
`ROADMAP.md`, `CLAUDE.md`, and `infra/README.md` (AWS/Terraform).

## Stack & layout

Vite 5 · React 18 · react-router v6 · Tailwind v3 · axios. File map is in
`README.md` → "Project structure". The pieces that matter:
- `src/api/*` — one module per backend area. `client.js` = the axios instance +
  the **JWT refresh-on-401 interceptor** + `apiErrorMessage()` (DRF error formatter).
- `src/context/AuthContext.jsx` — session state (sign in/up/out, bootstrap from
  stored tokens, `/auth/me` resolution). Tokens live in `localStorage` (`src/lib/tokens.js`).
- `src/pages/*` — Discover (browse/filter), Login, Register, PublicProfile
  (`/u/:username`), EditProfile (create+edit own), Requests (incoming/outgoing), NotFound.
- `ProtectedRoute` gates `/profile` and `/requests`.

## Run locally

Needs the backend at `http://localhost:8000` (backend `CODEBASE.md` → "Running locally").
```bash
npm install
npm run dev        # → localhost:5173, uses .env.development
npm run build      # production build → dist/
npm run lint
```

## Env (one variable, build-time)

`VITE_API_BASE_URL` — backend base URL, **no trailing slash** (`client.js` appends `/api`).
- dev → `http://localhost:8000` (`.env.development`)
- prod → `https://api.frikkinwave.com` (`.env.production` + Vercel project env var)

It is **inlined at build time** by Vite, so **changing it requires a rebuild/redeploy** —
it is NOT read at runtime.

## Deploy — current reality

Deployed via the **Vercel CLI, manually**: `vercel --prod` (project is linked via
`.vercel/`, which is git-ignored). The CLI is authenticated as `uditaditya-tech`.

- **Pushing to `main` does NOT auto-deploy** — there's no Git integration yet. To get
  push-to-deploy, import the repo in the Vercel dashboard (it'll detect the existing project).
- GitHub: `uditaditya-tech/frikkinwave-frontend` (default branch `main`).
- SPA routing on Vercel works via `vercel.json` (rewrites all paths → `index.html`).
- SSL is auto (Vercel/Let's Encrypt).

## Backend API contract (what this client calls)

Base: `https://api.frikkinwave.com/api`. JWT (access+refresh, refresh rotation+blacklist).
Auth: `POST /auth/register/`, `POST /auth/token/`, `POST /auth/token/refresh/`,
`POST /auth/logout/`, `GET /auth/me/`. Musicians: `GET /musicians/instruments/`,
`GET /musicians/genres/`, `GET /musicians/profiles/` (cursor-paginated, filters:
city/country/instrument/genre/available), `GET /musicians/profiles/<username>/`,
`POST /musicians/profile/`, `GET|PATCH /musicians/profile/me/`. Connections:
`POST /connections/requests/`, `GET /connections/requests/?box=incoming|outgoing`
(cursor-paginated), `GET|.../accept/|.../decline/`.

> `/auth/me/`, `/musicians/instruments/`, `/musicians/genres/`, and the `username`
> field on profile responses were **added to the backend to support this client**
> (backend PR #1). They must be deployed for the editor/identity to work.

## Gotchas (learned the hard way — don't rediscover these)

- **CORS allowlist is the custom domain only.** Backend allows `https://frikkinwave.com`
  and `https://www.frikkinwave.com`. The `*.vercel.app` deployment URL is **NOT** allowed,
  so its API calls are CORS-blocked (app loads but no data). Always test on the custom
  domain. To allow `*.vercel.app` / preview URLs, widen the backend `cors_allowed_origins`
  tfvar and redeploy ECS.
- **Domain is on GoDaddy** (`ns*.domaincontrol.com`). Apex `frikkinwave.com`: `A @ → 76.76.21.21`;
  `www`: `CNAME → cname.vercel-dns.com`. A domain with **no apex `A` record** shows GoDaddy's
  free "parked" lander (`/lander`) — adding the `A` record removes it. `api.frikkinwave.com`
  is delegated to Route 53 (its 4 `awsdns` NS records — **don't touch them**).
- **Local DNS cache lies.** After DNS changes your own machine may keep showing the old
  parked page until the TTL (~1h) clears. Verify the truth with:
  `curl --resolve frikkinwave.com:443:76.76.21.21 https://frikkinwave.com/`.
- **Backend infra is ephemeral.** The AWS app stack gets `terraform destroy`'d between
  work sessions. If `api.frikkinwave.com` is down (HTTP 000 / no DNS), the backend needs
  **recreating** — see backend `infra/README.md` ("App deploy"): `terraform apply` →
  `push-image.sh` → `run-migrations.sh` → force ECS deploy.

## Verify it's live end-to-end

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://frikkinwave.com/          # 200, serves app
curl -H "Origin: https://frikkinwave.com" \
     https://api.frikkinwave.com/api/musicians/instruments/                # ACAO header + 44 instruments
```
