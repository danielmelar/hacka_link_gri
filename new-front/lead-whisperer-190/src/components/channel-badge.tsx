import { MessageCircle, Send, Phone, Users, Mail } from "lucide-react";
import type { Channel } from "@/lib/mock-data";

const map: Record<Channel, { icon: typeof MessageCircle; tone: string; label: string }> = {
  WhatsApp: { icon: MessageCircle, tone: "text-success", label: "WhatsApp" },
  Telegram: { icon: Send, tone: "text-sky-300", label: "Telegram" },
  Ligação: { icon: Phone, tone: "text-primary", label: "Ligação" },
  Presencial: { icon: Users, tone: "text-warning", label: "Presencial" },
  "E-mail": { icon: Mail, tone: "text-muted-foreground", label: "E-mail" },
};

export function ChannelIcon({ channel, className = "" }: { channel: Channel; className?: string }) {
  const m = map[channel];
  const Icon = m.icon;
  return <Icon className={`h-4 w-4 ${m.tone} ${className}`} aria-label={m.label} />;
}

export function ChannelBadge({ channel }: { channel: Channel }) {
  const m = map[channel];
  const Icon = m.icon;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-container-low px-2 py-1 text-xs font-medium">
      <Icon className={`h-3.5 w-3.5 ${m.tone}`} />
      <span className="text-foreground/90">{m.label}</span>
    </span>
  );
}

export const ALL_CHANNELS: Channel[] = ["WhatsApp", "Telegram", "Ligação", "Presencial", "E-mail"];
