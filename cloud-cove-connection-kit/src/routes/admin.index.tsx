import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { AlertTriangle } from "lucide-react";
import { DataState } from "@/components/StatusBadge";
import { locate, useData } from "@/hooks/use-data";
import { archived, brl, isAntieconomico, spentOn } from "@/lib/os";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Painel | Gestão de Ar-Condicionado" }, { name: "description", content: "Indicadores de custos de manutenção." }, { property: "og:title", content: "Painel de custos" }, { property: "og:description", content: "Indicadores de custos de manutenção." }] }),
  component: Painel,
});

function Painel() {
  const q = useData();
  if (!q.data) return <DataState isLoading={q.isLoading} error={q.error} />;
  const d = q.data;
  const arq = archived(d.orders);
  const now = new Date();
  const when = (o: (typeof arq)[number]) => new Date(o.arquivado_at ?? o.created_at);
  const mes = arq.filter((o) => when(o).getMonth() === now.getMonth() && when(o).getFullYear() === now.getFullYear()).reduce((t, o) => t + Number(o.valor_final), 0);
  const ano = arq.filter((o) => when(o).getFullYear() === now.getFullYear()).reduce((t, o) => t + Number(o.valor_final), 0);

  const porPredio = new Map<string, number>();
  arq.forEach((o) => {
    const { building } = locate(d, o.equipment_id);
    const k = building ? `${building.name}${building.secretaria ? ` (${building.secretaria})` : ""}` : "—";
    porPredio.set(k, (porPredio.get(k) ?? 0) + Number(o.valor_final));
  });
  const predios = [...porPredio].map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total).slice(0, 8);
  const ranking = d.equipment.map((e) => ({ e, total: spentOn(d.orders, e.id) })).filter((x) => x.total > 0).sort((a, b) => b.total - a.total).slice(0, 5);
  const tipos = ["preventiva", "corretiva"].map((t) => ({ name: t === "preventiva" ? "Preventiva" : "Corretiva", value: arq.filter((o) => o.tipo === t).reduce((s, o) => s + Number(o.valor_final), 0) }));
  const alertas = d.equipment.filter((e) => isAntieconomico(e, d.orders));
  const pend = d.orders.filter((o) => o.status === "aguardando_autorizacao").length;
  const concl = d.orders.filter((o) => o.status === "servico_concluido").length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Painel de Custos</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Gasto no mês" value={brl(mes)} />
        <Kpi label="Gasto no ano" value={brl(ano)} />
        <Kpi label="Orçamentos aguardando autorização" value={String(pend)} tone="warning" />
        <Kpi label="Concluídas aguardando arquivamento" value={String(concl)} tone="warning" />
      </div>
      {alertas.length > 0 && (
        <div className="rounded-xl border border-destructive bg-destructive/10 p-4">
          <p className="flex items-center gap-2 font-bold text-destructive"><AlertTriangle className="size-5" /> Aparelho Antieconômico / Recomendada Substituição</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {alertas.map((e) => <Link key={e.id} to="/admin/equipamento/$id" params={{ id: e.id }} className="rounded-md bg-destructive px-2 py-1 text-xs font-semibold text-destructive-foreground">{e.patrimonio}</Link>)}
          </div>
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Prédios / Secretarias com maiores despesas">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={predios} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={140} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
              <Tooltip formatter={(v: number) => brl(v)} contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)" }} />
              <Bar dataKey="total" fill="var(--chart-1)" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Preventiva vs. Corretiva (R$)">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={tipos} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95}>
                <Cell fill="var(--chart-5)" /><Cell fill="var(--chart-4)" />
              </Pie>
              <Legend /><Tooltip formatter={(v: number) => brl(v)} contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)" }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
      </div>
      <Panel title="Top 5 aparelhos que mais geram despesas">
        {ranking.length === 0 && <p className="text-sm text-muted-foreground">Sem OS arquivadas ainda.</p>}
        <ol className="divide-y">
          {ranking.map(({ e, total }, i) => {
            const { room, building } = locate(d, e.id);
            return (
              <li key={e.id} className="flex items-center justify-between py-2 text-sm">
                <Link to="/admin/equipamento/$id" params={{ id: e.id }} className="hover:underline">{i + 1}. <b>{e.patrimonio}</b> — {building?.name} / {room?.name}</Link>
                <b>{brl(total)}</b>
              </li>
            );
          })}
        </ol>
      </Panel>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: "warning" }) {
  return (
    <div className={`rounded-xl border bg-card p-4 shadow-card ${tone ? "border-l-4 border-l-warning" : "border-l-4 border-l-primary"}`}>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-extrabold">{value}</p>
    </div>
  );
}
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-xl border bg-card p-4 shadow-card"><h2 className="mb-3 font-bold">{title}</h2>{children}</section>;
}
