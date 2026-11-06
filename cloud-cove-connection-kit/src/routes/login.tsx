import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Loader2, 
  ShieldCheck, 
  AirVent 
} from "lucide-react";

import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Portal de Gestão | Ar-Condicionado Lagoa do Piauí" },
      { name: "description", content: "Acesso restrito da administração municipal." },
      { property: "og:title", content: "Portal de Gestão" },
      { property: "og:description", content: "Acesso restrito da administração municipal." },
    ],
  }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    setBusy(false);

    if (error) { 
      toast.error("Credenciais inválidas", {
        description: "Verifique seu e-mail e senha e tente novamente.",
      }); 
      return; 
    }

    toast.success("Autenticado com sucesso!");
    nav({ to: "/admin", replace: true });
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground transition-colors duration-300">
      {/* Background decorativo adaptativo (muda opacidade e cor entre claro e escuro) */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* Glow Superior */}
        <div className="absolute -top-40 left-1/2 h-[500px] w-[600px] -translate-x-1/2 rounded-full bg-cyan-500/10 dark:bg-cyan-600/15 blur-[120px]" />
        
        {/* Glow Inferior */}
        <div className="absolute bottom-0 right-10 h-72 w-72 rounded-full bg-blue-500/10 dark:bg-blue-600/10 blur-[100px]" />
        
        {/* Grid sutil */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)]" />
      </div>

      <AppHeader />

      <main className="flex flex-1 items-center justify-center p-4 py-12">
        <div className="w-full max-w-md">
          {/* Card com suporte completo a light/dark */}
          <div className="relative rounded-2xl border border-border/80 bg-card/80 p-8 shadow-xl backdrop-blur-xl transition-colors">
            
            {/* Cabeçalho do Card */}
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shadow-inner">
                <AirVent className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Painel Administrativo
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                Gestão de Manutenções • Lagoa do Piauí
              </p>
            </div>

            {/* Formulário */}
            <form onSubmit={submit} className="space-y-4">
              {/* Campo E-mail */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium text-foreground">
                  E-mail institucional
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    required
                    disabled={busy}
                    placeholder="servidor@lagoadopiaui.pi.gov.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 border-input bg-background/50 pl-10 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-cyan-500 focus-visible:ring-1 focus-visible:ring-cyan-500"
                  />
                </div>
              </div>

              {/* Campo Senha */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-medium text-foreground">
                    Chave de acesso
                  </Label>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    disabled={busy}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 border-input bg-background/50 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-cyan-500 focus-visible:ring-1 focus-visible:ring-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Botão de Enviar */}
              <Button
                type="submit"
                disabled={busy}
                className="mt-2 h-11 w-full bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-500 dark:to-blue-600 font-medium text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-500 hover:to-blue-500 active:scale-[0.99] transition-all"
              >
                {busy ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Validando permissões...
                  </span>
                ) : (
                  "Acessar Sistema"
                )}
              </Button>
            </form>

            {/* Rodapé Interno com Selo de Segurança */}
            <div className="mt-6 flex items-center justify-center gap-2 border-t border-border/60 pt-4 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Ambiente monitorado e protegido por criptografia</span>
            </div>
          </div>

          {/* Rodapé da Página */}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Prefeitura Municipal de Lagoa do Piauí • Todos os direitos reservados
          </p>
        </div>
      </main>
    </div>
  );
}