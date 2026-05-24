import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { MapPin, Building2, Loader2 } from "lucide-react";
import { AppTopbar } from "@/components/app-topbar";
import { propertiesApi, type ApiProperty } from "@/lib/api";
import { formatBRL } from "@/lib/lead-utils";

export const Route = createFileRoute("/portfolio")({
  component: PortfolioPage,
});

function PortfolioPage() {
  const { data: properties = [], isLoading } = useQuery<ApiProperty[]>({
    queryKey: ["properties"],
    queryFn: () => propertiesApi.getAll({ limit: 100 }).then((r) => r.data.data),
  });

  return (
    <AppShell>
      <>
        <AppTopbar title="Portfólio de imóveis" />
        <main className="flex-1 space-y-6 px-6 py-8 md:px-10">
          <div>
            <p className="text-eyebrow text-primary">Portfólio</p>
            <h2 className="text-display mt-1 text-3xl">
              {isLoading ? "…" : `${properties.length} imóveis cadastrados`}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Domínio de produto é a base da boa corretagem. Conheça cada ativo do portfólio.
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : properties.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Nenhum imóvel cadastrado no portfólio ainda.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {properties.map((p: ApiProperty) => (
                <article
                  key={p._id}
                  className="group overflow-hidden rounded-xl border border-border bg-surface-container transition hover:border-primary/40"
                >
                  {p.images && p.images.length > 0 ? (
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="h-full w-full object-cover transition group-hover:scale-[1.03]"
                      />
                      <span className="absolute left-3 top-3 rounded-md border border-primary/40 bg-background/70 px-2 py-1 text-[11px] font-semibold text-primary backdrop-blur">
                        {p.status}
                      </span>
                    </div>
                  ) : (
                    <div className="relative flex aspect-[16/10] items-center justify-center bg-surface-container-high">
                      <Building2 className="h-12 w-12 text-muted-foreground/40" />
                      <span className="absolute left-3 top-3 rounded-md border border-primary/40 bg-background/70 px-2 py-1 text-[11px] font-semibold text-primary backdrop-blur">
                        {p.status}
                      </span>
                    </div>
                  )}
                  <div className="space-y-3 p-5">
                    <div>
                      <h3 className="text-display text-xl">{p.name}</h3>
                      <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {p.address.neighborhood}, {p.address.city}
                      </p>
                    </div>
                    {p.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                    )}
                    <div className="grid grid-cols-3 gap-2 border-t border-border/60 pt-3 text-center">
                      {p.bedrooms != null && (
                        <div>
                          <p className="text-eyebrow text-muted-foreground">Quartos</p>
                          <p className="text-display text-lg">{p.bedrooms}</p>
                        </div>
                      )}
                      {p.area != null && (
                        <div>
                          <p className="text-eyebrow text-muted-foreground">Área</p>
                          <p className="text-display text-lg">{p.area}m²</p>
                        </div>
                      )}
                      <div>
                        <p className="text-eyebrow text-muted-foreground">Preço</p>
                        <p className="text-display text-lg text-primary">{formatBRL(p.price)}</p>
                      </div>
                    </div>
                    {p.features.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {p.features.slice(0, 4).map((f) => (
                          <span
                            key={f}
                            className="rounded-md border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </>
    </AppShell>
  );
}
