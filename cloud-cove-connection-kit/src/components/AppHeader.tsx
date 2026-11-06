import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Logo({ className = "" }: { className?: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="leading-tight">
        <div className="font-display text-sm font-extrabold tracking-wide text-primary">
          PREFEITURA DE LAGOA DO PIAUÍ
        </div>
        <div className="text-xs italic text-secondary">Cuidando do futuro</div>
      </div>
    );
  }

  return (
    <img
      src="/logo.png"
      alt="Prefeitura de Lagoa do Piauí - Cuidando do futuro"
      className={`h-[90px] w-auto max-w-none object-contain scale-125 origin-left drop-shadow-sm ${className}`}
      onError={() => setFailed(true)}
    />
  );
}

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const d = localStorage.getItem("theme") === "dark";
    setDark(d);
    document.documentElement.classList.toggle("dark", d);
  }, []);

  const toggle = () => {
    const d = !dark;
    setDark(d);
    localStorage.setItem("theme", d ? "dark" : "light");
    document.documentElement.classList.toggle("dark", d);
  };

  return (
    <Button variant="outline" size="icon" onClick={toggle} aria-label="Alternar tema">
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

export function AppHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="no-print sticky top-0 z-30 h-16 border-b bg-card/90 backdrop-blur">
      <div className="mx-auto flex h-full max-w-7xl items-center gap-4 px-4">
        {/* Espaço horizontal reservado de 200px para o logótipo não sobrepor o menu */}
        <Link to="/" className="relative flex h-full w-[200px] shrink-0 items-center overflow-visible">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none">
            <Logo />
          </div>
        </Link>

        <div className="flex flex-1 flex-wrap items-center gap-1 overflow-x-auto">
          {children}
        </div>

        <ThemeToggle />
      </div>
    </header>
  );
}