import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { MapPin, Building2 } from "lucide-react";
import { AppTopbar } from "@/components/app-topbar";
import { empreendimentos, formatBRL } from "@/lib/mock-data";

export const Route = createFileRoute("/portfolio")({
  component: PortfolioPage,
});

function PortfolioPage() {
  return (
    <AppShell><>
      <AppTopbar title="Portfólio de empreendimentos" />
      <main className="flex-1 space-y-6 px-6 py-8 md:px-10">
        <div>
          <p className="text-eyebrow text-primary">Portfólio</p>
          <h2 className="text-display mt-1 text-3xl">
            {empreendimentos.length} empreendimentos ativos
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Domínio de produto é a base da boa corretagem. Conheça cada ativo do portfólio.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {empreendimentos.map((e) => (
            <article
              key={e.id}
              className="group overflow-hidden rounded-xl border border-border bg-surface-container transition hover:border-primary/40"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={e.cover}
                  alt={e.name}
                  className="h-full w-full object-cover transition group-hover:scale-[1.03]"
                />
                <span className="absolute left-3 top-3 rounded-md border border-primary/40 bg-background/70 px-2 py-1 text-[11px] font-semibold text-primary backdrop-blur">
                  {e.status}
                </span>
              </div>
              <div className="space-y-3 p-5">
                <div>
                  <h3 className="text-display text-xl">{e.name}</h3>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {e.neighborhood}, {e.city}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 border-t border-border/60 pt-3 text-center">
                  <div>
                    <p className="text-eyebrow text-muted-foreground">Unid.</p>
                    <p className="text-display text-lg">{e.units}</p>
                  </div>
                  <div>
                    <p className="text-eyebrow text-muted-foreground">A partir</p>
                    <p className="text-display text-lg">{formatBRL(e.priceFrom)}</p>
                  </div>
                  <div>
                    <p className="text-eyebrow text-muted-foreground">VGV</p>
                    <p className="text-display text-lg text-primary">{formatBRL(e.vgv)}</p>
                  </div>
                </div>
                <button className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-semibold hover:border-primary/40 hover:text-primary">
                  <Building2 className="h-3.5 w-3.5" /> Ver ficha completa
                </button>
              </div>
            </article>
          ))}
        </div>
      </main>
    </></AppShell>
  );
}
