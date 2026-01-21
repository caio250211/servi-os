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
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let unsub = null;
    let cancelled = false;

    const finishLoadingSafe = () => {
      if (!cancelled) setLoading(false);
    };

    (async () => {
      try {
        // Persistência precisa ser configurada antes
        await setPersistence(auth, browserLocalPersistence);

        // Se estiver voltando de redirect, conclui aqui
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
          setLoading(false);
        });

        // fallback extra
        if (auth.currentUser && !cancelled) {
          setUser(auth.currentUser);
          setLoading(false);
        }

        // fallback final: se nada disparar em 4s, liberamos loading
        setTimeout(() => {
          finishLoadingSafe();
        }, 4000);
      } catch (e) {
        if (!cancelled) {
          setAuthError(e);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, []);

  // Tenta popup (melhor UX). Se popup for bloqueado, usa redirect.
  // Importante: ao sucesso no popup, setamos user imediatamente.
  const loginWithGoogle = async () => {
    setAuthError(null);

    try {
      await setPersistence(auth, browserLocalPersistence);
    } catch (e) {
      setAuthError(e);
    }

    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res?.user) {
        setUser(res.user);
        setLoading(false);
      }
      return res.user;
    } catch (err) {
      const code = err?.code ? String(err.code) : "";

      // Se for problema de popup, fazemos redirect
      if (
        code.includes("popup") ||
        code.includes("auth/cancelled-popup-request") ||
        code.includes("auth/popup-closed-by-user") ||
        code.includes("auth/popup-blocked")
      ) {
        await signInWithRedirect(auth, googleProvider);
        return null;
      }

      setAuthError(err);
      throw err;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      authError,
      loginWithGoogle,
      logout,
      clearAuthError: () => setAuthError(null),
      debug: {
        currentUserEmail: auth.currentUser?.email || null,
      },
    }),
    [user, loading, authError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
