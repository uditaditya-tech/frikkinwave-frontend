import api from "./client";

// GET /api/bands/ — browse active bands (cursor-paginated).
// `params` may include: city, country. `cursorUrl` pages via the absolute next URL.
export async function listBands({ params = {}, cursorUrl = null } = {}) {
  if (cursorUrl) {
    const res = await api.get(cursorUrl);
    return res.data;
  }
  const clean = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== "" && v !== null && v !== undefined) clean[k] = v;
  }
  const res = await api.get("/bands/", { params: clean });
  return res.data; // { next, previous, results: [...] }
}

// GET /api/bands/<slug>/ — public band page (carries the accepted `members` roster).
export async function getBand(slug) {
  const res = await api.get(`/bands/${encodeURIComponent(slug)}/`);
  return res.data;
}

function toWritePayload({ name, bio, city, country }) {
  return { name, bio, city, country };
}

// POST /api/bands/ — create a band (caller becomes owner). Returns the band incl. slug.
export async function createBand(form) {
  const res = await api.post("/bands/", toWritePayload(form));
  return res.data;
}

// PATCH /api/bands/<slug>/ — update own band (owner only).
export async function updateBand(slug, form) {
  const res = await api.patch(`/bands/${encodeURIComponent(slug)}/`, toWritePayload(form));
  return res.data;
}

// DELETE /api/bands/<slug>/ — soft-delete own band (owner only).
export async function deleteBand(slug) {
  await api.delete(`/bands/${encodeURIComponent(slug)}/`);
}

// POST /api/bands/<slug>/invite/ — owner invites a user (by username) to the band.
export async function inviteMember(slug, { memberUsername, role = "" }) {
  const res = await api.post(`/bands/${encodeURIComponent(slug)}/invite/`, {
    member_username: memberUsername,
    role,
  });
  return res.data;
}

// GET /api/bands/memberships/ — the caller's own invites (rows where they're the
// invited member). Cursor-paginated. No box param — owners manage via the band page.
export async function listMyMemberships({ cursorUrl = null } = {}) {
  if (cursorUrl) {
    const res = await api.get(cursorUrl);
    return res.data;
  }
  const res = await api.get("/bands/memberships/");
  return res.data;
}

// POST /api/bands/memberships/<id>/accept/ — invited member accepts (reveals contact).
export async function acceptMembership(id) {
  const res = await api.post(`/bands/memberships/${id}/accept/`);
  return res.data;
}

// POST /api/bands/memberships/<id>/decline/ — invited member declines.
export async function declineMembership(id) {
  const res = await api.post(`/bands/memberships/${id}/decline/`);
  return res.data;
}
