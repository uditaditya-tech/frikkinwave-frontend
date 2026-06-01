# frikkinwave — frontend

The web client for **frikkinwave**, a global social network for musicians and
live-shows professionals. Find jam partners, bandmates, and session musicians
by instrument, genre, and city.

React SPA (Vite) talking to the Django/DRF backend at
`https://api.frikkinwave.com`. Deployed on Vercel at **frikkinwave.com**.

> **New to this repo?** Read [`CLAUDE.md`](CLAUDE.md) first — it has the fast
> orientation (architecture, live-deploy reality, the API contract, and the
> DNS/CORS gotchas) so you don't have to read the whole tree.

**Live status:** in production at **https://frikkinwave.com** (SSL via Vercel).
Currently deployed **manually via the Vercel CLI** (`vercel --prod`) — there is
no GitHub auto-deploy yet, so pushing to `main` does not ship. See
"[Deploying to Vercel](#deploying-to-vercel)".

---

## Stack

| Layer | Choice |
|---|---|
| Framework | React 18 + Vite 5 (SPA) |
| Routing | react-router-dom v6 |
| HTTP | axios (with JWT refresh interceptor) |
| Styling | Tailwind CSS v3 |
| Auth | JWT (access + refresh) in `localStorage`, auto-rotated on 401 |
| Hosting | Vercel |

---

## What it covers (Phase 1)

- **Auth** — register, log in, log out (refresh-token blacklist). Session
  survives reload; access tokens auto-refresh on 401.
- **Discover** — browse/filter musician profiles by city, country, instrument,
  genre, and availability. Cursor-paginated ("Load more").
- **Public profiles** — `/u/:username`, with instruments + proficiency, genres,
  location, and availability.
- **Profile editor** — create/edit your own profile: bio, location,
  availability, instruments (with proficiency), and genres.
- **Contact requests** — send a request from a profile; manage incoming /
  outgoing; accept / decline. Contact email is revealed to both parties once a
  request is accepted.

---

## Local development

Requires the backend running locally (`http://localhost:8000`). See the backend
repo's `CODEBASE.md` ("Running locally").

```bash
npm install
npm run dev          # → http://localhost:5173
```

`npm run dev` reads `.env.development` (`VITE_API_BASE_URL=http://localhost:8000`).

```bash
npm run build        # production build → dist/
npm run preview      # serve the build locally
npm run lint
```

---

## Environment

One variable, the API base URL **without a trailing slash**:

| Env | File / source | Value |
|---|---|---|
| dev | `.env.development` | `http://localhost:8000` |
| prod | `.env.production` / Vercel | `https://api.frikkinwave.com` |

The axios client appends `/api` itself (`src/api/client.js`).

---

## Deploying to Vercel

**How it's deployed today (CLI, manual).** The Vercel project is already created
and linked (`.vercel/`, git-ignored); deploys are run by hand:

```bash
vercel --prod        # builds + ships to production, aliases frikkinwave.com
```
`VITE_API_BASE_URL` is set as a Production env var in the Vercel project (and is
inlined at build time — change it ⇒ redeploy). `vercel.json` rewrites all paths
to `index.html`, so client routes (`/u/:username`, `/profile`, …) survive hard refresh.

**To switch to auto-deploy on push** (optional): in the Vercel dashboard → **Add
New → Project → Import `uditaditya-tech/frikkinwave-frontend`**. It detects the
existing project and the Vite preset; thereafter every push to `main` deploys.

### Custom domain (GoDaddy → Vercel)

The domain is registered at **GoDaddy** (`ns*.domaincontrol.com`). In Vercel add
`frikkinwave.com` + `www.frikkinwave.com` to the project, then set these records
in GoDaddy → DNS:

| Type | Name | Data |
|---|---|---|
| `A` | `@` | `76.76.21.21` |
| `CNAME` | `www` | `cname.vercel-dns.com` |

- A domain with **no apex `A` record** serves GoDaddy's free "parked" lander —
  adding the `A` record removes it.
- **Leave the four `api` `NS` records (`*.awsdns-*`) alone** — `api.frikkinwave.com`
  is delegated to AWS Route 53 → the backend ALB.
- After changes, your *own* machine may cache the old parked page until TTL (~1h)
  clears; verify the real state with
  `curl --resolve frikkinwave.com:443:76.76.21.21 https://frikkinwave.com/`.

### CORS (backend side)

The backend allowlist (`CORS_ALLOWED_ORIGINS`) must include this origin — in
production it's set to:

```
CORS_ALLOWED_ORIGINS=https://frikkinwave.com,https://www.frikkinwave.com
```

⚠️ The `*.vercel.app` deployment URL is **not** in the allowlist, so its API calls
are CORS-blocked (the app loads but shows no data). Use the custom domain — or, to
allow `*.vercel.app`/preview URLs, widen the backend `cors_allowed_origins` tfvar
and redeploy ECS.

---

## Backend endpoints this client depends on

Standard Phase 1 endpoints, **plus** these added to support the client (see the
backend repo). They must be deployed for the profile editor and identity to work:

| Method | URL | Why the frontend needs it |
|---|---|---|
| `GET` | `/api/auth/me/` | Resolve current user (username, email) after login |
| `GET` | `/api/musicians/instruments/` | Populate instrument pickers/filters |
| `GET` | `/api/musicians/genres/` | Populate genre pickers/filters |

The shared profile read serializer also now returns `username` on every profile
(needed to link discovery cards → public profiles → contact requests).

---

## Project structure

```
src/
├── api/            # one module per backend area; client.js holds the axios
│   ├── client.js   #   instance + JWT refresh interceptor + error formatter
│   ├── auth.js
│   ├── musicians.js
│   └── connections.js
├── context/
│   └── AuthContext.jsx   # session state, sign in/up/out, bootstrap on load
├── components/     # Navbar, ProfileCard, ProtectedRoute, Spinner
├── pages/          # Discover, Login, Register, PublicProfile,
│   │               #   EditProfile, Requests, NotFound
├── lib/tokens.js   # localStorage token helpers
├── App.jsx         # routes
├── main.jsx        # entry (Router + AuthProvider)
└── index.css       # Tailwind + component classes (.btn, .card, .chip, …)
```
