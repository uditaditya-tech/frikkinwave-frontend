import api from "./client";

// GET /api/musicians/instruments/ → [{ id, name, slug }]
export async function listInstruments() {
  const res = await api.get("/musicians/instruments/");
  return res.data;
}

// GET /api/musicians/genres/ → [{ id, name, slug }]
export async function listGenres() {
  const res = await api.get("/musicians/genres/");
  return res.data;
}

// GET /api/musicians/profiles/ — cursor-paginated discovery feed.
// `params` may include: city, country, instrument (slug), genre (slug), available.
// `cursorUrl` is the absolute `next`/`previous` URL returned by the API.
export async function listProfiles({ params = {}, cursorUrl = null } = {}) {
  if (cursorUrl) {
    // The cursor URL is absolute; hit it directly (interceptors still apply).
    const res = await api.get(cursorUrl);
    return res.data;
  }
  const clean = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== "" && v !== null && v !== undefined) clean[k] = v;
  }
  const res = await api.get("/musicians/profiles/", { params: clean });
  return res.data; // { next, previous, results: [...] }
}

// GET /api/musicians/profiles/<username>/
export async function getPublicProfile(username) {
  const res = await api.get(`/musicians/profiles/${encodeURIComponent(username)}/`);
  return res.data;
}

// GET /api/musicians/profile/me/
export async function getMyProfile() {
  const res = await api.get("/musicians/profile/me/");
  return res.data;
}

// Shape the editor state into the write-serializer payload.
function toWritePayload({ bio, city, country, isAvailable, soundUrl, instruments, genres }) {
  return {
    bio,
    city,
    country,
    is_available: isAvailable,
    sound_url: soundUrl,
    // instruments: [{ instrument: <id>, proficiency }]
    instruments: instruments.map((i) => ({
      instrument: i.instrumentId,
      proficiency: i.proficiency,
    })),
    // genres: [<id>, ...]
    genres,
  };
}

// POST /api/musicians/profile/ — create own profile (409 if it exists).
export async function createMyProfile(form) {
  const res = await api.post("/musicians/profile/", toWritePayload(form));
  return res.data;
}

// PATCH /api/musicians/profile/me/ — partial update.
export async function updateMyProfile(form) {
  const res = await api.patch("/musicians/profile/me/", toWritePayload(form));
  return res.data;
}
