import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as authApi from "../api/auth";
import { setAuthFailureHandler } from "../api/client";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "../lib/tokens";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // "loading" until we've checked for an existing session on first mount.
  const [loading, setLoading] = useState(true);

  const signOut = useCallback(async () => {
    const refresh = getRefreshToken();
    if (refresh) {
      // Best-effort blacklist; ignore failures (already-expired tokens, etc.)
      try {
        await authApi.logout(refresh);
      } catch {
        /* noop */
      }
    }
    clearTokens();
    setUser(null);
  }, []);

  // When a refresh attempt fails inside the axios interceptor, drop the user.
  useEffect(() => {
    setAuthFailureHandler(() => setUser(null));
  }, []);

  // On first load, if we have a token, resolve the current user.
  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      if (!getAccessToken()) {
        setLoading(false);
        return;
      }
      try {
        const me = await authApi.getMe();
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) {
          clearTokens();
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async ({ email, password }) => {
    const tokens = await authApi.login({ email, password });
    setTokens(tokens);
    const me = await authApi.getMe();
    setUser(me);
    return me;
  }, []);

  const signUp = useCallback(async (form) => {
    const tokens = await authApi.register(form);
    setTokens(tokens);
    const me = await authApi.getMe();
    setUser(me);
    return me;
  }, []);

  const value = useMemo(
    () => ({ user, loading, signIn, signUp, signOut, isAuthenticated: !!user }),
    [user, loading, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
