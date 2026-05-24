/**
 * Utilities for mapping backend ILead fields to UI display values.
 */

/** Maps backend state.etapa (string | null) to a human-readable Portuguese label */
export function etapaToStatus(etapa: string | null | undefined): string {
  if (!etapa) return "Novo";
  const map: Record<string, string> = {
    inicio: "Novo",
    qualificacao: "Em qualificação",
    qualificado: "Qualificado",
    apresentacao: "Apresentação",
    visita_agendada: "Visita agendada",
    proposta: "Proposta",
    fechado: "Fechado",
    perdido: "Perdido",
    inativo: "Inativo",
  };
  return map[etapa.toLowerCase()] ?? etapa;
}

/** CSS classes for score value */
export function scoreColor(score: number): string {
  if (score >= 80) return "text-success";
  if (score >= 50) return "text-primary";
  return "text-muted-foreground";
}

/** CSS border+text classes for a status badge */
export function statusBadgeColor(etapa: string | null | undefined): string {
  const status = etapaToStatus(etapa);
  const map: Record<string, string> = {
    Novo: "border-blue-400/40 text-blue-400",
    "Em qualificação": "border-yellow-400/40 text-yellow-400",
    Qualificado: "border-green-400/40 text-green-400",
    Apresentação: "border-purple-400/40 text-purple-400",
    "Visita agendada": "border-orange-400/40 text-orange-400",
    Proposta: "border-cyan-400/40 text-cyan-400",
    Fechado: "border-emerald-400/40 text-emerald-400",
    Perdido: "border-red-400/40 text-red-400",
    Inativo: "border-gray-400/40 text-gray-400",
  };
  return map[status] ?? "border-border text-muted-foreground";
}

/** Format ISO date string to "dd/mm/yyyy HH:mm" */
export function formatDateTime(iso: string | undefined | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

/** Format BRL currency */
export function formatBRL(value: number | undefined | null): string {
  if (value == null) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Map message direction to display label */
export function directionLabel(direction: "inbound" | "outbound"): string {
  return direction === "inbound" ? "Lead" : "Sofia (IA)";
}
