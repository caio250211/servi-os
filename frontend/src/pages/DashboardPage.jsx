import React, { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
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

function currencyBR(v) {
  const n = Number(v || 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const monthRange = useMemo(() => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      from: format(from, "yyyy-MM-dd"),
      to: format(to, "yyyy-MM-dd"),
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [s, list] = await Promise.all([
          api.get("/dashboard/summary"),
          api.get("/services", {
            params: { from: monthRange.from, to: monthRange.to },
          }),
        ]);
        setSummary(s.data);
        setServices(list.data.slice(0, 8));
      } finally {
        setLoading(false);
      }
    })();
  }, [monthRange.from, monthRange.to]);

  return (
    <div data-testid="dashboard-page" className="pb-10">
      <PageHeader
        title="Dashboard"
        subtitle="Resumo rápido do mês e últimos serviços lançados."
      />

      <div
        data-testid="dashboard-stats"
        className="grid grid-cols-1 gap-4 md:grid-cols-4"
      >
        <StatCard
          testid="stat-clients"
          title="Clientes"
          value={loading ? "—" : summary?.clients_total ?? 0}
          hint="Total cadastrados"
        />
        <StatCard
          testid="stat-services-month"
          title="Serviços no mês"
          value={loading ? "—" : summary?.services_month ?? 0}
          hint={`Período ${monthRange.from} a ${monthRange.to}`}
        />
        <StatCard
          testid="stat-pending"
          title="Pendentes"
          value={loading ? "—" : summary?.pending_month ?? 0}
          hint="Acompanhe o que falta concluir"
        />
        <StatCard
          testid="stat-revenue"
          title="Receita (concluídos)"
          value={loading ? "—" : currencyBR(summary?.revenue_month)}
          hint="Somente status CONCLUÍDO"
        />
      </div>

      <Card
        data-testid="dashboard-recent-services"
        className="mt-6 rounded-2xl border-white/10 bg-white/5 backdrop-blur-md"
      >
        <CardHeader>
          <CardTitle data-testid="dashboard-recent-services-title">
            Últimos serviços
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border border-white/10">
            <Table data-testid="dashboard-services-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente (ID)</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.length === 0 ? (
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
                  services.map((s) => (
                    <TableRow key={s.id} data-testid={`dashboard-service-row-${s.id}`}>
                      <TableCell data-testid={`dashboard-service-date-${s.id}`}>
                        {format(new Date(s.date), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell data-testid={`dashboard-service-client-${s.id}`}>
                        {s.client_id}
                      </TableCell>
                      <TableCell data-testid={`dashboard-service-type-${s.id}`}>
                        {s.service_type}
                      </TableCell>
                      <TableCell data-testid={`dashboard-service-status-${s.id}`}>
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
                      <TableCell
                        data-testid={`dashboard-service-value-${s.id}`}
                        className="text-right"
                      >
                        {currencyBR(s.value)}
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
