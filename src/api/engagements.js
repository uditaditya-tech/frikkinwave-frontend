import api from "./client";

// POST /api/engagements/ — send a hire request to a musician (by username).
export async function sendEngagement({
  musicianUsername,
  message = "",
  proposedDate = "",
  rateOffer = "",
}) {
  const res = await api.post("/engagements/", {
    musician_username: musicianUsername,
    message,
    proposed_date: proposedDate || null,
    rate_offer: rateOffer,
  });
  return res.data;
}

// GET /api/engagements/?box=incoming|outgoing — cursor-paginated.
// incoming = requests to hire you; outgoing = requests you've sent.
export async function listEngagements({ box = "incoming", cursorUrl = null } = {}) {
  if (cursorUrl) {
    const res = await api.get(cursorUrl);
    return res.data;
  }
  const res = await api.get("/engagements/", { params: { box } });
  return res.data;
}

// GET /api/engagements/<id>/
export async function getEngagement(id) {
  const res = await api.get(`/engagements/${id}/`);
  return res.data;
}

// POST /api/engagements/<id>/accept/ — the hired musician accepts (reveals contact).
export async function acceptEngagement(id) {
  const res = await api.post(`/engagements/${id}/accept/`);
  return res.data;
}

// POST /api/engagements/<id>/decline/ — the hired musician declines.
export async function declineEngagement(id) {
  const res = await api.post(`/engagements/${id}/decline/`);
  return res.data;
}

// POST /api/engagements/<id>/complete/ — either party marks an accepted request done.
export async function completeEngagement(id) {
  const res = await api.post(`/engagements/${id}/complete/`);
  return res.data;
}
