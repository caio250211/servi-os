import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { LogIn } from "lucide-react";

const LOGO_URL =
  "https://customer-assets.emergentagent.com/job_2460b93f-9170-44ea-8a4c-717f4e4be696/artifacts/6cc67isd_logo.png.JPG.png";

export default function LoginPage() {
  const nav = useNavigate();
  const { user, loading, loginWithGoogle } = useAuth();

  useEffect(() => {
    if (!loading && user) nav("/");
  }, [user, loading, nav]);

  const onGoogle = async () => {
    try {
      await loginWithGoogle();
      // se for redirect, o firebase vai voltar logado
    } catch (err) {
      toast({
        title: "Não foi possível entrar",
        description: "Tente novamente. Se o popup for bloqueado, permita popups.",
        variant: "destructive",
      });
    }
  };

  return (
    <div data-testid="login-page" className="min-h-screen bg-[#07070b] text-zinc-50">
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute -top-40 left-1/3 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.38),transparent_55%)]" />
        <div className="absolute -bottom-40 right-1/3 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.22),transparent_55%)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10 md:px-6">
        <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md md:p-10">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-3xl ring-1 ring-white/10">
                <img
                  data-testid="login-logo"
                  src={LOGO_URL}
                  alt="InsectControl Tupy"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <div data-testid="login-title" className="text-2xl font-semibold tracking-tight">
                  InsectControl Tupy
                </div>
                <div
                  data-testid="login-subtitle"
                  className="mt-1 text-base md:text-lg text-zinc-200/70"
                >
                  Gestão de clientes e serviços
                </div>
              </div>
            </div>

            <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div
                data-testid="login-feature-1"
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="text-sm font-medium">Clientes</div>
                <div className="mt-1 text-xs text-zinc-200/70">
                  Cadastre e organize seus clientes.
                </div>
              </div>
              <div
                data-testid="login-feature-2"
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="text-sm font-medium">Serviços</div>
                <div className="mt-1 text-xs text-zinc-200/70">
                  Seus serviços do Firebase aparecem automaticamente.
                </div>
              </div>
              <div
                data-testid="login-feature-3"
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="text-sm font-medium">Agenda</div>
                <div className="mt-1 text-xs text-zinc-200/70">
                  Visualize serviços por dia (sem complicação).
                </div>
              </div>
              <div
                data-testid="login-feature-4"
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="text-sm font-medium">Dashboard</div>
                <div className="mt-1 text-xs text-zinc-200/70">
                  Resumo do mês: pendências e receita.
                </div>
              </div>
            </div>
          </div>

          <Card
            data-testid="login-card"
            className="rounded-3xl border-white/10 bg-white/5 backdrop-blur-md"
          >
            <CardHeader>
              <CardTitle data-testid="login-card-title" className="text-xl">
                Entrar com Google
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                data-testid="login-google-info"
                className="mb-4 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-zinc-200/70"
              >
                Use o seu Gmail para acessar e ver apenas seus serviços (campo <b>usuario</b>).
              </div>

              <Button
                data-testid="login-google-button"
                onClick={onGoogle}
                className="w-full rounded-xl bg-gradient-to-r from-red-600 to-rose-500 text-white hover:from-red-600/90 hover:to-rose-500/90"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Entrar com Google
              </Button>

              <div
                data-testid="login-google-note"
                className="mt-3 text-xs text-zinc-200/60"
              >
                Se nada acontecer, pode ser bloqueio de popup. Nesse caso, permita popups e tente novamente.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
