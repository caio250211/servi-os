import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/app/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

function groupByDate(services) {
  const map = new Map();
  services.forEach((s) => {
    const k = format(new Date(s.date), "yyyy-MM-dd");
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(s);
  });
  const keys = Array.from(map.keys()).sort();
  return keys.map((k) => ({ dateKey: k, items: map.get(k) }));
}

export default function AgendaPage() {
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const range = useMemo(() => {
    const today = new Date();
    const from = format(today, "yyyy-MM-dd");
    const to = format(addDays(today, 14), "yyyy-MM-dd");
    return { from, to };
  }, []);

  const clientNameById = useMemo(() => {
    const map = new Map();
    clients.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [clients]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [c, s] = await Promise.all([
          api.get("/clients"),
          api.get("/services", { params: { from: range.from, to: range.to } }),
        ]);
        setClients(c.data);
        setServices(s.data);
      } finally {
        setLoading(false);
      }
    })();
  }, [range.from, range.to]);

  const grouped = useMemo(() => groupByDate(services), [services]);

  return (
    <div data-testid="agenda-page" className="pb-10">
      <PageHeader
        title="Agenda"
        subtitle={`Próximos 14 dias (${range.from} a ${range.to}).`}
      />

      <Card
        data-testid="agenda-card"
        className="rounded-2xl border-white/10 bg-white/5 backdrop-blur-md"
      >
        <CardContent className="p-4">
          {loading ? (
            <div data-testid="agenda-loading" className="p-4 text-sm text-zinc-200/70">
              Carregando…
            </div>
          ) : grouped.length === 0 ? (
            <div data-testid="agenda-empty" className="p-4 text-sm text-zinc-200/60">
              Nenhum serviço agendado nesse período.
            </div>
          ) : (
            <div className="space-y-4">
              {grouped.map((g) => (
                <div
                  key={g.dateKey}
                  data-testid={`agenda-day-${g.dateKey}`}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div
                      data-testid={`agenda-day-title-${g.dateKey}`}
                      className="text-sm font-semibold"
                    >
                      {format(new Date(g.dateKey), "EEEE, dd/MM", { locale: ptBR })}
                    </div>
                    <div
                      data-testid={`agenda-day-count-${g.dateKey}`}
                      className="text-xs text-zinc-200/70"
                    >
                      {g.items.length} serviço(s)
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {g.items.map((s) => (
                      <div
                        key={s.id}
                        data-testid={`agenda-item-${s.id}`}
                        className="flex flex-col gap-1 rounded-xl border border-white/10 bg-white/5 p-3 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="min-w-0">
                          <div
                            data-testid={`agenda-item-client-${s.id}`}
                            className="truncate text-sm font-medium"
                          >
                            {clientNameById.get(s.client_id) || s.client_id}
                          </div>
                          <div
                            data-testid={`agenda-item-type-${s.id}`}
                            className="truncate text-xs text-zinc-200/70"
                          >
                            {s.service_type}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            data-testid={`agenda-item-status-${s.id}`}
                            className={
                              s.status === "CONCLUIDO"
                                ? "bg-emerald-500/15 text-emerald-200 border border-emerald-400/20"
                                : "bg-amber-500/15 text-amber-200 border border-amber-400/20"
                            }
                          >
                            {s.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
