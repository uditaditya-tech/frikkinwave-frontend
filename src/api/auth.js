import api from "./client";

// POST /api/auth/register/ → { access, refresh }
export async function register({ email, username, password, passwordConfirm }) {
  const res = await api.post("/auth/register/", {
    email,
    username,
    password,
    password_confirm: passwordConfirm,
  });
  return res.data;
}

// POST /api/auth/token/ → { access, refresh }
export async function login({ email, password }) {
  const res = await api.post("/auth/token/", { email, password });
  return res.data;
}

// POST /api/auth/logout/ — blacklist the refresh token. 204 No Content.
export async function logout(refresh) {
  await api.post("/auth/logout/", { refresh });
}

// GET /api/auth/me/ → { id, email, username, date_joined }
export async function getMe() {
  const res = await api.get("/auth/me/");
  return res.data;
}
