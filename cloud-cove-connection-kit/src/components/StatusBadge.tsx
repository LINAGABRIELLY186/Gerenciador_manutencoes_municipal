import { STATUS_LABEL, type OSStatus } from "@/lib/os";
import { cn } from "@/lib/utils";

const tone: Record<OSStatus, string> = {
  aguardando_visita: "bg-warning text-warning-foreground",
  aguardando_autorizacao: "bg-warning text-warning-foreground",
  autorizado_em_execucao: "bg-secondary text-secondary-foreground",
  servico_concluido: "bg-success text-success-foreground",
  arquivado: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: OSStatus }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", tone[status])}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function DataState({ isLoading, error }: { isLoading: boolean; error: unknown }) {
  if (isLoading) return <p className="p-8 text-center text-muted-foreground">Carregando…</p>;
  if (error)
    return (
      <div className="m-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
        <b>Não foi possível carregar os dados.</b> Verifique se o script <code>supabase/schema.sql</code> foi executado no
        seu Supabase. <span className="text-muted-foreground">({String((error as Error).message)})</span>
      </div>
    );
  return null;
}
