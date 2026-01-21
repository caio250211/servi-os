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
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
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

export default function ServicesPage() {
  const { user } = useAuth();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [from, setFrom] = useState(
    format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd")
  );
  const [to, setTo] = useState(
    format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), "yyyy-MM-dd")
  );

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    if (!user?.email) return;
    setLoading(true);

    try {
      // Query simples (evita necessidade de índice composto)
      const qy = query(collection(db, COLLECTION_NAME), where("usuario", "==", user.email));
      const snap = await getDocs(qy);

      const items = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((s) => {
          const dt = String(s.data || "");
          if (from && dt < from) return false;
          if (to && dt > to) return false;
          if (statusFilter !== "ALL" && String(s.status || "") !== statusFilter) return false;
          return true;
        })
        .sort((a, b) => String(b.data || "").localeCompare(String(a.data || "")));

      setServices(items);
    } catch (err) {
      toast({
        title: "Erro ao carregar serviços",
        description:
          err?.message ||
          "Verifique as regras do Firestore (leitura) e se você está logado.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

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
      toast({
        title: "Erro ao salvar",
        description: err?.message || "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const onDelete = async (s) => {
    const ok = window.confirm(
      `Excluir o serviço de ${s.data ? format(new Date(s.data), "dd/MM/yyyy") : "—"}?`
    );
    if (!ok) return;

    try {
      await deleteDoc(doc(db, COLLECTION_NAME, s.id));
      toast({ title: "Serviço excluído" });
      await load();
    } catch (err) {
      toast({
        title: "Não foi possível excluir",
        description: err?.message || "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div data-testid="services-page" className="pb-10">
      <PageHeader
        title="Serviços"
        subtitle={`Fonte: Firebase / Firestore (collection: ${COLLECTION_NAME}).`}
        right={
          <Button
            data-testid="services-new-button"
            onClick={openCreate}
            className="rounded-xl bg-gradient-to-r from-red-600 to-rose-500 text-white hover:from-red-600/90 hover:to-rose-500/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo serviço
          </Button>
        }
      />

      <Card
        data-testid="services-card"
        className="rounded-2xl border-white/10 bg-white/5 backdrop-blur-md"
      >
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
            <div className="space-y-1">
              <div className="text-xs text-zinc-200/70">De</div>
              <Input
                data-testid="services-filter-from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="rounded-xl border-white/10 bg-black/30"
              />
            </div>
            <div className="space-y-1">
              <div className="text-xs text-zinc-200/70">Até</div>
              <Input
                data-testid="services-filter-to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="rounded-xl border-white/10 bg-black/30"
              />
            </div>
            <div className="space-y-1">
              <div className="text-xs text-zinc-200/70">Status</div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger
                  data-testid="services-filter-status"
                  className="rounded-xl border-white/10 bg-black/30"
                >
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
                data-testid="services-apply-filters"
                variant="outline"
                className="rounded-xl border-white/15 bg-white/5 text-zinc-50 hover:bg-white/10"
                onClick={() => load()}
              >
                Aplicar
              </Button>
              <Button
                data-testid="services-reset-filters"
                variant="outline"
                className="rounded-xl border-white/15 bg-white/5 text-zinc-50 hover:bg-white/10"
                onClick={() => {
                  setStatusFilter("ALL");
                  const now = new Date();
                  setFrom(format(new Date(now.getFullYear(), now.getMonth(), 1), "yyyy-MM-dd"));
                  setTo(format(new Date(now.getFullYear(), now.getMonth() + 1, 0), "yyyy-MM-dd"));
                }}
              >
                Reset
              </Button>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
            <Table data-testid="services-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      data-testid="services-loading"
                      colSpan={8}
                      className="p-6 text-sm text-zinc-200/70"
                    >
                      Carregando…
                    </TableCell>
                  </TableRow>
                ) : services.length === 0 ? (
                  <TableRow>
                    <TableCell
                      data-testid="services-empty"
                      colSpan={8}
                      className="p-6 text-sm text-zinc-200/60"
                    >
                      Nenhum serviço encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  services.map((s) => (
                    <TableRow key={s.id} data-testid={`service-row-${s.id}`}>
                      <TableCell data-testid={`service-date-${s.id}`}>
                        {s.data
                          ? format(new Date(s.data), "dd/MM/yyyy", { locale: ptBR })
                          : "—"}
                      </TableCell>
                      <TableCell data-testid={`service-client-${s.id}`}>{s.cliente || "—"}</TableCell>
                      <TableCell data-testid={`service-contact-${s.id}`}>{s.contato || "—"}</TableCell>
                      <TableCell
                        data-testid={`service-local-${s.id}`}
                        className="max-w-[320px] truncate"
                      >
                        {s.local || "—"}
                      </TableCell>
                      <TableCell data-testid={`service-type-${s.id}`}>{s.tipo || "—"}</TableCell>
                      <TableCell data-testid={`service-status-${s.id}`}>
                        <Badge
                          className={
                            String(s.status).toLowerCase() === "pago"
                              ? "bg-emerald-500/15 text-emerald-200 border border-emerald-400/20"
                              : "bg-amber-500/15 text-amber-200 border border-amber-400/20"
                          }
                        >
                          {s.status || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`service-value-${s.id}`} className="text-right">
                        {currencyBR(s.valor)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            data-testid={`service-edit-${s.id}`}
                            variant="outline"
                            className="h-9 rounded-xl border-white/15 bg-white/5 text-zinc-50 hover:bg-white/10"
                            onClick={() => openEdit(s)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            data-testid={`service-delete-${s.id}`}
                            variant="outline"
                            className="h-9 rounded-xl border-white/15 bg-white/5 text-zinc-50 hover:bg-white/10"
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
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          data-testid="services-dialog"
          className="rounded-2xl border-white/10 bg-[#0b0b10] text-zinc-50"
        >
          <DialogHeader>
            <DialogTitle data-testid="services-dialog-title">{title}</DialogTitle>
            <DialogDescription data-testid="services-dialog-desc">
              Campos iguais aos do seu Firestore (cliente, contato, local, data, tipo, status, valor).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSave} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <div className="text-xs text-zinc-200/70">Cliente *</div>
                <Input
                  data-testid="service-form-client"
                  value={form.cliente}
                  onChange={(e) => setForm((p) => ({ ...p, cliente: e.target.value }))}
                  className="rounded-xl border-white/10 bg-black/30"
                  placeholder="Ex: Dona Marizia Ipanema"
                  required
                />
              </div>

              <div className="space-y-1">
                <div className="text-xs text-zinc-200/70">Contato</div>
                <Input
                  data-testid="service-form-contact"
                  value={form.contato}
                  onChange={(e) => setForm((p) => ({ ...p, contato: e.target.value }))}
                  className="rounded-xl border-white/10 bg-black/30"
                  placeholder="(21) 00000-0000"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <div className="text-xs text-zinc-200/70">Local</div>
                <Input
                  data-testid="service-form-local"
                  value={form.local}
                  onChange={(e) => setForm((p) => ({ ...p, local: e.target.value }))}
                  className="rounded-xl border-white/10 bg-black/30"
                  placeholder="Endereço do serviço"
                />
              </div>

              <div className="space-y-1">
                <div className="text-xs text-zinc-200/70">Data *</div>
                <Input
                  data-testid="service-form-date"
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm((p) => ({ ...p, data: e.target.value }))}
                  className="rounded-xl border-white/10 bg-black/30"
                  required
                />
              </div>

              <div className="space-y-1">
                <div className="text-xs text-zinc-200/70">Status</div>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}
                >
                  <SelectTrigger
                    data-testid="service-form-status"
                    className="rounded-xl border-white/10 bg-black/30"
                  >
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
                <div className="text-xs text-zinc-200/70">Tipo</div>
                <Input
                  data-testid="service-form-type"
                  value={form.tipo}
                  onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}
                  className="rounded-xl border-white/10 bg-black/30"
                  placeholder="Ex: dedetização baratas e formigas"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <div className="text-xs text-zinc-200/70">Valor</div>
                <Input
                  data-testid="service-form-value"
                  type="number"
                  step="0.01"
                  value={form.valor}
                  onChange={(e) => setForm((p) => ({ ...p, valor: e.target.value }))}
                  className="rounded-xl border-white/10 bg-black/30"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                data-testid="service-form-cancel"
                type="button"
                variant="outline"
                className="rounded-xl border-white/15 bg-white/5 text-zinc-50 hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                data-testid="service-form-submit"
                type="submit"
                className="rounded-xl bg-gradient-to-r from-red-600 to-rose-500 text-white hover:from-red-600/90 hover:to-rose-500/90"
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
