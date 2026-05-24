import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="text-eyebrow text-primary">404</p>
        <h1 className="text-display mt-3 text-5xl text-foreground">Página não encontrada</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          O endereço acessado não existe ou foi movido.
        </p>
        <div className="mt-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Ir para o dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-display text-2xl text-foreground">Algo deu errado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tente novamente ou volte para o dashboard.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <a
            href="/dashboard"
            className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent"
          >
            Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CLAVIS — Inteligência comercial imobiliária" },
      {
        name: "description",
        content:
          "CLAVIS — plataforma SaaS para incorporadoras: gestão de leads, follow-up disciplinado e rastreabilidade comercial.",
      },
      { property: "og:title", content: "CLAVIS — Inteligência comercial imobiliária" },
      {
        property: "og:description",
        content: "Gestão de leads, follow-up e portfólio de empreendimentos para incorporadoras.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "CLAVIS — Inteligência comercial imobiliária" },
      { name: "description", content: "LeadFlow Pro is a SaaS B2B application for real estate professionals to manage leads and sales pipelines." },
      { property: "og:description", content: "LeadFlow Pro is a SaaS B2B application for real estate professionals to manage leads and sales pipelines." },
      { name: "twitter:description", content: "LeadFlow Pro is a SaaS B2B application for real estate professionals to manage leads and sales pipelines." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/5dcb30cb-e72d-4704-9ae7-e2891fadd42c/id-preview-15a3c6b4--0186d53a-b7b4-41a0-b9d1-c3887f27dd38.lovable.app-1779596052527.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/5dcb30cb-e72d-4704-9ae7-e2891fadd42c/id-preview-15a3c6b4--0186d53a-b7b4-41a0-b9d1-c3887f27dd38.lovable.app-1779596052527.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    </QueryClientProvider>
  );
}
