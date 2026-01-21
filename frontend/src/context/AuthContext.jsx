import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  getRedirectResult,
  onAuthStateChanged,
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
    // Finaliza login via redirect e captura erros
    (async () => {
      try {
        const res = await getRedirectResult(auth);
        if (res?.user) setUser(res.user);
      } catch (e) {
        setAuthError(e);
      }
    })();

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Preferimos redirect (mais confiável). Se der erro imediato, tentamos popup.
  const loginWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithRedirect(auth, googleProvider);
      return null;
    } catch (err) {
      try {
        const res = await signInWithPopup(auth, googleProvider);
        return res.user;
      } catch (e2) {
        setAuthError(e2);
        throw e2;
      }
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
