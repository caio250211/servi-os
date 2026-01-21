import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/app/PageHeader";
import StatCard from "@/components/app/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

const SERVICES_COLLECTION = "servicos";
const CLIENTS_COLLECTION = "clientes";

function currencyBR(v) {
  const n = Number(String(v || "0").replace(",", "."));
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function DashboardPage() {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    clients_total: 0,
    services_month: 0,
    pending_month: 0,
    revenue_month: 0,
  });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  const monthRange = useMemo(() => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      from: format(from, "yyyy-MM-dd"),
      to: format(to, "yyyy-MM-dd"),
      month: format(from, "yyyy-MM"),
    };
  }, []);

  useEffect(() => {
    (async () => {
      if (!user?.email) return;
      setLoading(true);
      try {
        const sq = query(collection(db, SERVICES_COLLECTION), where("usuario", "==", user.email));
        const servicesSnap = await getDocs(sq);
        const services = servicesSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => String(b.data || "").localeCompare(String(a.data || "")));

        const inMonth = services.filter((s) => {
          const dt = String(s.data || "");
          return dt >= monthRange.from && dt <= monthRange.to;
        });

        const revenue = inMonth
          .filter((s) => String(s.status).toLowerCase() === "pago")
          .reduce((acc, s) => acc + Number(String(s.valor || "0").replace(",", ".")), 0);

        const pending = inMonth.filter((s) => String(s.status).toLowerCase() !== "pago");

        let clientsTotal = 0;
        try {
          const cq = query(collection(db, CLIENTS_COLLECTION), where("usuario", "==", user.email));
          const clientsSnap = await getDocs(cq);
          clientsTotal = clientsSnap.size;
        } catch (e) {
          clientsTotal = 0;
        }

        setStats({
          clients_total: clientsTotal,
          services_month: inMonth.length,
          pending_month: pending.length,
          revenue_month: revenue,
        });

        setRecent(services.slice(0, 8));
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.email, monthRange.from, monthRange.to]);

  return (
    <div data-testid="dashboard-page" className="pb-10">
      <PageHeader title="Dashboard" subtitle="Resumo do Firebase (seus serviços por Gmail)." />

      <div data-testid="dashboard-stats" className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard
          testid="stat-clients"
          title="Clientes"
          value={loading ? "—" : stats.clients_total}
          hint="Total (collection clientes)"
        />
        <StatCard
          testid="stat-services-month"
          title="Serviços no mês"
          value={loading ? "—" : stats.services_month}
          hint={`Período ${monthRange.from} a ${monthRange.to}`}
        />
        <StatCard
          testid="stat-pending"
          title="Pendentes"
          value={loading ? "—" : stats.pending_month}
          hint="Status diferente de Pago"
        />
        <StatCard
          testid="stat-revenue"
          title="Receita (Pagos)"
          value={loading ? "—" : currencyBR(stats.revenue_month)}
          hint="Somente status Pago"
        />
      </div>

      <Card
        data-testid="dashboard-recent-services"
        className="mt-6 rounded-2xl border-white/10 bg-white/5 backdrop-blur-md"
      >
        <CardHeader>
          <CardTitle data-testid="dashboard-recent-services-title">Últimos serviços</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border border-white/10">
            <Table data-testid="dashboard-services-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.length === 0 ? (
                  <TableRow>
                    <TableCell
                      data-testid="dashboard-services-empty"
                      colSpan={5}
                      className="p-6 text-sm text-zinc-200/60"
                    >
                      Nenhum serviço encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  recent.map((s) => (
                    <TableRow key={s.id} data-testid={`dashboard-service-row-${s.id}`}>
                      <TableCell data-testid={`dashboard-service-date-${s.id}`}>
                        {s.data
                          ? format(new Date(s.data), "dd/MM/yyyy", { locale: ptBR })
                          : "—"}
                      </TableCell>
                      <TableCell data-testid={`dashboard-service-client-${s.id}`}>
                        {s.cliente || "—"}
                      </TableCell>
                      <TableCell data-testid={`dashboard-service-type-${s.id}`}>{s.tipo || "—"}</TableCell>
                      <TableCell data-testid={`dashboard-service-status-${s.id}`}>
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
                      <TableCell data-testid={`dashboard-service-value-${s.id}`} className="text-right">
                        {currencyBR(s.valor)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
