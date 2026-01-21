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
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Pencil, Plus, Trash2 } from "lucide-react";

const emptyForm = {
  name: "",
  phone: "",
  address: "",
  city: "",
  neighborhood: "",
  email: "",
};

export default function ClientsPage() {
  const [q, setQ] = useState("");
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const title = useMemo(() => (mode === "edit" ? "Editar cliente" : "Novo cliente"), [mode]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/clients", { params: q ? { q } : {} });
      setClients(data);
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
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (c) => {
    setMode("edit");
    setEditingId(c.id);
    setForm({
      name: c.name || "",
      phone: c.phone || "",
      address: c.address || "",
      city: c.city || "",
      neighborhood: c.neighborhood || "",
      email: c.email || "",
    });
    setOpen(true);
  };

  const onSave = async (e) => {
    e.preventDefault();
    try {
      if (mode === "create") {
        await api.post("/clients", {
          ...form,
          name: form.name,
        });
        toast({ title: "Cliente criado", description: "Cliente cadastrado com sucesso." });
      } else {
        await api.put(`/clients/${editingId}`, { ...form });
        toast({ title: "Cliente atualizado", description: "Alterações salvas." });
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

  const onDelete = async (c) => {
    const ok = window.confirm(`Excluir o cliente "${c.name}"?`);
    if (!ok) return;

    try {
      await api.delete(`/clients/${c.id}`);
      toast({ title: "Cliente excluído" });
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
    <div data-testid="clients-page" className="pb-10">
      <PageHeader
        title="Clientes"
        subtitle="Cadastre e encontre rapidamente seus clientes."
        right={
          <Button
            data-testid="clients-new-button"
            onClick={openCreate}
            className="rounded-xl bg-gradient-to-r from-red-600 to-rose-500 text-white hover:from-red-600/90 hover:to-rose-500/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo cliente
          </Button>
        }
      />

      <Card
        data-testid="clients-card"
        className="rounded-2xl border-white/10 bg-white/5 backdrop-blur-md"
      >
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl flex-1">
              <Input
                data-testid="clients-search-input"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nome ou telefone…"
                className="rounded-xl border-white/10 bg-black/30"
              />
            </div>
            <div className="flex gap-2">
              <Button
                data-testid="clients-search-button"
                variant="outline"
                className="rounded-xl border-white/15 bg-white/5 text-zinc-50 hover:bg-white/10"
                onClick={() => load()}
              >
                Buscar
              </Button>
              <Button
                data-testid="clients-refresh-button"
                variant="outline"
                className="rounded-xl border-white/15 bg-white/5 text-zinc-50 hover:bg-white/10"
                onClick={() => {
                  setQ("");
                  setTimeout(load, 0);
                }}
              >
                Limpar
              </Button>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
            <Table data-testid="clients-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Cidade/Bairro</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      data-testid="clients-loading"
                      colSpan={5}
                      className="p-6 text-sm text-zinc-200/70"
                    >
                      Carregando…
                    </TableCell>
                  </TableRow>
                ) : clients.length === 0 ? (
                  <TableRow>
                    <TableCell
                      data-testid="clients-empty"
                      colSpan={5}
                      className="p-6 text-sm text-zinc-200/60"
                    >
                      Nenhum cliente encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  clients.map((c) => (
                    <TableRow key={c.id} data-testid={`client-row-${c.id}`}>
                      <TableCell data-testid={`client-name-${c.id}`}>{c.name}</TableCell>
                      <TableCell data-testid={`client-phone-${c.id}`}>{c.phone || "—"}</TableCell>
                      <TableCell data-testid={`client-city-${c.id}`}>
                        {c.city || "—"}{c.neighborhood ? ` / ${c.neighborhood}` : ""}
                      </TableCell>
                      <TableCell data-testid={`client-email-${c.id}`}>{c.email || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            data-testid={`client-edit-${c.id}`}
                            variant="outline"
                            className="h-9 rounded-xl border-white/15 bg-white/5 text-zinc-50 hover:bg-white/10"
                            onClick={() => openEdit(c)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            data-testid={`client-delete-${c.id}`}
                            variant="outline"
                            className="h-9 rounded-xl border-white/15 bg-white/5 text-zinc-50 hover:bg-white/10"
                            onClick={() => onDelete(c)}
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
          data-testid="clients-dialog"
          className="rounded-2xl border-white/10 bg-[#0b0b10] text-zinc-50"
        >
          <DialogHeader>
            <DialogTitle data-testid="clients-dialog-title">{title}</DialogTitle>
            <DialogDescription data-testid="clients-dialog-desc">
              Preencha os dados principais do cliente.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSave} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <div className="text-xs text-zinc-200/70">Nome *</div>
                <Input
                  data-testid="client-form-name"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="rounded-xl border-white/10 bg-black/30"
                  placeholder="Nome do cliente"
                  required
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs text-zinc-200/70">Telefone</div>
                <Input
                  data-testid="client-form-phone"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  className="rounded-xl border-white/10 bg-black/30"
                  placeholder="(21) 00000-0000"
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs text-zinc-200/70">Endereço</div>
                <Input
                  data-testid="client-form-address"
                  value={form.address}
                  onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                  className="rounded-xl border-white/10 bg-black/30"
                  placeholder="Rua, número"
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs text-zinc-200/70">Cidade</div>
                <Input
                  data-testid="client-form-city"
                  value={form.city}
                  onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                  className="rounded-xl border-white/10 bg-black/30"
                  placeholder="Cidade"
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs text-zinc-200/70">Bairro</div>
                <Input
                  data-testid="client-form-neighborhood"
                  value={form.neighborhood}
                  onChange={(e) => setForm((p) => ({ ...p, neighborhood: e.target.value }))}
                  className="rounded-xl border-white/10 bg-black/30"
                  placeholder="Bairro"
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs text-zinc-200/70">E-mail</div>
                <Input
                  data-testid="client-form-email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="rounded-xl border-white/10 bg-black/30"
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                data-testid="client-form-cancel"
                type="button"
                variant="outline"
                className="rounded-xl border-white/15 bg-white/5 text-zinc-50 hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                data-testid="client-form-submit"
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
