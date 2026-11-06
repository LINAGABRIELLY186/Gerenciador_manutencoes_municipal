import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Printer } from "lucide-react";
import { Logo } from "@/components/AppHeader";
import { DataState } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { locate, useData } from "@/hooks/use-data";
import { archived, brl, dt } from "@/lib/os";

export const Route = createFileRoute("/admin/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios | Gestão de Ar-Condicionado" },
      { name: "description", content: "Prestação de contas das manutenções." },
      { property: "og:title", content: "Relatórios" },
      { property: "og:description", content: "Prestação de contas das manutenções." },
    ],
  }),
  component: Relatorios,
});

const sel = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm";

function Relatorios() {
  const q = useData();
  const { userEmail } = Route.useRouteContext();
  const [f, setF] = useState({ de: "", ate: "", building: "", equipment: "", tipo: "" });

  if (!q.data) return <DataState isLoading={q.isLoading} error={q.error} />;
  const d = q.data;

  const rows = archived(d.orders).filter((o) => {
    const when = (o.arquivado_at ?? o.created_at).slice(0, 10);
    const l = locate(d, o.equipment_id);
    return (
      (!f.de || when >= f.de) &&
      (!f.ate || when <= f.ate) &&
      (!f.building || l.building?.id === f.building) &&
      (!f.equipment || o.equipment_id === f.equipment) &&
      (!f.tipo || o.tipo === f.tipo)
    );
  });

  const total = rows.reduce((t, o) => t + Number(o.valor_final), 0);

  const selectedEq = d.equipment.find((e) => e.id === f.equipment);
  const eqDesc = selectedEq
    ? `${selectedEq.tombamento ? `[${selectedEq.tombamento}] ` : ""}${selectedEq.patrimonio}`
    : "todos";

  const filtros = [
    f.de || f.ate ? `Período: ${f.de || "início"} a ${f.ate || "hoje"}` : "Período: todos",
    `Prédio: ${d.buildings.find((b) => b.id === f.building)?.name ?? "todos"}`,
    `Equipamento: ${eqDesc}`,
    `Tipo: ${f.tipo || "todos"}`,
  ].join(" · ");

  return (
    <div className="space-y-4">
      {/* Estilos dedicados para impressão e PDF */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm 12mm;
          }
          body {
            background: white !important;
            color: black !important;
            font-size: 11px !important;
          }
          .no-print {
            display: none !important;
          }
          .print-sheet {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            overflow: visible !important;
            width: 100% !important;
          }
          table {
            width: 100% !important;
            table-layout: fixed !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          thead {
            display: table-header-group !important;
          }
          tfoot {
            display: table-footer-group !important;
          }
          .signature-block {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Barra de Filtros */}
      <div className="no-print space-y-4">
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <div className="grid gap-3 rounded-xl border bg-card p-4 shadow-card md:grid-cols-6 md:items-end">
          <div>
            <Label>De</Label>
            <Input type="date" value={f.de} onChange={(e) => setF({ ...f, de: e.target.value })} />
          </div>
          <div>
            <Label>Até</Label>
            <Input type="date" value={f.ate} onChange={(e) => setF({ ...f, ate: e.target.value })} />
          </div>
          <div>
            <Label>Prédio / Secretaria</Label>
            <select
              className={sel}
              value={f.building}
              onChange={(e) => setF({ ...f, building: e.target.value })}
            >
              <option value="">Todos</option>
              {d.buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Equipamento</Label>
            <select
              className={sel}
              value={f.equipment}
              onChange={(e) => setF({ ...f, equipment: e.target.value })}
            >
              <option value="">Todos</option>
              {d.equipment.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.tombamento ? `[${e.tombamento}] ` : "[S/T] "}
                  {e.patrimonio}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Tipo</Label>
            <select
              className={sel}
              value={f.tipo}
              onChange={(e) => setF({ ...f, tipo: e.target.value })}
            >
              <option value="">Todos</option>
              <option value="preventiva">Preventiva</option>
              <option value="corretiva">Corretiva</option>
            </select>
          </div>
          <Button onClick={() => window.print()}>
            <Printer className="size-4 mr-2" /> Imprimir / PDF
          </Button>
        </div>
      </div>

      {/* Folha do Relatório */}
      <div className="print-sheet overflow-x-auto rounded-xl border bg-card p-4 shadow-card print:p-0 print:border-none print:shadow-none">
        {/* Cabeçalho de Impressão */}
        <div className="hidden print:block mb-4 border-b pb-3 text-center">
          <div className="flex justify-center">
            <Logo className="h-14 object-contain" />
          </div>
          <h1 className="mt-2 text-sm font-bold tracking-tight uppercase">
            Prestação de Contas e Gestão de Custos de Manutenções
          </h1>
          <div className="mt-1 flex flex-wrap justify-center gap-x-4 text-[10px] text-muted-foreground print:text-neutral-600">
            <span>Emitido em {new Date().toLocaleString("pt-BR")}</span>
            <span>Operador: {userEmail}</span>
          </div>
          <p className="mt-1 text-[11px] font-medium print:text-neutral-800">{filtros}</p>
        </div>

        {/* Tabela de Dados */}
        <table className="w-full text-xs text-left">
          <thead className="border-b bg-muted/40 font-semibold print:bg-transparent print:border-neutral-800">
            <tr>
              <th className="py-1.5 px-2 w-[70px]">OS</th>
              <th className="py-1.5 px-2 w-[85px]">Arquivada em</th>
              <th className="py-1.5 px-2 w-[95px]">Tombamento</th>
              <th className="py-1.5 px-2">Equipamento</th>
              <th className="py-1.5 px-2">Prédio / Sala</th>
              <th className="py-1.5 px-2 w-[80px]">Tipo</th>
              <th className="py-1.5 px-2">Técnico</th>
              <th className="py-1.5 px-2 w-[95px]">NF/Empenho</th>
              <th className="py-1.5 px-2 text-right w-[95px]">Valor pago</th>
            </tr>
          </thead>
          <tbody className="divide-y print:divide-neutral-300">
            {rows.map((o) => {
              const l = locate(d, o.equipment_id);
              return (
                <tr key={o.id} className="hover:bg-muted/30">
                  <td className="py-1 px-2 font-mono">{o.numero}</td>
                  <td className="py-1 px-2">{dt(o.arquivado_at)}</td>
                  <td className="py-1 px-2 font-mono font-medium">
                    {l.eq?.tombamento || <span className="text-muted-foreground italic">S/T</span>}
                  </td>
                  <td className="py-1 px-2 truncate max-w-[150px]">{l.eq?.patrimonio}</td>
                  <td className="py-1 px-2 truncate max-w-[170px]">
                    {l.building?.name} / {l.room?.name}
                  </td>
                  <td className="py-1 px-2 capitalize">{o.tipo}</td>
                  <td className="py-1 px-2 truncate max-w-[130px]">{o.tecnico_nome}</td>
                  <td className="py-1 px-2">{o.nota_fiscal ?? "—"}</td>
                  <td className="py-1 px-2 text-right font-medium">{brl(Number(o.valor_final))}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-neutral-900 font-bold">
              <td colSpan={8} className="py-2 px-2 text-xs">
                TOTAL DE DESPESAS ({rows.length} {rows.length === 1 ? "OS" : "OSs"})
              </td>
              <td className="py-2 px-2 text-right text-sm">{brl(total)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Bloco de Assinaturas */}
        <div className="signature-block hidden print:block mt-14">
          <div className="grid grid-cols-2 gap-20 text-center text-[11px]">
            <div className="border-t border-black pt-1">Gestor Municipal</div>
            <div className="border-t border-black pt-1">Responsável Técnico</div>
          </div>
        </div>
      </div>
    </div>
  );
}