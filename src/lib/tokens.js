// Token persistence. Access + refresh JWTs live in localStorage so a page
// reload keeps you signed in. (Trade-off: XSS-readable. Acceptable for a
// portfolio app; revisit with httpOnly cookies if this carries real PII.)

const ACCESS_KEY = "fw.access";
const REFRESH_KEY = "fw.refresh";

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens({ access, refresh }) {
  if (access) localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}
