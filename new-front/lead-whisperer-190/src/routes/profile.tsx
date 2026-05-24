import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { AppTopbar } from "@/components/app-topbar";
import { useAuth } from "@/lib/auth";
import { dashboardApi } from "@/lib/api";
import { LogOut, Copy, Check, ExternalLink, MessageCircle, QrCode } from "lucide-react";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

const BOT_USERNAME = "clavisapp_bot";

function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => dashboardApi.getProfile().then((r) => r.data.data),
  });

  const deepLinkToken = profile?.deepLinkToken;
  const deepLink = deepLinkToken
    ? `https://t.me/${BOT_USERNAME}?start=${deepLinkToken}`
    : null;

  const copyLink = async () => {
    if (!deepLink) return;
    await navigator.clipboard.writeText(deepLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) return null;

  return (
    <AppShell>
      <>
        <AppTopbar title="Meu perfil" />
        <main className="flex-1 space-y-6 px-6 py-8 md:px-10">
          {/* Header */}
          <div className="flex items-center gap-5 rounded-xl border border-border bg-surface-container p-6">
            <span
              className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-semibold text-primary-foreground"
              style={{ background: user.avatarColor }}
            >
              {user.firstName[0]}
            </span>
            <div className="flex-1">
              <p className="text-eyebrow text-primary">{user.role}</p>
              <h2 className="text-display mt-1 text-3xl">{user.name}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <button
              onClick={() => { logout(); navigate({ to: "/login" }); }}
              className="inline-flex items-center gap-2 rounded-md border border-destructive/40 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>

          {/* ── Deep Link do Telegram ── */}
          <div className="rounded-xl border border-primary/40 bg-primary/5 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-eyebrow text-primary">Seu link exclusivo</p>
                <h3 className="text-display mt-1 text-2xl text-foreground">
                  Link do Telegram para leads
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Compartilhe este link em anúncios, Instagram, WhatsApp ou onde preferir.
                  Quando o lead clicar, ele entra direto no bot da Sofia e a qualificação começa automaticamente.
                </p>

                {deepLink ? (
                  <div className="mt-4 space-y-3">
                    {/* Link display */}
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-3">
                      <code className="flex-1 truncate text-sm text-foreground">{deepLink}</code>
                      <button
                        onClick={copyLink}
                        className="shrink-0 flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        {copied ? (
                          <><Check className="h-3.5 w-3.5" /> Copiado!</>
                        ) : (
                          <><Copy className="h-3.5 w-3.5" /> Copiar</>
                        )}
                      </button>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={deepLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Testar no Telegram
                      </a>
                      <a
                        href={`https://qr-code-generator.com/?data=${encodeURIComponent(deepLink)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                      >
                        <QrCode className="h-4 w-4" />
                        Gerar QR Code
                      </a>
                    </div>

                    {/* Como usar */}
                    <div className="mt-2 rounded-lg border border-border bg-surface-container p-4">
                      <p className="text-xs font-semibold text-foreground">Como usar este link</p>
                      <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">1</span>
                          Cole no criativo do Meta Ads como CTA "Falar no Telegram"
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">2</span>
                          Adicione na bio do Instagram com link na bio
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">3</span>
                          Gere um QR Code e coloque no material impresso do stand
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">4</span>
                          A Sofia atende o lead automaticamente e você recebe o dossiê no dashboard
                        </li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 h-12 w-64 animate-pulse rounded-lg bg-surface-container-high" />
                )}
              </div>
            </div>
          </div>

          {/* Dados + Segurança */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface-container p-6">
              <p className="text-eyebrow text-primary">Dados pessoais</p>
              <div className="mt-4 space-y-3 text-sm">
                <Row label="Nome" value={user.name} />
                <Row label="E-mail" value={user.email} />
                <Row label="Papel" value={user.role} />
                <Row label="Plano" value={user.plan ?? "free"} />
              </div>
            </div>
            <div className="rounded-xl border border-border bg-surface-container p-6">
              <p className="text-eyebrow text-primary">Segurança</p>
              <p className="mt-3 text-sm text-muted-foreground">
                Em breve: ativação de 2FA, login com Google via Auth0 e logs de acesso.
              </p>
            </div>
          </div>
        </main>
      </>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border/60 pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
