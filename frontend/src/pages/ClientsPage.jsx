import React, { useEffect, useState } from "react";
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
import { toast } from "@/hooks/use-toast";
import { Pencil, Plus, Trash2 } from "lucide-react";

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

const COLLECTION_NAME = "clientes";

const emptyForm = {
  nome: "",
  telefone: "",
  endereco: "",
  cidade: "",
  bairro: "",
  email: "",
};

export default function ClientsPage() {
  const { user } = useAuth();

  const [qText, setQText] = useState("");
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    if (!user?.email) return;
    setLoading(true);

    try {
      const qy = query(collection(db, COLLECTION_NAME), where("usuario", "==", user.email));
      const snap = await getDocs(qy);
      const items = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((c) => {
          if (!qText.trim()) return true;
          const s = qText.trim().toLowerCase();
          return (
            String(c.nome || "").toLowerCase().includes(s) ||
            String(c.telefone || "").toLowerCase().includes(s)
          );
        })
        .sort((a, b) => String(a.nome || "").localeCompare(String(b.nome || "")));
      setClients(items);
    } catch (err) {
      toast({
        title: "Erro ao carregar clientes",
        description:
          err?.message ||
          "Verifique se a collection 'clientes' existe e as regras do Firestore permitem leitura.",
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
      nome: c.nome || "",
      telefone: c.telefone || "",
      endereco: c.endereco || "",
      cidade: c.cidade || "",
      bairro: c.bairro || "",
      email: c.email || "",
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
        nome: String(form.nome || "").trim(),
        usuario: user.email,
        criado: new Date().toISOString(),
      };

      if (!payload.nome) {
        toast({ title: "Nome é obrigatório", variant: "destructive" });
        return;
      }

      if (mode === "create") {
        await addDoc(collection(db, COLLECTION_NAME), payload);
        toast({ title: "Cliente criado", description: "Cliente cadastrado com sucesso." });
      } else {
        await updateDoc(doc(db, COLLECTION_NAME, editingId), payload);
        toast({ title: "Cliente atualizado", description: "Alterações salvas." });
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

  const onDelete = async (c) => {
    const ok = window.confirm(`Excluir o cliente \"${c.nome}\"?`);
    if (!ok) return;

    try {
      await deleteDoc(doc(db, COLLECTION_NAME, c.id));
      toast({ title: "Cliente excluído" });
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
    <div data-testid="clients-page" className="pb-10">
      <PageHeader
        title="Clientes"
        subtitle={`Firebase / Firestore • collection: ${COLLECTION_NAME}`}
        right={
          <Button
            data-testid="clients-new-button"
            onClick={openCreate}
            className="rounded-xl bg-gradient-to-r from-[#dc2626] via-[#e11d48] to-[#f43f5e] text-white hover:from-[#dc2626]/90 hover:via-[#e11d48]/90 hover:to-[#f43f5e]/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo cliente
          </Button>
        }
      />

      <Card data-testid="clients-card" className="rounded-2xl border-white/10 bg-white/5 backdrop-blur-md">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl flex-1">
              <Input
                data-testid="clients-search-input"
                value={qText}
                onChange={(e) => setQText(e.target.value)}
                placeholder="Buscar por nome ou telefone…"
                className="rounded-xl border-white/10 bg-black/30 text-zinc-50 placeholder:text-zinc-200/40"
              />
            </div>
            <div className="flex gap-2">
              <Button
                data-testid="clients-search-button"
                variant="outline"
                className="rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                onClick={() => load()}
              >
                Buscar
              </Button>
              <Button
                data-testid="clients-refresh-button"
                variant="outline"
                className="rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                onClick={() => {
                  setQText("");
                  setTimeout(load, 0);
                }}
              >
                Limpar
              </Button>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/20">
            <Table data-testid="clients-table">
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-zinc-200">Nome</TableHead>
                  <TableHead className="text-zinc-200">Telefone</TableHead>
                  <TableHead className="text-zinc-200">Cidade/Bairro</TableHead>
                  <TableHead className="text-zinc-200">E-mail</TableHead>
                  <TableHead className="text-right text-zinc-200">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow className="border-white/10">
                    <TableCell data-testid="clients-loading" colSpan={5} className="p-6 text-sm text-zinc-200/80">
                      Carregando…
                    </TableCell>
                  </TableRow>
                ) : clients.length === 0 ? (
                  <TableRow className="border-white/10">
                    <TableCell data-testid="clients-empty" colSpan={5} className="p-6 text-sm text-zinc-200/70">
                      Nenhum cliente encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  clients.map((c) => (
                    <TableRow key={c.id} data-testid={`client-row-${c.id}`} className="border-white/10 hover:bg-white/5">
                      <TableCell data-testid={`client-name-${c.id}`} className="text-white font-medium">
                        {c.nome}
                      </TableCell>
                      <TableCell data-testid={`client-phone-${c.id}`} className="text-zinc-100">
                        {c.telefone || "—"}
                      </TableCell>
                      <TableCell data-testid={`client-city-${c.id}`} className="text-zinc-100">
                        {c.cidade || "—"}{c.bairro ? ` / ${c.bairro}` : ""}
                      </TableCell>
                      <TableCell data-testid={`client-email-${c.id}`} className="text-zinc-100">
                        {c.email || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            data-testid={`client-edit-${c.id}`}
                            variant="outline"
                            className="h-9 rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                            onClick={() => openEdit(c)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            data-testid={`client-delete-${c.id}`}
                            variant="outline"
                            className="h-9 rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10"
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
        <DialogContent data-testid="clients-dialog" className="rounded-2xl border-white/10 bg-[#0b0b10] text-zinc-50">
          <DialogHeader>
            <DialogTitle data-testid="clients-dialog-title">{mode === "edit" ? "Editar cliente" : "Novo cliente"}</DialogTitle>
            <DialogDescription data-testid="clients-dialog-desc">Campos básicos para cadastro no Firestore.</DialogDescription>
          </DialogHeader>

          <form onSubmit={onSave} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <div className="text-xs text-zinc-200/80">Nome *</div>
                <Input
                  data-testid="client-form-name"
                  value={form.nome}
                  onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                  className="rounded-xl border-white/10 bg-black/30 text-zinc-50 placeholder:text-zinc-200/40"
                  placeholder="Nome do cliente"
                  required
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs text-zinc-200/80">Telefone</div>
                <Input
                  data-testid="client-form-phone"
                  value={form.telefone}
                  onChange={(e) => setForm((p) => ({ ...p, telefone: e.target.value }))}
                  className="rounded-xl border-white/10 bg-black/30 text-zinc-50 placeholder:text-zinc-200/40"
                  placeholder="(21) 00000-0000"
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <div className="text-xs text-zinc-200/80">Endereço</div>
                <Input
                  data-testid="client-form-address"
                  value={form.endereco}
                  onChange={(e) => setForm((p) => ({ ...p, endereco: e.target.value }))}
                  className="rounded-xl border-white/10 bg-black/30 text-zinc-50 placeholder:text-zinc-200/40"
                  placeholder="Rua, número"
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs text-zinc-200/80">Cidade</div>
                <Input
                  data-testid="client-form-city"
                  value={form.cidade}
                  onChange={(e) => setForm((p) => ({ ...p, cidade: e.target.value }))}
                  className="rounded-xl border-white/10 bg-black/30 text-zinc-50 placeholder:text-zinc-200/40"
                  placeholder="Cidade"
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs text-zinc-200/80">Bairro</div>
                <Input
                  data-testid="client-form-neighborhood"
                  value={form.bairro}
                  onChange={(e) => setForm((p) => ({ ...p, bairro: e.target.value }))}
                  className="rounded-xl border-white/10 bg-black/30 text-zinc-50 placeholder:text-zinc-200/40"
                  placeholder="Bairro"
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <div className="text-xs text-zinc-200/80">E-mail</div>
                <Input
                  data-testid="client-form-email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="rounded-xl border-white/10 bg-black/30 text-zinc-50 placeholder:text-zinc-200/40"
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                data-testid="client-form-cancel"
                type="button"
                variant="outline"
                className="rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                data-testid="client-form-submit"
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
