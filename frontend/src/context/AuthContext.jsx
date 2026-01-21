import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, setAuthToken } from "@/lib/api";

const AuthContext = createContext(null);

const STORAGE_KEY = "ictupy_token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  const refreshMe = React.useCallback(async () => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch (e) {
      localStorage.removeItem(STORAGE_KEY);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const login = async ({ username, password }) => {
    const { data } = await api.post("/auth/login", { username, password });
    localStorage.setItem(STORAGE_KEY, data.access_token);
    setToken(data.access_token);
    setAuthToken(data.access_token);
    const me = await api.get("/auth/me");
    setUser(me.data);
    return me.data;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setAuthToken(null);
    setUser(null);
  };

  const bootstrapStatus = async () => {
    const { data } = await api.get("/auth/bootstrap/status");
    return data;
  };

  const registerFirstUser = async ({ name, username, password }) => {
    const { data } = await api.post("/auth/register", { name, username, password });
    return data;
  };

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      login,
      logout,
      bootstrapStatus,
      registerFirstUser,
      refreshMe,
    }),
    [token, user, loading, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
