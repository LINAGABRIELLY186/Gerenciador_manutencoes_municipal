import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Archive, Check, Plus, X } from "lucide-react";
import { DataState, StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { locate, useData, useRefresh } from "@/hooks/use-data";
import {
  brl,
  dt,
  orcamentoTotal,
  STATUS_LABEL,
  type OSStatus,
  type ServiceOrder,
} from "@/lib/os";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/ordens")({
  head: () => ({
    meta: [
      { title: "Ordens de Serviço | Gestão de Ar-Condicionado" },
      { name: "description", content: "Abertura, autorização e arquivamento de OS." },
      { property: "og:title", content: "Ordens de Serviço" },
      { property: "og:description", content: "Abertura, autorização e arquivamento de OS." },
    ],
  }),
  component: Ordens,
});

const sel = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm";

function Ordens() {
  const q = useData();
  const refresh = useRefresh();
  const [filtro, setFiltro] = useState<OSStatus | "">("");
  const [eqId, setEqId] = useState("");
  const [tipo, setTipo] = useState("corretiva");
  const [queixa, setQueixa] = useState("");

  if (!q.data) return <DataState isLoading={q.isLoading} error={q.error} />;
  const d = q.data;

  const abrir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eqId || !queixa.trim()) {
      toast.error("Selecione o equipamento e descreva a queixa.");
      return;
    }
    const { error } = await supabase
      .from("service_orders")
      .insert({ equipment_id: eqId, tipo, queixa: queixa.trim() });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("OS aberta com sucesso");
    setQueixa("");
    setEqId("");
    refresh();
  };

  const list = d.orders.filter((o) => !filtro || o.status === filtro);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ordens de Serviço</h1>

      {/* Formulário de Abertura de OS */}
      <form
        onSubmit={abrir}
        className="grid gap-3 rounded-xl border bg-card p-4 shadow-card md:grid-cols-[2fr_1fr_3fr_auto] md:items-end"
      >
        <div className="space-y-1">
          <Label>Equipamento (Tombamento / Tipo)</Label>
          <select
            className={sel}
            value={eqId}
            onChange={(e) => setEqId(e.target.value)}
          >
            <option value="">Selecione…</option>
            {d.equipment.map((e) => {
              const l = locate(d, e.id);
              const tomb = e.tombamento ? `[${e.tombamento}] ` : "[S/T] ";
              const specs = [e.marca, e.modelo, e.btus ? `${e.btus} BTUs` : null]
                .filter(Boolean)
                .join(" ");

              return (
                <option key={e.id} value={e.id}>
                  {tomb}
                  {e.patrimonio} {specs ? `(${specs})` : ""} — {l.building?.name || "Sem prédio"} / {l.room?.name || "Sem sala"}
                </option>
              );
            })}
          </select>
        </div>

        <div className="space-y-1">
          <Label>Tipo</Label>
          <select
            className={sel}
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            <option value="corretiva">Corretiva</option>
            <option value="preventiva">Preventiva</option>
          </select>
        </div>

        <div className="space-y-1">
          <Label>Queixa do defeito</Label>
          <Input
            value={queixa}
            onChange={(e) => setQueixa(e.target.value)}
            placeholder="Ex: Não está resfriando, vazando água..."
          />
        </div>

        <Button>
          <Plus className="mr-1 size-4" /> Abrir OS
        </Button>
      </form>

      {/* Filtros por Status */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={filtro === "" ? "default" : "outline"}
          onClick={() => setFiltro("")}
        >
          Todas ({d.orders.length})
        </Button>
        {(Object.keys(STATUS_LABEL) as OSStatus[]).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={filtro === s ? "default" : "outline"}
            onClick={() => setFiltro(s)}
          >
            {STATUS_LABEL[s]} ({d.orders.filter((o) => o.status === s).length})
          </Button>
        ))}
      </div>

      {/* Lista de Ordens de Serviço */}
      <div className="space-y-3">
        {list.map((o) => (
          <OrdemItem key={o.id} o={o} d={d} />
        ))}
      </div>

      {list.length === 0 && (
        <p className="text-muted-foreground">Nenhuma ordem de serviço encontrada.</p>
      )}
    </div>
  );
}

function OrdemItem({
  o,
  d,
}: {
  o: ServiceOrder;
  d: NonNullable<ReturnType<typeof useData>["data"]>;
}) {
  const refresh = useRefresh();
  const { eq, room, building } = locate(d, o.equipment_id);
  const [motivo, setMotivo] = useState("");
  const [valor, setValor] = useState("");
  const [nf, setNf] = useState("");

  const upd = async (patch: Partial<ServiceOrder>, msg: string) => {
    const { error } = await supabase
      .from("service_orders")
      .update(patch)
      .eq("id", o.id)
      .eq("status", o.status);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(msg);
    refresh();
  };

  const arquivar = async () => {
    const v = Number(valor.replace(",", "."));
    if (!valor || !(v >= 0)) {
      toast.error("Informe o Valor Efetivo Final Pago");
      return;
    }
    const { data } = await supabase.auth.getUser();
    upd(
      {
        status: "arquivado",
        valor_final: v,
        nota_fiscal: nf || null,
        arquivado_at: new Date().toISOString(),
        arquivado_por: data.user?.email ?? null,
      },
      "OS arquivada com sucesso"
    );
  };

  const tombDisplay = eq?.tombamento ? `[Tombamento: ${eq.tombamento}] ` : "";

  return (
    <article className="rounded-xl border bg-card p-4 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-bold">
          OS nº {o.numero} ·{" "}
          <Link
            to="/admin/equipamento/$id"
            params={{ id: o.equipment_id }}
            className="text-secondary hover:underline"
          >
            {tombDisplay}{eq?.patrimonio || "Equipamento"}
          </Link>{" "}
          <span className="font-normal text-muted-foreground">
            — {building?.name || "Sem prédio"} / {room?.name || "Sem sala"} · {o.tipo}
          </span>
        </h3>
        <StatusBadge status={o.status} />
      </div>

      <p className="mt-1 text-sm">
        <b>Queixa:</b> {o.queixa}{" "}
        <span className="text-muted-foreground">· aberta em {dt(o.created_at)}</span>
      </p>

      {o.diagnostico && (
        <div className="mt-2 rounded-md bg-muted p-3 text-sm">
          <p>
            <b>Técnico:</b> {o.tecnico_nome || "Não informado"} · <b>Diagnóstico:</b>{" "}
            {o.diagnostico}
          </p>
          {o.pecas?.length > 0 && (
            <ul className="mt-1 list-disc pl-5">
              {o.pecas.map((p, i) => (
                <li key={i}>
                  {p.quantidade}× {p.descricao} — {brl(p.valor_unitario)}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-1">
            Mão de obra: {brl(o.mao_de_obra)} ·{" "}
            <b>Orçamento Total: {brl(orcamentoTotal(o))}</b>
          </p>
        </div>
      )}

      {o.status === "aguardando_autorizacao" && (
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <Button
            onClick={() =>
              upd(
                {
                  status: "autorizado_em_execucao",
                  autorizado_at: new Date().toISOString(),
                },
                "Serviço autorizado"
              )
            }
          >
            <Check className="mr-1 size-4" /> Autorizar Serviço
          </Button>
          <Textarea
            className="min-h-9 flex-1"
            placeholder="Justificativa em caso de recusa..."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
          <Button
            variant="destructive"
            onClick={() =>
              motivo.trim()
                ? upd(
                    { status: "aguardando_visita", motivo_recusa: motivo.trim() },
                    "Orçamento recusado"
                  )
                : toast.error("Informe a justificativa da recusa.")
            }
          >
            <X className="mr-1 size-4" /> Recusar
          </Button>
        </div>
      )}

      {o.status === "servico_concluido" && (
        <div className="mt-3 grid gap-2 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <div className="space-y-1">
            <Label>Valor Efetivo Final Pago (R$) *</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
            />
          </div>
          <div className="space-y-1">
            <Label>Nota fiscal / Empenho</Label>
            <Input
              value={nf}
              onChange={(e) => setNf(e.target.value)}
              placeholder="Ex: NF 1234 / Empenho 2026/045"
            />
          </div>
          <Button onClick={arquivar}>
            <Archive className="mr-1 size-4" /> Arquivar OS
          </Button>
        </div>
      )}

      {o.status === "arquivado" && (
        <p className="mt-2 text-sm">
          <b>Valor final pago: {brl(Number(o.valor_final))}</b>{" "}
          {o.nota_fiscal && `· NF/Empenho: ${o.nota_fiscal}`} · arquivada em{" "}
          {dt(o.arquivado_at)}
        </p>
      )}
    </article>
  );
}