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

    (async () => {
      try {
        // Garante persistência ANTES de qualquer tentativa de login/restore
        await setPersistence(auth, browserLocalPersistence);

        // Se estiver voltando de um redirect, isso conclui o login
        try {
          const res = await getRedirectResult(auth);
          if (res?.user) setUser(res.user);
        } catch (e) {
          setAuthError(e);
        }

        unsub = onAuthStateChanged(auth, (u) => {
          setUser(u || null);
          setLoading(false);
        });

        // fallback extra: às vezes currentUser já existe
        if (auth.currentUser) {
          setUser(auth.currentUser);
          setLoading(false);
        }
      } catch (e) {
        setAuthError(e);
        setLoading(false);
      }
    })();

    return () => {
      if (unsub) unsub();
    };
  }, []);

  // Tenta popup (melhor UX). Se popup for bloqueado, usa redirect.
  const loginWithGoogle = async () => {
    setAuthError(null);
    try {
      await setPersistence(auth, browserLocalPersistence);
    } catch (e) {
      // ignorar, mas registrar
      setAuthError(e);
    }

    try {
      const res = await signInWithPopup(auth, googleProvider);
      return res.user;
    } catch (err) {
      const code = err?.code ? String(err.code) : "";
      if (code.includes("popup") || code.includes("auth/cancelled-popup-request")) {
        // fallback
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
