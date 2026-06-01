import api from "./client";

// POST /api/connections/requests/ — send a contact request by username.
export async function sendRequest({ recipientUsername, message = "" }) {
  const res = await api.post("/connections/requests/", {
    recipient_username: recipientUsername,
    message,
  });
  return res.data;
}

// GET /api/connections/requests/?box=incoming|outgoing
// Cursor-paginated: returns { next, previous, results: [...] }.
// `cursorUrl` is the absolute `next`/`previous` URL when paging.
export async function listRequests({ box = "incoming", cursorUrl = null } = {}) {
  if (cursorUrl) {
    const res = await api.get(cursorUrl);
    return res.data;
  }
  const res = await api.get("/connections/requests/", { params: { box } });
  return res.data;
}

// GET /api/connections/requests/<id>/
export async function getRequest(id) {
  const res = await api.get(`/connections/requests/${id}/`);
  return res.data;
}

// POST /api/connections/requests/<id>/accept/
export async function acceptRequest(id) {
  const res = await api.post(`/connections/requests/${id}/accept/`);
  return res.data;
}

// POST /api/connections/requests/<id>/decline/
export async function declineRequest(id) {
  const res = await api.post(`/connections/requests/${id}/decline/`);
  return res.data;
}
