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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const emptyForm = {
  client_id: "",
  date: format(new Date(), "yyyy-MM-dd"),
  service_type: "",
  value: "0",
  status: "PENDENTE",
};

function currencyBR(v) {
  const n = Number(v || 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ServicesPage() {
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [from, setFrom] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), "yyyy-MM-dd"));

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const clientNameById = useMemo(() => {
    const map = new Map();
    clients.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [clients]);

  const load = async () => {
    setLoading(true);
    try {
      const params = {
        from,
        to,
      };
      if (statusFilter !== "ALL") params.status = statusFilter;
      const [c, s] = await Promise.all([api.get("/clients"), api.get("/services", { params })]);
      setClients(c.data);
      setServices(s.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setMode("create");
    setEditingId(null);
    setForm({ ...emptyForm, client_id: clients?.[0]?.id || "" });
    setOpen(true);
  };

  const openEdit = (s) => {
    setMode("edit");
    setEditingId(s.id);
    setForm({
      client_id: s.client_id,
      date: format(new Date(s.date), "yyyy-MM-dd"),
      service_type: s.service_type || "",
      value: String(s.value ?? 0),
      status: s.status,
    });
    setOpen(true);
  };

  const onSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        client_id: form.client_id,
        date: form.date,
        service_type: form.service_type,
        value: Number(form.value || 0),
        status: form.status,
      };

      if (!payload.client_id) {
        toast({ title: "Selecione um cliente", variant: "destructive" });
        return;
      }

      if (mode === "create") {
        await api.post("/services", payload);
        toast({ title: "Serviço criado", description: "Serviço registrado com sucesso." });
      } else {
        await api.put(`/services/${editingId}`, payload);
        toast({ title: "Serviço atualizado", description: "Alterações salvas." });
      }
      setOpen(false);
      await load();
    } catch (err) {
      toast({
        title: "Erro ao salvar",
        description: err?.response?.data?.detail || "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const onDelete = async (s) => {
    // eslint-disable-next-line no-alert
    const ok = window.confirm(`Excluir o serviço de ${format(new Date(s.date), "dd/MM/yyyy")}?`);
    if (!ok) return;

    try {
      await api.delete(`/services/${s.id}`);
      toast({ title: "Serviço excluído" });
      await load();
    } catch (err) {
      toast({
        title: "Não foi possível excluir",
        description: err?.response?.data?.detail || "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div data-testid="services-page" className="pb-10">
      <PageHeader
        title="Serviços"
        subtitle="Registre serviços realizados e acompanhe pendências."
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
                  <SelectItem data-testid="services-filter-status-pendente" value="PENDENTE">
                    PENDENTE
                  </SelectItem>
                  <SelectItem data-testid="services-filter-status-concluido" value="CONCLUIDO">
                    CONCLUIDO
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
                  setTimeout(load, 0);
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
                      colSpan={6}
                      className="p-6 text-sm text-zinc-200/70"
                    >
                      Carregando…
                    </TableCell>
                  </TableRow>
                ) : services.length === 0 ? (
                  <TableRow>
                    <TableCell
                      data-testid="services-empty"
                      colSpan={6}
                      className="p-6 text-sm text-zinc-200/60"
                    >
                      Nenhum serviço encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  services.map((s) => (
                    <TableRow key={s.id} data-testid={`service-row-${s.id}`}>
                      <TableCell data-testid={`service-date-${s.id}`}>
                        {format(new Date(s.date), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell data-testid={`service-client-${s.id}`}>
                        {clientNameById.get(s.client_id) || s.client_id}
                      </TableCell>
                      <TableCell data-testid={`service-type-${s.id}`}>{s.service_type}</TableCell>
                      <TableCell data-testid={`service-status-${s.id}`}>
                        <Badge
                          className={
                            s.status === "CONCLUIDO"
                              ? "bg-emerald-500/15 text-emerald-200 border border-emerald-400/20"
                              : "bg-amber-500/15 text-amber-200 border border-amber-400/20"
                          }
                        >
                          {s.status}
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`service-value-${s.id}`} className="text-right">
                        {currencyBR(s.value)}
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
            <DialogTitle data-testid="services-dialog-title">
              {mode === "edit" ? "Editar serviço" : "Novo serviço"}
            </DialogTitle>
            <DialogDescription data-testid="services-dialog-desc">
              Informe data, cliente, tipo, valor e status.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSave} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <div className="text-xs text-zinc-200/70">Cliente *</div>
                <Select
                  value={form.client_id}
                  onValueChange={(v) => setForm((p) => ({ ...p, client_id: v }))}
                >
                  <SelectTrigger
                    data-testid="service-form-client"
                    className="rounded-xl border-white/10 bg-black/30"
                  >
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.length === 0 ? (
                      <SelectItem data-testid="service-form-client-empty" value="__empty" disabled>
                        Cadastre um cliente primeiro
                      </SelectItem>
                    ) : (
                      clients.map((c) => (
                        <SelectItem
                          key={c.id}
                          data-testid={`service-form-client-${c.id}`}
                          value={c.id}
                        >
                          {c.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-zinc-200/70">Data *</div>
                <Input
                  data-testid="service-form-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                  className="rounded-xl border-white/10 bg-black/30"
                  required
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <div className="text-xs text-zinc-200/70">Tipo de serviço *</div>
                <Input
                  data-testid="service-form-type"
                  value={form.service_type}
                  onChange={(e) => setForm((p) => ({ ...p, service_type: e.target.value }))}
                  className="rounded-xl border-white/10 bg-black/30"
                  placeholder="Ex: Desinsetização (baratas)"
                  required
                />
              </div>

              <div className="space-y-1">
                <div className="text-xs text-zinc-200/70">Valor</div>
                <Input
                  data-testid="service-form-value"
                  type="number"
                  step="0.01"
                  value={form.value}
                  onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
                  className="rounded-xl border-white/10 bg-black/30"
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
                    <SelectItem data-testid="service-form-status-pendente" value="PENDENTE">
                      PENDENTE
                    </SelectItem>
                    <SelectItem data-testid="service-form-status-concluido" value="CONCLUIDO">
                      CONCLUIDO
                    </SelectItem>
                  </SelectContent>
                </Select>
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
