import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { LogIn, AlertTriangle } from "lucide-react";

const LOGO_URL =
  "https://customer-assets.emergentagent.com/job_2460b93f-9170-44ea-8a4c-717f4e4be696/artifacts/6cc67isd_logo.png.JPG.png";

const THIS_DOMAIN = window.location.host;

export default function LoginPage() {
  const nav = useNavigate();
  const { user, loading, loginWithGoogle, authError, clearAuthError, debug } = useAuth();

  useEffect(() => {
    if (!loading && user) nav("/");
  }, [user, loading, nav]);

  const errorInfo = useMemo(() => {
    if (!authError) return null;
    const code = authError?.code ? String(authError.code) : "";
    const msg = authError?.message ? String(authError.message) : "";

    let help = "";
    if (code.includes("auth/unauthorized-domain")) {
      help = `Firebase Console → Authentication → Settings → Authorized domains: adicione ${THIS_DOMAIN}`;
    } else if (code.includes("auth/operation-not-allowed")) {
      help = "Firebase Console → Authentication → Sign-in method: ative o provedor Google.";
    } else if (code.includes("auth/popup-blocked") || code.includes("auth/popup-closed-by-user")) {
      help = "Permita popups. Se continuar, o sistema tentará redirect automaticamente.";
    } else if (code.includes("auth/network-request-failed")) {
      help = "Verifique internet e se o navegador bloqueia cookies/terceiros.";
    }

    return { code, msg, help };
  }, [authError]);

  const onGoogle = async () => {
    try {
      const u = await loginWithGoogle();
      // Se for popup e deu certo, navega na hora
      if (u) nav("/");
      // Se for redirect, o Firebase vai retornar logado.
    } catch (err) {
      toast({
        title: "Não foi possível entrar",
        description: "Se não aparecer erro, tente novamente e veja a seção de diagnóstico abaixo.",
        variant: "destructive",
      });
    }
  };

  return (
    <div data-testid="login-page" className="min-h-screen bg-[#050509] text-zinc-50">
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute -top-40 left-1/3 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.45),transparent_55%)]" />
        <div className="absolute -bottom-48 right-1/3 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.28),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.02),transparent_35%,rgba(255,255,255,0.02))]" />
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
                  Gestão de clientes e serviços (Firebase)
                </div>
              </div>
            </div>

            <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div
                data-testid="login-feature-1"
                className="rounded-2xl border border-white/10 bg-black/25 p-4"
              >
                <div className="text-sm font-medium">Clientes</div>
                <div className="mt-1 text-xs text-zinc-200/70">Cadastre e organize seus clientes.</div>
              </div>
              <div
                data-testid="login-feature-2"
                className="rounded-2xl border border-white/10 bg-black/25 p-4"
              >
                <div className="text-sm font-medium">Serviços</div>
                <div className="mt-1 text-xs text-zinc-200/70">Serviços do Firestore aparecem automaticamente.</div>
              </div>
              <div
                data-testid="login-feature-3"
                className="rounded-2xl border border-white/10 bg-black/25 p-4"
              >
                <div className="text-sm font-medium">Agenda</div>
                <div className="mt-1 text-xs text-zinc-200/70">Visualize próximos serviços por data.</div>
              </div>
              <div
                data-testid="login-feature-4"
                className="rounded-2xl border border-white/10 bg-black/25 p-4"
              >
                <div className="text-sm font-medium">Dashboard</div>
                <div className="mt-1 text-xs text-zinc-200/70">Resumo do mês: pendências e receita.</div>
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
                className="mb-4 rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-zinc-200/70"
              >
                Você verá apenas os registros onde <b>usuario</b> = seu e-mail.
              </div>

              <Button
                data-testid="login-google-button"
                onClick={onGoogle}
                className="w-full rounded-xl bg-gradient-to-r from-[#dc2626] via-[#e11d48] to-[#f43f5e] text-white hover:from-[#dc2626]/90 hover:via-[#e11d48]/90 hover:to-[#f43f5e]/90"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Entrar com Google
              </Button>

              <div data-testid="login-domain-hint" className="mt-3 text-xs text-zinc-200/60">
                Domínio atual: <b>{THIS_DOMAIN}</b>
              </div>

              <div
                data-testid="login-auth-debug"
                className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-zinc-200/70"
              >
                <div><b>Diagnóstico</b></div>
                <div>loading: {String(loading)}</div>
                <div>user no contexto: {user?.email || "(vazio)"}</div>
                <div>auth.currentUser: {debug?.currentUserEmail || "(vazio)"}</div>
                <div className="mt-2 text-zinc-200/60">
                  Se você escolhe o Gmail e volta pra login, geralmente é persistência/cookies.
                </div>
              </div>

              {errorInfo ? (
                <div
                  data-testid="login-auth-error"
                  className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-red-200" />
                    <div className="min-w-0">
                      <div data-testid="login-auth-error-title" className="text-sm font-semibold">
                        Erro no login
                      </div>
                      <div data-testid="login-auth-error-code" className="mt-1 text-xs text-zinc-100/80">
                        {errorInfo.code || "(sem código)"}
                      </div>
                      <div
                        data-testid="login-auth-error-message"
                        className="mt-1 text-xs text-zinc-100/70"
                      >
                        {errorInfo.msg}
                      </div>
                      {errorInfo.help ? (
                        <div
                          data-testid="login-auth-error-help"
                          className="mt-2 text-xs text-zinc-100/80"
                        >
                          {errorInfo.help}
                        </div>
                      ) : null}

                      <div className="mt-3">
                        <Button
                          data-testid="login-auth-error-clear"
                          variant="outline"
                          className="h-8 rounded-lg border-white/15 bg-white/5 text-zinc-50 hover:bg-white/10"
                          onClick={() => clearAuthError()}
                        >
                          Limpar erro
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
