# frikkinwave — frontend

The web client for **frikkinwave**, a global social network for musicians and
live-shows professionals. Find jam partners, bandmates, and session musicians
by instrument, genre, and city.

React SPA (Vite) talking to the Django/DRF backend at
`https://api.frikkinwave.com`. Deployed on Vercel at **frikkinwave.com**.

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

1. Push this repo to GitHub.
2. In Vercel: **New Project** → import the repo. Framework preset is detected as
   **Vite** (also pinned in `vercel.json`). Build command `npm run build`,
   output `dist`.
3. **Environment Variables** → add `VITE_API_BASE_URL = https://api.frikkinwave.com`
   (Production, and Preview if you want previews hitting prod).
4. **Domains** → add `frikkinwave.com` (and `www`). Point the apex/CNAME records
   as Vercel instructs. (The `api.` subdomain stays on AWS Route 53 → ALB.)
5. Deploy. `vercel.json` rewrites all paths to `index.html` so client-side
   routes (`/u/:username`, `/profile`, …) work on hard refresh.

### CORS (backend side)

The backend must allow this origin. It already reads `CORS_ALLOWED_ORIGINS`
from env — ensure the production value includes:

```
CORS_ALLOWED_ORIGINS=https://frikkinwave.com,https://www.frikkinwave.com
```

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
