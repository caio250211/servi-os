import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/app/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

const COLLECTION_NAME = "servicos";

function groupByDate(services) {
  const map = new Map();
  services.forEach((s) => {
    const k = String(s.data || "");
    if (!k) return;
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(s);
  });
  const keys = Array.from(map.keys()).sort();
  return keys.map((k) => ({ dateKey: k, items: map.get(k) }));
}

export default function AgendaPage() {
  const { user } = useAuth();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const range = useMemo(() => {
    const today = new Date();
    const from = format(today, "yyyy-MM-dd");
    const to = format(addDays(today, 14), "yyyy-MM-dd");
    return { from, to };
  }, []);

  useEffect(() => {
    (async () => {
      if (!user?.email) return;
      setLoading(true);
      try {
        const qy = query(collection(db, COLLECTION_NAME), where("usuario", "==", user.email));
        const snap = await getDocs(qy);
        const items = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((s) => {
            const dt = String(s.data || "");
            if (!dt) return false;
            return dt >= range.from && dt <= range.to;
          })
          .sort((a, b) => String(a.data || "").localeCompare(String(b.data || "")));
        setServices(items);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.email, range.from, range.to]);

  const grouped = useMemo(() => groupByDate(services), [services]);

  return (
    <div data-testid="agenda-page" className="pb-10">
      <PageHeader title="Agenda" subtitle={`Próximos 14 dias (${range.from} a ${range.to}).`} />

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
                            {s.cliente || "—"}
                          </div>
                          <div
                            data-testid={`agenda-item-type-${s.id}`}
                            className="truncate text-xs text-zinc-200/70"
                          >
                            {s.tipo || "—"}
                          </div>
                          <div
                            data-testid={`agenda-item-local-${s.id}`}
                            className="truncate text-xs text-zinc-200/60"
                          >
                            {s.local || ""}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            data-testid={`agenda-item-status-${s.id}`}
                            className={
                              String(s.status).toLowerCase() === "pago"
                                ? "bg-emerald-500/15 text-emerald-200 border border-emerald-400/20"
                                : "bg-amber-500/15 text-amber-200 border border-amber-400/20"
                            }
                          >
                            {s.status || "—"}
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
