import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  browserLocalPersistence,
  getRedirectResult,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let unsub = null;
    let cancelled = false;

    (async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);

        // Conclui o redirect (se houver)
        try {
          const res = await getRedirectResult(auth);
          if (res?.user && !cancelled) {
            setUser(res.user);
          }
        } catch (e) {
          if (!cancelled) setAuthError(e);
        }

        unsub = onAuthStateChanged(auth, (u) => {
          if (cancelled) return;
          setUser(u || null);
          setInitialized(true);
          setLoading(false);
        });

        // fallback: se já tiver currentUser, já libera
        if (auth.currentUser && !cancelled) {
          setUser(auth.currentUser);
          setInitialized(true);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setAuthError(e);
          setInitialized(true);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, []);

  const loginWithGoogle = async () => {
    setAuthError(null);
    setLoading(true);

    try {
      await setPersistence(auth, browserLocalPersistence);
    } catch (e) {
      setAuthError(e);
    }

    // 1) popup
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res?.user) {
        setUser(res.user);
      }
      setInitialized(true);
      setLoading(false);
      return res.user;
    } catch (err) {
      const code = err?.code ? String(err.code) : "";

      // 2) fallback redirect
      if (
        code.includes("popup") ||
        code.includes("auth/cancelled-popup-request") ||
        code.includes("auth/popup-closed-by-user") ||
        code.includes("auth/popup-blocked")
      ) {
        await signInWithRedirect(auth, googleProvider);
        // redirect vai finalizar no getRedirectResult/onAuthStateChanged
        return null;
      }

      setAuthError(err);
      setInitialized(true);
      setLoading(false);
      throw err;
    }
  };

  const refreshSession = async () => {
    try {
      const u = auth.currentUser;
      if (u) {
        await u.getIdToken(true);
        setUser(u);
      }
    } catch (e) {
      setAuthError(e);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      initialized,
      authError,
      loginWithGoogle,
      logout,
      refreshSession,
      clearAuthError: () => setAuthError(null),
      debug: {
        currentUserEmail: auth.currentUser?.email || null,
      },
    }),
    [user, loading, initialized, authError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
