/**
 * Menú de elección del Perfil cargado (Art. 16 ter;
 * CONTRACT-PROFILE-PRODUCTION-AND-CUSTODY §7).
 *
 * COMPÁS presenta como menú las conclusiones (C1…) y recomendaciones (R1…) de
 * una revisión. Ninguna nace elegida. El equipo técnico elige o descarta cada
 * una, con autoría y fecha; el descarte admite un motivo. La revisión no puede
 * validarse mientras quede alguna sin resolver. Elegir no suprime texto del
 * original ni es priorizar.
 */
import type { ExternalHealthProfile, ProfileChoice } from "../../domain/health-profile/ExternalHealthProfile";
import { parseProfileStructure } from "./profileStructure";

export interface ProfileProposal {
  id: string;
  kind: "conclusion" | "recommendation";
  /** Enunciado tal como figura en el Perfil. */
  text: string;
  /** Tipo de la recomendación (Conocer, Contrastar, Abordar), si lo declara. */
  type?: string;
}

type ProposalSource = Pick<ExternalHealthProfile, "text" | "findings" | "areas">;

const CONCLUSION_ID = /^(C\d+)\.\s*(.*)$/s;
const RECOMMENDATION_ID = /^R\d+$/;

/** Conclusiones y recomendaciones de la revisión, en su orden. */
export function profileProposals(profile: ProposalSource): ProfileProposal[] {
  const structure = profile.text ? parseProfileStructure(profile.text) : undefined;
  const out: ProfileProposal[] = [];
  const seen = new Set<string>();
  const push = (p: ProfileProposal) => { if (!seen.has(p.id)) { seen.add(p.id); out.push(p); } };
  if (structure?.conclusions.length) {
    for (const c of structure.conclusions) push({ id: c.id, kind: "conclusion", text: c.title });
  } else {
    for (const f of profile.findings) {
      const m = CONCLUSION_ID.exec(f.trim());
      if (m) push({ id: m[1], kind: "conclusion", text: m[2].trim() });
    }
  }
  if (structure?.recommendations.length) {
    // El título derivado del texto (§8 del actualizador) conserva la puntuación del encabezado.
    const titled = new Map(profile.areas.filter(a => RECOMMENDATION_ID.test(a.id)).map(a => [a.id, a.title.replace(/^R\d+\.\s*/, "")]));
    for (const r of structure.recommendations) push({ id: r.id, kind: "recommendation", text: titled.get(r.id) ?? r.text, type: r.type });
  } else {
    for (const a of profile.areas) {
      if (RECOMMENDATION_ID.test(a.id)) push({ id: a.id, kind: "recommendation", text: a.title.replace(/^R\d+\.\s*/, "") });
    }
  }
  return out;
}

/** Elección vigente para cada propuesta de la revisión; se ignoran las de propuestas que ya no figuran. */
export function choicesByTarget(profile: ProposalSource & Pick<ExternalHealthProfile, "choices">): Map<string, ProfileChoice> {
  const ids = new Set(profileProposals(profile).map(p => p.id));
  const map = new Map<string, ProfileChoice>();
  for (const c of profile.choices ?? []) if (ids.has(c.target)) map.set(c.target, c);
  return map;
}

/** Identificadores de las propuestas que siguen sin elegir ni descartar. */
export function pendingProposals(profile: ProposalSource & Pick<ExternalHealthProfile, "choices">): string[] {
  const chosen = choicesByTarget(profile);
  return profileProposals(profile).filter(p => !chosen.has(p.id)).map(p => p.id);
}

/** Identificadores descartados por el equipo técnico en esta revisión. */
export function discardedProposals(profile: ProposalSource & Pick<ExternalHealthProfile, "choices">): Set<string> {
  return new Set([...choicesByTarget(profile).values()].filter(c => c.decision === "discarded").map(c => c.target));
}

export interface ChoiceInput {
  target: string;
  decision: ProfileChoice["decision"];
  reason?: string;
}

/**
 * Registra decisiones sobre una revisión en revisión. Cada decisión sustituye a la
 * anterior sobre la misma propuesta. No toca el texto ni los demás campos.
 */
export function recordProfileChoices(profile: ExternalHealthProfile, decisions: ChoiceInput[], by: string, at: string): ExternalHealthProfile {
  if (profile.status === "validated") throw new Error("La revisión ya está validada: su elección no puede cambiarse. Crea una revisión nueva.");
  if (profile.archivedAt) throw new Error("La revisión está archivada: su elección no puede cambiarse.");
  if (!by.trim()) throw new Error("Identifícate para registrar la elección.");
  const ids = new Set(profileProposals(profile).map(p => p.id));
  const unknown = decisions.filter(d => !ids.has(d.target)).map(d => d.target);
  if (unknown.length) throw new Error(`Estas propuestas no figuran en la revisión: ${unknown.join(", ")}.`);
  const next = new Map((profile.choices ?? []).map(c => [c.target, c]));
  for (const d of decisions) {
    const reason = d.decision === "discarded" ? d.reason?.trim() : undefined;
    next.set(d.target, { target: d.target, decision: d.decision, by: by.trim(), at, ...(reason ? { reason } : {}) });
  }
  return { ...profile, choices: [...next.values()] };
}

/** Forma válida de las elecciones guardadas. */
export function isProfileChoices(value: unknown): value is ProfileChoice[] {
  return Array.isArray(value) && value.every(c =>
    typeof c === "object" && c !== null &&
    typeof (c as ProfileChoice).target === "string" && /^[CR]\d+$/.test((c as ProfileChoice).target) &&
    ((c as ProfileChoice).decision === "chosen" || (c as ProfileChoice).decision === "discarded") &&
    typeof (c as ProfileChoice).by === "string" && !!(c as ProfileChoice).by.trim() &&
    typeof (c as ProfileChoice).at === "string" && Number.isFinite(Date.parse((c as ProfileChoice).at)) &&
    ((c as ProfileChoice).reason === undefined || typeof (c as ProfileChoice).reason === "string")) &&
    new Set(value.map(c => (c as ProfileChoice).target)).size === value.length;
}
