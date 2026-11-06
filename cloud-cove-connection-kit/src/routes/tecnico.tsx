import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Lock, Plus, Send, Trash2 } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { DataState, StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { locate, useData, useRefresh } from "@/hooks/use-data";
import { brl, canComplete, canSubmitQuote, orcamentoTotal, type Peca, type ServiceOrder } from "@/lib/os";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/tecnico")({
  head: () => ({
    meta: [
      { title: "Acesso Técnico em Campo | Ar-Condicionado Lagoa do Piauí" },
      { name: "description", content: "Ordens de serviço ativas para os técnicos em campo." },
      { property: "og:title", content: "Acesso Técnico em Campo" },
      { property: "og:description", content: "Ordens de serviço ativas para os técnicos em campo." },
    ],
  }),
  component: Tecnico,
});

function Tecnico() {
  const q = useData();
  const active = (q.data?.orders ?? []).filter((o) => o.status !== "arquivado" && o.status !== "servico_concluido");
  return (
    <div className="min-h-screen">
      <AppHeader><span className="px-2 font-display font-bold">Técnico em Campo</span></AppHeader>
      <main className="mx-auto max-w-4xl space-y-4 p-4">
        <h1 className="text-2xl font-bold">Ordens de Serviço ativas</h1>
        <DataState isLoading={q.isLoading} error={q.error} />
        {q.data && active.length === 0 && <p className="text-muted-foreground">Nenhuma OS ativa no momento.</p>}
        {q.data && active.map((o) => <OSCard key={o.id} o={o} d={q.data} />)}
      </main>
    </div>
  );
}

function OSCard({ o, d }: { o: ServiceOrder; d: NonNullable<ReturnType<typeof useData>["data"]> }) {
  const refresh = useRefresh();
  const { eq, room, building } = locate(d, o.equipment_id);
  const [tecnico, setTecnico] = useState(o.tecnico_nome ?? "");
  const [diag, setDiag] = useState(o.diagnostico ?? "");
  const [pecas, setPecas] = useState<Peca[]>(o.pecas?.length ? o.pecas : []);
  const [mao, setMao] = useState(String(o.mao_de_obra || ""));
  const [busy, setBusy] = useState(false);
  const total = orcamentoTotal({ pecas, mao_de_obra: Number(mao) });

  const enviar = async () => {
    if (!tecnico.trim() || !diag.trim()) { toast.error("Informe seu nome e o defeito encontrado"); return; }
    setBusy(true);
    const { error } = await supabase.rpc("tecnico_enviar_orcamento", {
      _order_id: o.id, _tecnico: tecnico, _diagnostico: diag,
      _pecas: pecas.filter((p) => p.descricao.trim()), _mao_de_obra: Number(mao) || 0,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Orçamento enviado para a gestão");
    refresh();
  };
  const concluir = async () => {
    setBusy(true);
    const { error } = await supabase.rpc("tecnico_concluir_servico", { _order_id: o.id });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Serviço concluído");
    refresh();
  };
  const editable = canSubmitQuote(o.status);

  return (
    <article className="space-y-3 rounded-xl border bg-card p-4 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-bold">OS nº {o.numero} · Patrimônio {eq?.patrimonio}</h2>
        <StatusBadge status={o.status} />
      </div>
      <p className="text-sm text-muted-foreground">{building?.name} — {room?.name} · {eq?.marca} {eq?.modelo} · {o.tipo}</p>
      <p className="rounded-md bg-muted p-2 text-sm"><b>Queixa:</b> {o.queixa}</p>
      {o.motivo_recusa && <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive"><b>Orçamento recusado:</b> {o.motivo_recusa}</p>}

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1"><Label>Nome do técnico/Empresa</Label><Input disabled={!editable} value={tecnico} onChange={(e) => setTecnico(e.target.value)} /></div>
        <div className="space-y-1"><Label>Mão de obra (R$)</Label><Input disabled={!editable} type="number" min="0" step="0.01" value={mao} onChange={(e) => setMao(e.target.value)} /></div>
      </div>
      <div className="space-y-1"><Label>Defeito encontrado</Label><Textarea disabled={!editable} value={diag} onChange={(e) => setDiag(e.target.value)} /></div>
      <div className="space-y-2">
        <Label>Peças necessárias</Label>
        {pecas.map((p, i) => (
          <div key={i} className="grid grid-cols-[1fr_70px_110px_auto] gap-2">
            <Input disabled={!editable} placeholder="Descrição" value={p.descricao} onChange={(e) => setPecas(pecas.map((x, j) => (j === i ? { ...x, descricao: e.target.value } : x)))} />
            <Input disabled={!editable} type="number" min="1" value={p.quantidade} onChange={(e) => setPecas(pecas.map((x, j) => (j === i ? { ...x, quantidade: Number(e.target.value) } : x)))} />
            <Input disabled={!editable} type="number" min="0" step="0.01" placeholder="R$ unit." value={p.valor_unitario || ""} onChange={(e) => setPecas(pecas.map((x, j) => (j === i ? { ...x, valor_unitario: Number(e.target.value) } : x)))} />
            <Button disabled={!editable} variant="ghost" size="icon" onClick={() => setPecas(pecas.filter((_, j) => j !== i))}><Trash2 className="size-4" /></Button>
          </div>
        ))}
        {editable && <Button variant="outline" size="sm" onClick={() => setPecas([...pecas, { descricao: "", quantidade: 1, valor_unitario: 0 }])}><Plus className="size-4" /> Adicionar peça</Button>}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
        <span className="font-semibold">Orçamento estimado: {brl(total)}</span>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" disabled={!editable || busy} onClick={enviar}><Send className="size-4" /> Enviar Orçamento para Gestão</Button>
          <Button disabled={!canComplete(o.status) || busy} onClick={concluir}>
            {canComplete(o.status) ? <CheckCircle2 className="size-4" /> : <Lock className="size-4" />} Concluir Serviço
          </Button>
        </div>
      </div>
    </article>
  );
}
