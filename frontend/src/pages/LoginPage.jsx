import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

const LOGO_URL =
  "https://customer-assets.emergentagent.com/job_2460b93f-9170-44ea-8a4c-717f4e4be696/artifacts/6cc67isd_logo.png.JPG.png";

export default function LoginPage() {
  const nav = useNavigate();
  const { login, registerFirstUser, user } = useAuth();

  const [tab, setTab] = useState("login");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [nameReg, setNameReg] = useState("");
  const [usernameReg, setUsernameReg] = useState("");
  const [passwordReg, setPasswordReg] = useState("");

  useEffect(() => {
    if (user) nav("/");
  }, [user, nav]);

  const onLogin = async (e) => {
    e.preventDefault();
    try {
      await login({ username, password });
      nav("/");
    } catch (err) {
      toast({
        title: "Não foi possível entrar",
        description:
          err?.response?.data?.detail || "Verifique usuário e senha e tente novamente.",
        variant: "destructive",
      });
    }
  };

  const onRegister = async (e) => {
    e.preventDefault();
    try {
      await registerFirstUser({
        name: nameReg,
        username: usernameReg,
        password: passwordReg,
      });
      toast({
        title: "Usuário criado",
        description: "Agora você já pode entrar com usuário e senha.",
      });
      setHasUser(true);
    } catch (err) {
      toast({
        title: "Não foi possível criar",
        description: err?.response?.data?.detail || "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div
      data-testid="login-page"
      className="min-h-screen bg-[#07070b] text-zinc-50"
    >
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
                <div
                  data-testid="login-title"
                  className="text-2xl font-semibold tracking-tight"
                >
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
                  Cadastre contatos, endereço e informações básicas.
                </div>
              </div>
              <div
                data-testid="login-feature-2"
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="text-sm font-medium">Serviços</div>
                <div className="mt-1 text-xs text-zinc-200/70">
                  Registre data, tipo de serviço, valor e status.
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
                Entrar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList
                  data-testid="login-tabs"
                  className="grid w-full grid-cols-2 bg-black/20"
                >
                  <TabsTrigger data-testid="tab-login" value="login">
                    Login
                  </TabsTrigger>
                  <TabsTrigger data-testid="tab-register" value="register">
                    Criar usuário
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="mt-4">
                  <form onSubmit={onLogin} className="space-y-3">
                    <div className="space-y-1">
                      <div className="text-xs text-zinc-200/70">Usuário</div>
                      <Input
                        data-testid="login-username-input"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="ex: admin"
                        className="rounded-xl border-white/10 bg-black/30"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-zinc-200/70">Senha</div>
                      <Input
                        data-testid="login-password-input"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="rounded-xl border-white/10 bg-black/30"
                      />
                    </div>
                    <Button
                      data-testid="login-submit-button"
                      type="submit"
                      className="w-full rounded-xl bg-gradient-to-r from-red-600 to-rose-500 text-white hover:from-red-600/90 hover:to-rose-500/90"
                    >
                      Entrar
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register" className="mt-4">
                  <div
                    data-testid="register-info"
                    className="mb-4 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-zinc-200/70"
                  >
                    Crie um novo usuário para acessar o sistema.
                  </div>

                  <form onSubmit={onRegister} className="space-y-3">
                    <div className="space-y-1">
                      <div className="text-xs text-zinc-200/70">Nome</div>
                      <Input
                        data-testid="register-name-input"
                        value={nameReg}
                        onChange={(e) => setNameReg(e.target.value)}
                        placeholder="Seu nome"
                        className="rounded-xl border-white/10 bg-black/30"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-zinc-200/70">Usuário</div>
                      <Input
                        data-testid="register-username-input"
                        value={usernameReg}
                        onChange={(e) => setUsernameReg(e.target.value)}
                        placeholder="ex: admin"
                        className="rounded-xl border-white/10 bg-black/30"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-zinc-200/70">Senha</div>
                      <Input
                        data-testid="register-password-input"
                        type="password"
                        value={passwordReg}
                        onChange={(e) => setPasswordReg(e.target.value)}
                        placeholder="mínimo 6 caracteres"
                        className="rounded-xl border-white/10 bg-black/30"
                      />
                    </div>
                    <Button
                      data-testid="register-submit-button"
                      type="submit"
                      className="w-full rounded-xl bg-gradient-to-r from-red-600 to-rose-500 text-white hover:from-red-600/90 hover:to-rose-500/90"
                    >
                      Criar usuário
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
