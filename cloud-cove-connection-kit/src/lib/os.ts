export type OSStatus =
  | "aguardando_visita"
  | "aguardando_autorizacao"
  | "autorizado_em_execucao"
  | "servico_concluido"
  | "arquivado";

export interface Peca {
  descricao: string;
  quantidade: number;
  valor_unitario: number;
}

export interface Building {
  id: string;
  name: string;
  secretaria: string | null;
}

export interface Room {
  id: string;
  building_id: string;
  name: string;
}

export interface Equipment {
  id: string;
  room_id: string;
  patrimonio: string;          // Nome ou tipo do equipamento (ex: "Ar-condicionado", "Geladeira")
  tombamento?: string | null;  // Identificador único / Número de Tombamento
  marca: string | null;
  modelo: string | null;
  btus: number | null;
  valor_novo: number;
  critico: boolean;
}

export interface ServiceOrder {
  id: string;
  numero: number;
  equipment_id: string;
  tipo: "corretiva" | "preventiva";
  queixa: string;
  status: OSStatus;
  tecnico_nome: string | null;
  diagnostico: string | null;
  pecas: Peca[];
  mao_de_obra: number;
  motivo_recusa: string | null;
  valor_final: number | null;
  nota_fiscal: string | null;
  arquivado_por: string | null;
  created_at: string;
  orcamento_at: string | null;
  autorizado_at: string | null;
  concluido_at: string | null;
  arquivado_at: string | null;
}

export const STATUS_LABEL: Record<OSStatus, string> = {
  aguardando_visita: "Aguardando visita",
  aguardando_autorizacao: "Aguardando autorização",
  autorizado_em_execucao: "Autorizado / em execução",
  servico_concluido: "Serviço concluído",
  arquivado: "Arquivado",
};

/** "Concluir Serviço" is only allowed once management authorized the job. */
export const canComplete = (s: OSStatus) => s === "autorizado_em_execucao";
export const canSubmitQuote = (s: OSStatus) => s === "aguardando_visita";

export const orcamentoTotal = (o: Pick<ServiceOrder, "pecas" | "mao_de_obra">) =>
  (o.pecas ?? []).reduce(
    (t, p) => t + Number(p.quantidade || 0) * Number(p.valor_unitario || 0),
    0
  ) + Number(o.mao_de_obra || 0);

/** Only archived orders count toward financial metrics. */
export const archived = (orders: ServiceOrder[]) =>
  orders.filter((o) => o.status === "arquivado" && o.valor_final != null);

export const spentOn = (orders: ServiceOrder[], equipmentId: string) =>
  archived(orders)
    .filter((o) => o.equipment_id === equipmentId)
    .reduce((t, o) => t + Number(o.valor_final), 0);

/** Uneconomical: spent > 50% of a new unit, or > 3 corrective jobs in the last 6 months. */
export function isAntieconomico(eq: Equipment, orders: ServiceOrder[], now = new Date()) {
  const total = spentOn(orders, eq.id);
  if (Number(eq.valor_novo) > 0 && total > Number(eq.valor_novo) * 0.5) return true;
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const corretivas = archived(orders).filter(
    (o) =>
      o.equipment_id === eq.id &&
      o.tipo === "corretiva" &&
      new Date(o.arquivado_at ?? o.created_at) >= sixMonthsAgo,
  );
  return corretivas.length > 3;
}

export type EquipState = "operando" | "manutencao" | "critico";
export function equipState(eq: Equipment, orders: ServiceOrder[]): EquipState {
  if (eq.critico) return "critico";
  if (orders.some((o) => o.equipment_id === eq.id && o.status !== "arquivado")) return "manutencao";
  return "operando";
}

export const brl = (v: number) =>
  Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const dt = (s: string | null) => (s ? new Date(s).toLocaleString("pt-BR") : "—");