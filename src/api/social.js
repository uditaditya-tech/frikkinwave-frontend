import api from "./client";

// Phase 5 Block A — follow graph. Follow edges are public; follow/unfollow are
// idempotent on the backend (re-follow = 200 no-op, unfollow-missing = 204).

// POST /api/social/follow/<username>/ — follow a user.
export async function followUser(username) {
  const res = await api.post(`/social/follow/${username}/`);
  return res.data;
}

// DELETE /api/social/follow/<username>/ — unfollow a user.
export async function unfollowUser(username) {
  await api.delete(`/social/follow/${username}/`);
}

// GET /api/social/following/ — users the caller follows (cursor-paginated).
export async function listFollowing({ cursorUrl = null } = {}) {
  const res = await api.get(cursorUrl || "/social/following/");
  return res.data;
}

// GET /api/social/followers/ — users following the caller (cursor-paginated).
export async function listFollowers({ cursorUrl = null } = {}) {
  const res = await api.get(cursorUrl || "/social/followers/");
  return res.data;
}

// GET /api/social/<username>/following/ — public list of who a user follows.
export async function listUserFollowing(username, { cursorUrl = null } = {}) {
  const res = await api.get(cursorUrl || `/social/${username}/following/`);
  return res.data;
}

// GET /api/social/<username>/followers/ — public list of a user's followers.
export async function listUserFollowers(username, { cursorUrl = null } = {}) {
  const res = await api.get(cursorUrl || `/social/${username}/followers/`);
  return res.data;
}

// GET /api/social/feed/ — activity from followed users (+ self), newest first.
// Rows: { id, actor_username, verb, summary, target_type, target_id, target_slug, created_at }
export async function getFeed({ cursorUrl = null } = {}) {
  const res = await api.get(cursorUrl || "/social/feed/");
  return res.data;
}
