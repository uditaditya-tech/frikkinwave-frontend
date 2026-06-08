import api from "./client";

// GET /api/venues/ — browse active venues (cursor-paginated).
// `params` may include: city, country. `cursorUrl` pages via the absolute next URL.
export async function listVenues({ params = {}, cursorUrl = null } = {}) {
  if (cursorUrl) {
    const res = await api.get(cursorUrl);
    return res.data;
  }
  const clean = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== "" && v !== null && v !== undefined) clean[k] = v;
  }
  const res = await api.get("/venues/", { params: clean });
  return res.data; // { next, previous, results: [...] }
}

// GET /api/venues/<slug>/ — public venue page.
export async function getVenue(slug) {
  const res = await api.get(`/venues/${encodeURIComponent(slug)}/`);
  return res.data;
}

function toWritePayload({ name, description, address, city, country, capacity, website }) {
  return {
    name,
    description,
    address,
    city,
    country,
    // IntegerField(allow_null): "" → null so the backend clears it.
    capacity: capacity === "" || capacity === null || capacity === undefined ? null : Number(capacity),
    website,
  };
}

// POST /api/venues/ — create a venue (caller becomes owner). Returns the venue incl. slug.
export async function createVenue(form) {
  const res = await api.post("/venues/", toWritePayload(form));
  return res.data;
}

// PATCH /api/venues/<slug>/ — update own venue (owner only).
export async function updateVenue(slug, form) {
  const res = await api.patch(`/venues/${encodeURIComponent(slug)}/`, toWritePayload(form));
  return res.data;
}

// DELETE /api/venues/<slug>/ — soft-delete own venue (owner only).
export async function deleteVenue(slug) {
  await api.delete(`/venues/${encodeURIComponent(slug)}/`);
}
