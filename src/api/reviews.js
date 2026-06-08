import api from "./client";

// Phase 5 Block C — ratings + reviews. A review is gated on a COMPLETED
// engagement between author and subject (the backend rejects otherwise).

// POST /api/reviews/ — leave a 1–5★ review for `subjectUsername`, keyed to the
// completed engagement that authorises it.
export async function createReview({ subjectUsername, engagementId, rating, comment = "" }) {
  const res = await api.post("/reviews/", {
    subject_username: subjectUsername,
    engagement_id: engagementId,
    rating,
    comment,
  });
  return res.data;
}

// GET /api/reviews/<username>/ — public reviews a user received (cursor-paginated).
export async function listReviews(username, { cursorUrl = null } = {}) {
  const res = await api.get(cursorUrl || `/reviews/${username}/`);
  return res.data;
}

// GET /api/reviews/<username>/summary/ — public { average_rating, count }.
export async function getReviewSummary(username) {
  const res = await api.get(`/reviews/${username}/summary/`);
  return res.data;
}
