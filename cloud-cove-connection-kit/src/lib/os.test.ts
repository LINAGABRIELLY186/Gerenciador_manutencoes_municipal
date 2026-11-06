import { describe, it, expect } from "vitest";
import { canComplete, isAntieconomico, archived, type Equipment, type ServiceOrder } from "./os";

const eq: Equipment = { id: "e1", room_id: "r", patrimonio: "P1", marca: null, modelo: null, btus: null, valor_novo: 2000, critico: false };
const os = (p: Partial<ServiceOrder>): ServiceOrder => ({
  id: Math.random().toString(), numero: 1, equipment_id: "e1", tipo: "corretiva", queixa: "", status: "arquivado",
  tecnico_nome: null, diagnostico: null, pecas: [], mao_de_obra: 0, motivo_recusa: null, valor_final: 100,
  nota_fiscal: null, arquivado_por: null, created_at: new Date().toISOString(), orcamento_at: null,
  autorizado_at: null, concluido_at: null, arquivado_at: new Date().toISOString(), ...p,
});

describe("regras da OS", () => {
  it("só permite concluir quando autorizado", () => {
    expect(canComplete("aguardando_visita")).toBe(false);
    expect(canComplete("aguardando_autorizacao")).toBe(false);
    expect(canComplete("autorizado_em_execucao")).toBe(true);
  });
  it("métricas só contam OS arquivadas", () => {
    expect(archived([os({ status: "servico_concluido" }), os({})]).length).toBe(1);
  });
  it("antieconômico acima de 50% do valor novo", () => {
    expect(isAntieconomico(eq, [os({ valor_final: 1000, tipo: "preventiva" })])).toBe(false);
    expect(isAntieconomico(eq, [os({ valor_final: 1001, tipo: "preventiva" })])).toBe(true);
  });
  it("antieconômico com mais de 3 corretivas em 6 meses", () => {
    const three = [os({}), os({}), os({})];
    expect(isAntieconomico(eq, three)).toBe(false);
    expect(isAntieconomico(eq, [...three, os({})])).toBe(true);
  });
});
