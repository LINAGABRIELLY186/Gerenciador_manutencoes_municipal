import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AirVent } from "lucide-react";
import { DataState } from "@/components/StatusBadge";
import { useData } from "@/hooks/use-data";
import { equipState, type EquipState } from "@/lib/os";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/mapa")({
  head: () => ({ meta: [{ title: "Mapa por Prédio | Gestão de Ar-Condicionado" }, { name: "description", content: "Situação dos aparelhos por sala." }, { property: "og:title", content: "Mapa por Prédio" }, { property: "og:description", content: "Situação dos aparelhos por sala." }] }),
  component: Mapa,
});

const tone: Record<EquipState, string> = {
  operando: "bg-success text-success-foreground",
  manutencao: "bg-warning text-warning-foreground",
  critico: "bg-destructive text-destructive-foreground",
};

function Mapa() {
  const q = useData();
  const [bid, setBid] = useState("");
  if (!q.data) return <DataState isLoading={q.isLoading} error={q.error} />;
  const d = q.data;
  const current = bid || d.buildings[0]?.id;
  const rooms = d.rooms.filter((r) => r.building_id === current);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Mapa Visual por Prédio</h1>
      <div className="flex flex-wrap gap-2">
        {d.buildings.map((b) => (
          <button key={b.id} onClick={() => setBid(b.id)} className={cn("rounded-full border px-3 py-1 text-sm", b.id === current ? "bg-primary text-primary-foreground" : "bg-card")}>{b.name}</button>
        ))}
      </div>
      <div className="flex gap-4 text-xs">
        <span className="flex items-center gap-1"><i className="size-3 rounded-full bg-success" /> Operando</span>
        <span className="flex items-center gap-1"><i className="size-3 rounded-full bg-warning" /> Em manutenção</span>
        <span className="flex items-center gap-1"><i className="size-3 rounded-full bg-destructive" /> Defeito crítico</span>
      </div>
      {d.buildings.length === 0 && <p className="text-muted-foreground">Cadastre prédios, salas e equipamentos em Cadastros.</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {rooms.map((r) => (
          <div key={r.id} className="rounded-xl border-2 border-dashed bg-card p-3">
            <h3 className="text-sm font-bold">{r.name}</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {d.equipment.filter((e) => e.room_id === r.id).map((e) => (
                <Link key={e.id} to="/admin/equipamento/$id" params={{ id: e.id }} title={e.patrimonio}
                  className={cn("flex flex-col items-center rounded-lg px-2 py-1.5 text-[10px] font-semibold transition hover:scale-105", tone[equipState(e, d.orders)])}>
                  <AirVent className="size-6" />{e.patrimonio}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
