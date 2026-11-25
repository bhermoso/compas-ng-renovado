/**
 * Hito del proceso local de salud: un acontecimiento con fecha que el equipo
 * registra (taller de impulso, sesión de presentación del Perfil, sesión de
 * priorización, sesión del Plan de Acción…). COMPÁS lo conserva tal como se
 * registra; no lo deduce ni lo completa.
 */
export type ProcessMilestoneKind = "impulso" | "perfil" | "priorizacion" | "plan" | "otro";

export const PROCESS_MILESTONE_KINDS: ReadonlyArray<{ id: ProcessMilestoneKind; label: string }> = [
  { id: "impulso", label: "Taller de impulso" },
  { id: "perfil", label: "Taller del Perfil de Salud Local" },
  { id: "priorizacion", label: "Priorización" },
  { id: "plan", label: "Plan de Acción" },
  { id: "otro", label: "Otro hito" },
];

export interface ProcessMilestone {
  id: string;
  kind: ProcessMilestoneKind;
  /** Fecha del hito, AAAA-MM-DD. */
  date: string;
  title: string;
  place?: string;
  /** Quién participó o qué se hizo, en palabras de quien lo registra. */
  note?: string;
  createdAt: string;
  createdBy?: string;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isProcessMilestone(value: unknown): value is ProcessMilestone {
  if (value === null || typeof value !== "object") return false;
  const m = value as Record<string, unknown>;
  const optionalString = (v: unknown) => v === undefined || typeof v === "string";
  return typeof m.id === "string" && m.id.length > 0 &&
    PROCESS_MILESTONE_KINDS.some((k) => k.id === m.kind) &&
    typeof m.date === "string" && DATE.test(m.date) &&
    typeof m.title === "string" && m.title.trim().length > 0 &&
    typeof m.createdAt === "string" &&
    optionalString(m.place) && optionalString(m.note) && optionalString(m.createdBy);
}

export function milestoneKindLabel(kind: ProcessMilestoneKind): string {
  return PROCESS_MILESTONE_KINDS.find((k) => k.id === kind)?.label ?? kind;
}

/** Orden cronológico ascendente; a igual fecha, por orden de registro. */
export function sortMilestones(milestones: readonly ProcessMilestone[]): ProcessMilestone[] {
  return [...milestones].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
}
