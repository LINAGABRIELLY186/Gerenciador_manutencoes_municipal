import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login" });
    return { userEmail: data.user.email ?? "" };
  },
  component: AdminLayout,
});

const links = [
  { to: "/admin", label: "Painel" },
  { to: "/admin/ordens", label: "Ordens de Serviço" },
  { to: "/admin/mapa", label: "Mapa" },
  { to: "/admin/cadastros", label: "Cadastros" },
  { to: "/admin/relatorios", label: "Relatórios" },
] as const;

function AdminLayout() {
  const { userEmail } = Route.useRouteContext();
  const qc = useQueryClient();
  const nav = useNavigate();
  const sair = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    nav({ to: "/login", replace: true });
  };
  return (
    <div className="min-h-screen">
      <AppHeader>
        {links.map((l) => (
          <Link key={l.to} to={l.to} activeOptions={{ exact: l.to === "/admin" }}
            className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent [&.active]:bg-accent [&.active]:text-accent-foreground">
            {l.label}
          </Link>
        ))}
        <span className="ml-auto hidden text-xs text-muted-foreground lg:inline">{userEmail}</span>
        <Button variant="ghost" size="sm" onClick={sair}><LogOut className="size-4" /> Sair</Button>
      </AppHeader>
      <main className="mx-auto max-w-7xl p-4"><Outlet /></main>
    </div>
  );
}
