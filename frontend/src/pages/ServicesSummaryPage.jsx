import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/app/PageHeader";
import StatCard from "@/components/app/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";

import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { monthKeyFromDateValue, normalizeDateToYMD } from "@/lib/firestoreDate";

const SERVICES_COLLECTION = "servicos";

function parseMoney(valor) {
  return Number(String(valor || "0").replace(",", ".")) || 0;
}

// (removido) agora usamos monthKeyFromDateValue, que normaliza Timestamp/ISO/string

export default function ServicesSummaryPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);

  useEffect(() => {
    (async () => {
      if (!user?.email) return;
      setLoading(true);
      try {
        const qy = query(collection(db, SERVICES_COLLECTION), where("usuario", "==", user.email));
        const snap = await getDocs(qy);
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setServices(items);
      } catch (e) {
        toast({
          title: "Erro ao carregar resumo",
          description: e?.message || "Tente novamente.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.email]);

  const insights = useMemo(() => {
    const all = services;

    const revenueByMonth = new Map();
    const countByTipo = new Map();
    const countByStatus = new Map();

    let totalRevenuePaid = 0;

    all.forEach((s) => {
      const status = String(s.status || "");
      const tipo = String(s.tipo || "Sem tipo");
      const month = monthKeyFromDateValue(s.data);
      const money = parseMoney(s.valor);

      countByTipo.set(tipo, (countByTipo.get(tipo) || 0) + 1);
      countByStatus.set(status, (countByStatus.get(status) || 0) + 1);

      if (status.toLowerCase() === "pago") {
        totalRevenuePaid += money;
        if (month) revenueByMonth.set(month, (revenueByMonth.get(month) || 0) + money);
      }
    });

    let bestMonth = "—";
    let bestMonthValue = 0;
    for (const [m, v] of revenueByMonth.entries()) {
      if (v > bestMonthValue) {
        bestMonth = m;
        bestMonthValue = v;
      }
    }

    let topTipo = "—";
    let topTipoCount = 0;
    for (const [t, c] of countByTipo.entries()) {
      if (c > topTipoCount) {
        topTipo = t;
        topTipoCount = c;
      }
    }

    const topTipos = Array.from(countByTipo.entries())
      .map(([tipo, count]) => ({ tipo, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const monthsRanking = Array.from(revenueByMonth.entries())
      .map(([month, value]) => ({ month, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 24);

    return {
      totalServices: all.length,
      totalRevenuePaid,
      bestMonth,
      bestMonthValue,
      topTipo,
      topTipoCount,
      topTipos,
      monthsRanking,
      countByStatus,
    };
  }, [services]);

  const moneyBR = (v) =>
    Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div data-testid="services-summary-page" className="pb-10">
      <PageHeader
        title="Resumo"
        subtitle="Insights rápidos: mês que mais faturou, serviço mais feito e rankings."
      />

      <div data-testid="summary-stats" className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard
          testid="summary-total-services"
          title="Total de serviços"
          value={loading ? "—" : insights.totalServices}
          hint="Todos os registros"
        />
        <StatCard
          testid="summary-total-revenue"
          title="Receita (Pagos)"
          value={loading ? "—" : moneyBR(insights.totalRevenuePaid)}
          hint="Somente status Pago"
        />
        <StatCard
          testid="summary-best-month"
          title="Melhor mês (Pagos)"
          value={loading ? "—" : insights.bestMonth}
          hint={loading ? "" : moneyBR(insights.bestMonthValue)}
        />
        <StatCard
          testid="summary-top-tipo"
          title="Serviço mais feito"
          value={loading ? "—" : insights.topTipo}
          hint={loading ? "" : `${insights.topTipoCount} ocorrência(s)`}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card
          data-testid="summary-top-tipos-card"
          className="rounded-2xl border-white/10 bg-white/5 backdrop-blur-md"
        >
          <CardHeader>
            <CardTitle data-testid="summary-top-tipos-title">Top serviços (tipo)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
              <Table data-testid="summary-top-tipos-table">
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-zinc-200">Tipo</TableHead>
                    <TableHead className="text-right text-zinc-200">Qtd</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow className="border-white/10">
                      <TableCell data-testid="summary-top-tipos-loading" colSpan={2} className="p-6 text-sm text-zinc-200/80">
                        Carregando…
                      </TableCell>
                    </TableRow>
                  ) : insights.topTipos.length === 0 ? (
                    <TableRow className="border-white/10">
                      <TableCell data-testid="summary-top-tipos-empty" colSpan={2} className="p-6 text-sm text-zinc-200/70">
                        Sem dados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    insights.topTipos.map((t) => (
                      <TableRow key={t.tipo} data-testid={`summary-tipo-row-${t.tipo}`} className="border-white/10 hover:bg-white/5">
                        <TableCell data-testid={`summary-tipo-name-${t.tipo}`} className="text-white font-medium">
                          {t.tipo}
                        </TableCell>
                        <TableCell data-testid={`summary-tipo-count-${t.tipo}`} className="text-right text-zinc-100">
                          <Badge className="bg-white/10 text-white border border-white/10">{t.count}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card
          data-testid="summary-best-months-card"
          className="rounded-2xl border-white/10 bg-white/5 backdrop-blur-md"
        >
          <CardHeader>
            <CardTitle data-testid="summary-best-months-title">Ranking de meses (Pagos)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
              <Table data-testid="summary-months-table">
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-zinc-200">Mês</TableHead>
                    <TableHead className="text-right text-zinc-200">Receita</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow className="border-white/10">
                      <TableCell data-testid="summary-months-loading" colSpan={2} className="p-6 text-sm text-zinc-200/80">
                        Carregando…
                      </TableCell>
                    </TableRow>
                  ) : insights.monthsRanking.length === 0 ? (
                    <TableRow className="border-white/10">
                      <TableCell data-testid="summary-months-empty" colSpan={2} className="p-6 text-sm text-zinc-200/70">
                        Sem dados de pagos.
                      </TableCell>
                    </TableRow>
                  ) : (
                    insights.monthsRanking.map((m) => (
                      <TableRow key={m.month} data-testid={`summary-month-row-${m.month}`} className="border-white/10 hover:bg-white/5">
                        <TableCell data-testid={`summary-month-name-${m.month}`} className="text-white font-medium">
                          {m.month}
                        </TableCell>
                        <TableCell data-testid={`summary-month-value-${m.month}`} className="text-right text-zinc-100">
                          {moneyBR(m.value)}
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

      <div className="mt-6" data-testid="summary-status-box">
        <div className="text-xs text-zinc-200/70">
          Status encontrados: {Array.from(insights.countByStatus.keys()).filter(Boolean).join(", ") || "—"}
        </div>
        <div data-testid="summary-date-note" className="mt-1 text-xs text-zinc-200/60">
          Observação: a data é normalizada (Timestamp / ISO / dd/mm/aaaa → yyyy-mm-dd) para calcular ano e mês.
        </div>
      </div>
    </div>
  );
}
