/**
 * FormalValidationRecord — registro de validación formal de borradores del Nivel 3
 *
 * ActionPlanDraft, AgendaDraft y MonitoringDraft son borradores técnicos
 * regenerados automáticamente por el sistema. El gate G-PLS-5 (plan validado)
 * y G-PLS-6 (agenda validada) del LocalHealthPlanCompiler requieren que
 * el Grupo Motor haya revisado y adoptado formalmente estos borradores.
 *
 * Este registro captura ese acto de adopción formal sin modificar los tipos
 * de los borradores (que siguen siendo funciones puras del sistema).
 *
 * Diseño: el registro es independiente del borrador porque los borradores
 * son efímeros (se regeneran). La validación formal es un hecho histórico
 * que debe persistir aunque el borrador cambie. Si el borrador cambia después
 * de la validación, el registro detecta la obsolescencia via `sourcePSLVersion`.
 *
 * Referencia: CONTRACT-INSTITUTIONAL-LIFECYCLE §4, CONTRACT-LOCAL-HEALTH-PLAN-COMPILER §5
 */

import type { InstitutionalActorRole } from "./InstitutionalActor";

export type FormalValidationTarget =
  | "action-plan"
  | "agenda"
  | "monitoring-framework";

export interface FormalValidationRecord {
  // ── Identificación ────────────────────────────────────────────────────────
  id: string;
  target: FormalValidationTarget;

  // ── Referencia al PSL que origina el borrador ─────────────────────────────
  // Si psl.version cambia, la validación queda obsoleta.
  // Invariante: la validación solo es válida cuando psl.id === sourcePSLId
  // y psl.version === sourcePSLVersion.
  sourcePSLId: string;
  sourcePSLVersion: string;     // = LocalHealthProfile.version en el momento de validar

  // ── Quién valida formalmente ──────────────────────────────────────────────
  validatedAt: string;          // ISO timestamp de la validación formal
  validatedBy: string;          // Nombre + cargo del responsable
  validatedByRole: InstitutionalActorRole;  // "group-motor" o "coordination"

  // ── Evidencia de la validación ─────────────────────────────────────────────
  externalReference?: string;
  // Referencia al acta o acuerdo del Grupo Motor.

  // ── Notas y observaciones ─────────────────────────────────────────────────
  validationNotes?: string;
  // Síntesis de lo acordado, modificaciones solicitadas o condiciones de validación.

  // ── Criterio de calidad «Perfil validado» en el momento de validar ────────
  // La validación del Perfil no es requisito de la validación formal: se anota
  // aquí como criterio de calidad (CONTRACT-PROFILE-VALIDATION-QUALITY).
  profileValidationAtValidation?: { level: string; met: boolean };
}

/**
 * Verifica si una FormalValidationRecord sigue vigente dado el PSL actual.
 * Una validación es obsoleta si el PSL ha cambiado (nueva versión evidenceStore).
 */
export function isFormalValidationStale(
  record: FormalValidationRecord,
  currentPSL: { id: string; version: string }
): boolean {
  return (
    record.sourcePSLId !== currentPSL.id ||
    record.sourcePSLVersion !== currentPSL.version
  );
}
