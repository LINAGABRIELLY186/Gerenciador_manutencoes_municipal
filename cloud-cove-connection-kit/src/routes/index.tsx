import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Wrench } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gestão de Ar-Condicionado | Prefeitura de Lagoa do Piauí" },
      { name: "description", content: "Sistema Municipal de Gestão e Controle de Custos de Manutenção de Ar-Condicionado." },
      { property: "og:title", content: "Gestão de Ar-Condicionado | Lagoa do Piauí" },
      { property: "og:description", content: "Ordens de serviço, custos por patrimônio e prestação de contas." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <section className="bg-hero text-primary-foreground">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <p className="text-sm font-semibold uppercase tracking-widest opacity-80">Prefeitura de Lagoa do Piauí · PI</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-extrabold md:text-5xl">
            Sistema Municipal de Gestão e Controle de Manutenções
          </h1>
        </div>
      </section>
      <main className="mx-auto -mt-8 grid max-w-5xl gap-4 px-4 pb-16 md:grid-cols-2">
        <Link to="/tecnico" className="group rounded-xl border bg-card p-6 shadow-card transition hover:-translate-y-0.5">
          <Wrench className="size-8 text-warning" />
          <h2 className="mt-4 text-xl font-bold">Acesso Técnico em Campo</h2>
          <p className="mt-1 text-sm text-muted-foreground">Sem senha. Veja as ordens de serviço ativas, envie orçamentos e conclua serviços autorizados.</p>
        </Link>
        <Link to="/admin" className="group rounded-xl border bg-card p-6 shadow-card transition hover:-translate-y-0.5">
          <ShieldCheck className="size-8 text-primary" />
          <h2 className="mt-4 text-xl font-bold">Administração / Gestão</h2>
          <p className="mt-1 text-sm text-muted-foreground">Acesso com e-mail e senha. Cadastros, autorizações, arquivamento, painéis e relatórios.</p>
        </Link>
      </main>
    </div>
  );
}
