import axios from "axios";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "../lib/tokens";

const baseURL = `${import.meta.env.VITE_API_BASE_URL || ""}/api`;

const api = axios.create({ baseURL });

// Attach the access token to every request.
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Refresh-on-401 handling -------------------------------------------------
// When a request 401s, try once to rotate the refresh token, then replay the
// original request. Concurrent 401s share a single in-flight refresh.

let refreshPromise = null;

// Called by AuthContext so a forced logout can clear React state too.
let onAuthFailure = () => {};
export function setAuthFailureHandler(fn) {
  onAuthFailure = fn;
}

function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  const refresh = getRefreshToken();
  if (!refresh) return Promise.reject(new Error("no refresh token"));

  // Bare axios (not `api`) to avoid the interceptor recursing.
  refreshPromise = axios
    .post(`${baseURL}/auth/token/refresh/`, { refresh })
    .then((res) => {
      // simplejwt with ROTATE_REFRESH_TOKENS returns a new refresh too.
      setTokens({ access: res.data.access, refresh: res.data.refresh });
      return res.data.access;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    // Don't try to refresh the refresh call itself, or non-401s, or retries.
    const isRefreshCall = original?.url?.includes("/auth/token/refresh/");
    if (status !== 401 || original?._retry || isRefreshCall) {
      return Promise.reject(error);
    }

    original._retry = true;
    try {
      const access = await refreshAccessToken();
      original.headers.Authorization = `Bearer ${access}`;
      return api(original);
    } catch (refreshError) {
      clearTokens();
      onAuthFailure();
      return Promise.reject(refreshError);
    }
  }
);

export default api;

// Normalises a DRF error payload into a single human string.
export function apiErrorMessage(error, fallback = "Something went wrong.") {
  const data = error?.response?.data;
  if (!data) return error?.message || fallback;
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  // Field errors: { field: ["msg", ...], ... }
  const parts = [];
  for (const [key, val] of Object.entries(data)) {
    const msg = Array.isArray(val) ? val.join(" ") : String(val);
    parts.push(key === "non_field_errors" ? msg : `${key}: ${msg}`);
  }
  return parts.length ? parts.join(" • ") : fallback;
}
