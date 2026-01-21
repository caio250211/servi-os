import React from "react";
import "@/App.css";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import AppShell from "@/components/app/AppShell";

import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import ClientsPage from "@/pages/ClientsPage";
import ServicesPage from "@/pages/ServicesPage";
import AgendaPage from "@/pages/AgendaPage";
import ServicesSummaryPage from "@/pages/ServicesSummaryPage";

import { Toaster } from "@/components/ui/toaster";

function Protected({ children }) {
  const { user, loading, initialized } = useAuth();

  if (loading || !initialized) {
    return (
      <div data-testid="auth-loading" className="min-h-screen bg-[#050509] text-zinc-50">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <div
            data-testid="auth-loading-text"
            className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-200/70"
          >
            Carregando sessão…
          </div>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <Protected>
                <AppShell />
              </Protected>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="clientes" element={<ClientsPage />} />
            <Route path="servicos" element={<ServicesPage />} />
            <Route path="agenda" element={<AgendaPage />} />
            <Route path="resumo" element={<ServicesSummaryPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </AuthProvider>
  );
}
