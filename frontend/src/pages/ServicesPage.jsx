import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { normalizeDateToYMD, yearFromDateValue } from "@/lib/firestoreDate";

import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

const COLLECTION_NAME = "servicos";

const emptyForm = {
  cliente: "",
  contato: "",
  local: "",
  data: format(new Date(), "yyyy-MM-dd"),
  tipo: "",
  valor: "0",
  status: "Pendente",
};

function currencyBR(v) {
  const n = Number(String(v || "0").replace(",", "."));
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function yearFromService(s) {
  const dt = String(s?.data || "");
  const y = dt.slice(0, 4);
  return /^\d{4}$/.test(y) ? y : "";
}

export default function ServicesPage() {
  const { user } = useAuth();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [yearTab, setYearTab] = useState("ALL");

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  // Ajuste principal: quando selecionar 2025/2026, o período vira o ano inteiro
  useEffect(() => {
    if (yearTab === "2025") {
      setFrom("2025-01-01");
      setTo("2025-12-31");
    } else if (yearTab === "2026") {
      setFrom("2026-01-01");
      setTo("2026-12-31");
    } else {
      // ALL: mostra tudo (sem travar no mês atual)
      setFrom("");
      setTo("");
    }
  }, [yearTab]);

  const load = async () => {
    if (!user?.email) return;
    setLoading(true);

    try {
      const qy = query(collection(db, COLLECTION_NAME), where("usuario", "==", user.email));
      const snap = await getDocs(qy);

      const items = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((s) => {
          const dt = normalizeDateToYMD(s.data);
          if (from && dt && dt < from) return false;
          if (to && dt && dt > to) return false;
          if (statusFilter !== "ALL" && String(s.status || "") !== statusFilter) return false;
          return true;
        })
        .sort((a, b) => normalizeDateToYMD(b.data).localeCompare(normalizeDateToYMD(a.data)));

      setServices(items);
    } catch (err) {
      toast({
        title: "Erro ao carregar serviços",
        description: err?.message || "Verifique as regras do Firestore e se você está logado.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email, statusFilter, from, to]);

  const servicesByYear = useMemo(() => {
    const all = services;
    const y2026 = all.filter((s) => yearFromDateValue(s.data) === "2026");
    const y2025 = all.filter((s) => yearFromDateValue(s.data) === "2025");
    return { all, y2026, y2025 };
  }, [services]);

  const title = useMemo(() => (mode === "edit" ? "Editar serviço" : "Novo serviço"), [mode]);

  const openCreate = () => {
    setMode("create");
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (s) => {
    setMode("edit");
    setEditingId(s.id);
    setForm({
      cliente: s.cliente || "",
      contato: s.contato || "",
      local: s.local || "",
      data: s.data || format(new Date(), "yyyy-MM-dd"),
      tipo: s.tipo || "",
      valor: String(s.valor ?? "0"),
      status: s.status || "Pendente",
    });
    setOpen(true);
  };

  const onSave = async (e) => {
    e.preventDefault();

    if (!user?.email) {
      toast({ title: "Faça login", variant: "destructive" });
      return;
    }

    try {
      const payload = {
        ...form,
        usuario: user.email,
        criado: new Date().toISOString(),
        valor: String(form.valor ?? "0"),
      };

      if (!payload.cliente?.trim()) {
        toast({ title: "Informe o cliente", variant: "destructive" });
        return;
      }
      if (!payload.data) {
        toast({ title: "Informe a data", variant: "destructive" });
        return;
      }

      if (mode === "create") {
        await addDoc(collection(db, COLLECTION_NAME), payload);
        toast({ title: "Serviço criado", description: "Serviço registrado com sucesso." });
      } else {
        await updateDoc(doc(db, COLLECTION_NAME, editingId), payload);
        toast({ title: "Serviço atualizado", description: "Alterações salvas." });
      }

      setOpen(false);
      await load();
    } catch (err) {
      toast({ title: "Erro ao salvar", description: err?.message || "Tente novamente.", variant: "destructive" });
    }
  };

  const onDelete = async (s) => {
    const ok = window.confirm(
      `Excluir o serviço de ${normalizeDateToYMD(s.data) ? format(new Date(normalizeDateToYMD(s.data)), "dd/MM/yyyy") : "—"}?`
    );
    if (!ok) return;

    try {
      await deleteDoc(doc(db, COLLECTION_NAME, s.id));
      toast({ title: "Serviço excluído" });
      await load();
    } catch (err) {
      toast({ title: "Não foi possível excluir", description: err?.message || "Tente novamente.", variant: "destructive" });
    }
  };

  return (
    <div data-testid="services-page" className="pb-10">
      <PageHeader
        title="Serviços"
        subtitle={`Firebase / Firestore • collection: ${COLLECTION_NAME} • usuário: ${user?.email || "—"}`}
        right={
          <Button
            data-testid="services-new-button"
            onClick={openCreate}
            className="rounded-xl bg-gradient-to-r from-[#dc2626] via-[#e11d48] to-[#f43f5e] text-white hover:from-[#dc2626]/90 hover:via-[#e11d48]/90 hover:to-[#f43f5e]/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo serviço
          </Button>
        }
      />

      <Card data-testid="services-card" className="rounded-2xl border-white/10 bg-white/5 backdrop-blur-md">
        <CardContent className="p-4">
          <Tabs value={yearTab} onValueChange={setYearTab}>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <TabsList data-testid="services-year-tabs" className="bg-black/25">
                <TabsTrigger data-testid="services-year-all" value="ALL">
                  Todos
                </TabsTrigger>
                <TabsTrigger data-testid="services-year-2026" value="2026">
                  2026 ({servicesByYear.y2026.length})
                </TabsTrigger>
                <TabsTrigger data-testid="services-year-2025" value="2025">
                  2025 ({servicesByYear.y2025.length})
                </TabsTrigger>
              </TabsList>

              <div data-testid="services-year-hint" className="text-xs text-zinc-200/70">
                2025/2026 mostram o ano inteiro automaticamente.
              </div>
            </div>

            <TabsContent value={yearTab}>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
                <div className="space-y-1">
                  <div className="text-xs text-zinc-200/80">De</div>
                  <Input
                    data-testid="services-filter-from"
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="rounded-xl border-white/10 bg-black/30 text-zinc-50 placeholder:text-zinc-200/40"
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-zinc-200/80">Até</div>
                  <Input
                    data-testid="services-filter-to"
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="rounded-xl border-white/10 bg-black/30 text-zinc-50 placeholder:text-zinc-200/40"
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-zinc-200/80">Status</div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger data-testid="services-filter-status" className="rounded-xl border-white/10 bg-black/30 text-zinc-50">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem data-testid="services-filter-status-all" value="ALL">
                        Todos
                      </SelectItem>
                      <SelectItem data-testid="services-filter-status-pendente" value="Pendente">
                        Pendente
                      </SelectItem>
                      <SelectItem data-testid="services-filter-status-pago" value="Pago">
                        Pago
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button
                    data-testid="services-reset-filters"
                    variant="outline"
                    className="rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                    onClick={() => {
                      setStatusFilter("ALL");
                      setYearTab("ALL");
                      setFrom("");
                      setTo("");
                    }}
                  >
                    Limpar
                  </Button>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/20">
                <Table data-testid="services-table">
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-zinc-200">Data</TableHead>
                      <TableHead className="text-zinc-200">Cliente</TableHead>
                      <TableHead className="text-zinc-200">Contato</TableHead>
                      <TableHead className="text-zinc-200">Local</TableHead>
                      <TableHead className="text-zinc-200">Tipo</TableHead>
                      <TableHead className="text-zinc-200">Status</TableHead>
                      <TableHead className="text-right text-zinc-200">Valor</TableHead>
                      <TableHead className="text-right text-zinc-200">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow className="border-white/10">
                        <TableCell data-testid="services-loading" colSpan={8} className="p-6 text-sm text-zinc-200/80">
                          Carregando…
                        </TableCell>
                      </TableRow>
                    ) : !user?.email ? (
                      <TableRow className="border-white/10">
                        <TableCell data-testid="services-not-logged" colSpan={8} className="p-6 text-sm text-zinc-200/70">
                          Faça login com Google para ver seus serviços.
                        </TableCell>
                      </TableRow>
                    ) : services.length === 0 ? (
                      <TableRow className="border-white/10">
                        <TableCell data-testid="services-empty" colSpan={8} className="p-6 text-sm text-zinc-200/70">
                          Nenhum serviço encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      services.map((s) => (
                        <TableRow key={s.id} data-testid={`service-row-${s.id}`} className="border-white/10 hover:bg-white/5">
                          <TableCell data-testid={`service-date-${s.id}`} className="text-white font-medium">
                            {normalizeDateToYMD(s.data)
                              ? format(new Date(normalizeDateToYMD(s.data)), "dd/MM/yyyy", { locale: ptBR })
                              : "—"}
                          </TableCell>
                          <TableCell data-testid={`service-client-${s.id}`} className="text-zinc-100">
                            {s.cliente || "—"}
                          </TableCell>
                          <TableCell data-testid={`service-contact-${s.id}`} className="text-zinc-100">
                            {s.contato || "—"}
                          </TableCell>
                          <TableCell data-testid={`service-local-${s.id}`} className="max-w-[320px] truncate text-zinc-100">
                            {s.local || "—"}
                          </TableCell>
                          <TableCell data-testid={`service-type-${s.id}`} className="text-zinc-100">
                            {s.tipo || "—"}
                          </TableCell>
                          <TableCell data-testid={`service-status-${s.id}`}>
                            <Badge className={String(s.status).toLowerCase() === "pago" ? "bg-emerald-500/15 text-emerald-200 border border-emerald-400/20" : "bg-amber-500/15 text-amber-200 border border-amber-400/20"}>
                              {s.status || "—"}
                            </Badge>
                          </TableCell>
                          <TableCell data-testid={`service-value-${s.id}`} className="text-right text-zinc-100">
                            {currencyBR(s.valor)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex items-center gap-2">
                              <Button
                                data-testid={`service-edit-${s.id}`}
                                variant="outline"
                                className="h-9 rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                                onClick={() => openEdit(s)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                data-testid={`service-delete-${s.id}`}
                                variant="outline"
                                className="h-9 rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                                onClick={() => onDelete(s)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-testid="services-dialog" className="rounded-2xl border-white/10 bg-[#0b0b10] text-zinc-50">
          <DialogHeader>
            <DialogTitle data-testid="services-dialog-title">{title}</DialogTitle>
            <DialogDescription data-testid="services-dialog-desc">
              Campos iguais aos do seu Firestore (cliente, contato, local, data, tipo, status, valor).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSave} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <div className="text-xs text-zinc-200/80">Cliente *</div>
                <Input
                  data-testid="service-form-client"
                  value={form.cliente}
                  onChange={(e) => setForm((p) => ({ ...p, cliente: e.target.value }))}
                  className="rounded-xl border-white/10 bg-black/30 text-zinc-50 placeholder:text-zinc-200/40"
                  placeholder="Ex: Dona Marizia Ipanema"
                  required
                />
              </div>

              <div className="space-y-1">
                <div className="text-xs text-zinc-200/80">Contato</div>
                <Input
                  data-testid="service-form-contact"
                  value={form.contato}
                  onChange={(e) => setForm((p) => ({ ...p, contato: e.target.value }))}
                  className="rounded-xl border-white/10 bg-black/30 text-zinc-50 placeholder:text-zinc-200/40"
                  placeholder="(21) 00000-0000"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <div className="text-xs text-zinc-200/80">Local</div>
                <Input
                  data-testid="service-form-local"
                  value={form.local}
                  onChange={(e) => setForm((p) => ({ ...p, local: e.target.value }))}
                  className="rounded-xl border-white/10 bg-black/30 text-zinc-50 placeholder:text-zinc-200/40"
                  placeholder="Endereço do serviço"
                />
              </div>

              <div className="space-y-1">
                <div className="text-xs text-zinc-200/80">Data *</div>
                <Input
                  data-testid="service-form-date"
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm((p) => ({ ...p, data: e.target.value }))}
                  className="rounded-xl border-white/10 bg-black/30 text-zinc-50 placeholder:text-zinc-200/40"
                  required
                />
              </div>

              <div className="space-y-1">
                <div className="text-xs text-zinc-200/80">Status</div>
                <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
                  <SelectTrigger data-testid="service-form-status" className="rounded-xl border-white/10 bg-black/30 text-zinc-50">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem data-testid="service-form-status-pendente" value="Pendente">
                      Pendente
                    </SelectItem>
                    <SelectItem data-testid="service-form-status-pago" value="Pago">
                      Pago
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 md:col-span-2">
                <div className="text-xs text-zinc-200/80">Tipo</div>
                <Input
                  data-testid="service-form-type"
                  value={form.tipo}
                  onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}
                  className="rounded-xl border-white/10 bg-black/30 text-zinc-50 placeholder:text-zinc-200/40"
                  placeholder="Ex: dedetização baratas e formigas"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <div className="text-xs text-zinc-200/80">Valor</div>
                <Input
                  data-testid="service-form-value"
                  type="number"
                  step="0.01"
                  value={form.valor}
                  onChange={(e) => setForm((p) => ({ ...p, valor: e.target.value }))}
                  className="rounded-xl border-white/10 bg-black/30 text-zinc-50 placeholder:text-zinc-200/40"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                data-testid="service-form-cancel"
                type="button"
                variant="outline"
                className="rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                data-testid="service-form-submit"
                type="submit"
                className="rounded-xl bg-gradient-to-r from-[#dc2626] via-[#e11d48] to-[#f43f5e] text-white hover:from-[#dc2626]/90 hover:via-[#e11d48]/90 hover:to-[#f43f5e]/90"
              >
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
