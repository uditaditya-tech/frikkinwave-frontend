import api from "./client";

// The board's three posting types (mirrors Listing.ListingType on the backend).
export const LISTING_TYPES = [
  { value: "gig", label: "Gig" },
  { value: "audition", label: "Audition" },
  { value: "venue", label: "Venue" },
];

// GET /api/listings/ — browse active listings (cursor-paginated).
// `params` may include: type, city, country.
// `cursorUrl` is the absolute `next`/`previous` URL returned by the API.
export async function listListings({ params = {}, cursorUrl = null } = {}) {
  if (cursorUrl) {
    const res = await api.get(cursorUrl);
    return res.data;
  }
  const clean = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== "" && v !== null && v !== undefined) clean[k] = v;
  }
  const res = await api.get("/listings/", { params: clean });
  return res.data; // { next, previous, results: [...] }
}

// GET /api/listings/<id>/ — public single active listing.
export async function getListing(id) {
  const res = await api.get(`/listings/${id}/`);
  return res.data;
}

// Shape the editor state into the create/update body.
function toWritePayload({
  listingType,
  title,
  description,
  city,
  country,
  isPaid,
  payDescription,
  deadline,
}) {
  return {
    listing_type: listingType,
    title,
    description,
    city,
    country,
    is_paid: isPaid,
    pay_description: payDescription,
    // DateField wants YYYY-MM-DD or null; an empty input means "no deadline".
    deadline: deadline || null,
  };
}

// POST /api/listings/ — post a listing (author = caller).
export async function createListing(form) {
  const res = await api.post("/listings/", toWritePayload(form));
  return res.data;
}

// PATCH /api/listings/<id>/ — update own listing (author only).
export async function updateListing(id, form) {
  const res = await api.patch(`/listings/${id}/`, toWritePayload(form));
  return res.data;
}

// DELETE /api/listings/<id>/ — soft-delete own listing (author only).
export async function deleteListing(id) {
  await api.delete(`/listings/${id}/`);
}

// POST /api/listings/<id>/apply/ — apply to a listing.
export async function applyToListing(id, { message = "" } = {}) {
  const res = await api.post(`/listings/${id}/apply/`, { message });
  return res.data;
}

// GET /api/listings/applications/?box=incoming|outgoing — cursor-paginated.
// incoming = applications to your listings; outgoing = applications you sent.
export async function listApplications({ box = "incoming", cursorUrl = null } = {}) {
  if (cursorUrl) {
    const res = await api.get(cursorUrl);
    return res.data;
  }
  const res = await api.get("/listings/applications/", { params: { box } });
  return res.data;
}

// POST /api/listings/applications/<id>/accept/ — listing author accepts.
export async function acceptApplication(id) {
  const res = await api.post(`/listings/applications/${id}/accept/`);
  return res.data;
}

// POST /api/listings/applications/<id>/decline/ — listing author declines.
export async function declineApplication(id) {
  const res = await api.post(`/listings/applications/${id}/decline/`);
  return res.data;
}
