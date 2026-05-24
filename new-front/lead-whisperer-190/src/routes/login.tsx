import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import clavisStacked from "@/assets/clavis-stacked.png";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      navigate({ to: "/dashboard" });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-surface-container-low p-12 lg:flex">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(800px 400px at 20% 10%, oklch(0.82 0.085 78 / 0.15), transparent 60%), radial-gradient(600px 300px at 80% 90%, oklch(0.72 0.14 155 / 0.10), transparent 60%)",
          }}
        />
        <div className="relative flex items-center">
          <img
            src={clavisStacked}
            alt="CLAVIS — Inteligência Comercial Imobiliária"
            className="h-28 w-auto object-contain"
          />
        </div>

        <div className="relative max-w-md">
          <p className="text-eyebrow text-primary">A chave</p>
          <h2 className="text-display mt-3 text-5xl leading-tight text-foreground">
            para <span className="italic text-primary">decisões melhores</span> em corretagem.
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
            Disciplina de follow-up, rastreabilidade total e visão do funil — pensado para a rotina
            de corretores e coordenadores comerciais de incorporadoras.
          </p>
        </div>

        <div className="relative grid grid-cols-3 gap-4 text-xs text-muted-foreground">
          <div>
            <p className="text-display text-2xl text-foreground">+38%</p>
            <p>Conversão média</p>
          </div>
          <div>
            <p className="text-display text-2xl text-foreground">12s</p>
            <p>Tempo de cadastro</p>
          </div>
          <div>
            <p className="text-display text-2xl text-foreground">100%</p>
            <p>Histórico rastreável</p>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-sm animate-fade-in space-y-6"
          aria-label="Formulário de login"
        >
          <div>
            <p className="text-eyebrow text-primary">Acesso</p>
            <h1 className="text-display mt-2 text-3xl text-foreground">Entrar na plataforma</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Use suas credenciais corporativas para continuar.
            </p>
          </div>

          <div className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">E-mail</span>
              <input
                type="email"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-border bg-surface-container px-3 py-2.5 text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>Senha</span>
                <a href="#" className="text-primary hover:underline">
                  Esqueci minha senha
                </a>
              </span>
              <input
                type="password"
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-border bg-surface-container px-3 py-2.5 text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </label>
          </div>

          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Entrar
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </button>

          <p className="text-center text-[11px] text-muted-foreground">
            Em breve: 2FA, login Google e SSO corporativo.
          </p>
        </form>
      </div>
    </div>
  );
}
