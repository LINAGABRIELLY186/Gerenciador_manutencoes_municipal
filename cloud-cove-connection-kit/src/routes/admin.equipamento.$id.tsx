import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { DataState, StatusBadge } from "@/components/StatusBadge";
import { locate, useData } from "@/hooks/use-data";
import { brl, dt, isAntieconomico, spentOn } from "@/lib/os";

export const Route = createFileRoute("/admin/equipamento/$id")({
  head: () => ({ meta: [{ title: "Ficha do Equipamento | Gestão de Ar-Condicionado" }, { name: "description", content: "Histórico e custos acumulados do aparelho." }, { property: "og:title", content: "Ficha do Equipamento" }, { property: "og:description", content: "Histórico e custos acumulados do aparelho." }] }),
  component: Ficha,
});

function Ficha() {
  const { id } = Route.useParams();
  const q = useData();
  if (!q.data) return <DataState isLoading={q.isLoading} error={q.error} />;
  const d = q.data;
  const { eq, room, building } = locate(d, id);
  if (!eq) return <p>Equipamento não encontrado.</p>;
  const total = spentOn(d.orders, id);
  const hist = d.orders.filter((o) => o.equipment_id === id);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Patrimônio {eq.patrimonio}</h1>
      <p className="text-muted-foreground">{building?.name} / {room?.name} · {eq.marca} {eq.modelo} {eq.btus ? `· ${eq.btus} BTUs` : ""}</p>
      {isAntieconomico(eq, d.orders) && (
        <div className="flex items-center gap-2 rounded-xl bg-destructive p-4 font-bold text-destructive-foreground"><AlertTriangle /> Aparelho Antieconômico / Recomendada Substituição</div>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <Box l="Gasto acumulado (arquivadas)" v={brl(total)} />
        <Box l="Valor de um aparelho novo" v={brl(eq.valor_novo)} />
        <Box l="% do valor de um novo" v={eq.valor_novo > 0 ? `${((total / eq.valor_novo) * 100).toFixed(0)}%` : "—"} />
      </div>
      <section className="overflow-x-auto rounded-xl border bg-card p-4 shadow-card">
        <h2 className="mb-2 font-bold">Histórico de manutenções</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground"><tr><th className="py-2">OS</th><th>Data</th><th>Tipo</th><th>Queixa / Diagnóstico</th><th>Status</th><th className="text-right">Valor pago</th></tr></thead>
          <tbody className="divide-y">
            {hist.map((o) => (
              <tr key={o.id}><td className="py-2">{o.numero}</td><td>{dt(o.arquivado_at ?? o.created_at)}</td><td className="capitalize">{o.tipo}</td>
                <td>{o.queixa}{o.diagnostico && <span className="block text-muted-foreground">{o.diagnostico}</span>}</td>
                <td><StatusBadge status={o.status} /></td><td className="text-right">{o.valor_final != null ? brl(Number(o.valor_final)) : "—"}</td></tr>
            ))}
          </tbody>
        </table>
        {hist.length === 0 && <p className="text-sm text-muted-foreground">Sem manutenções.</p>}
      </section>
    </div>
  );
}
const Box = ({ l, v }: { l: string; v: string }) => (
  <div className="rounded-xl border bg-card p-4 shadow-card"><p className="text-xs uppercase text-muted-foreground">{l}</p><p className="font-display text-2xl font-extrabold">{v}</p></div>
);
