/**
 * createFormalValidation — registra la validación formal de un borrador del Nivel 3
 *
 * Cuando el Grupo Motor revisa y adopta formalmente un ActionPlanDraft o AgendaDraft,
 * este registro captura ese acto sin modificar el borrador (que sigue siendo un
 * objeto efímero regenerado por el sistema).
 *
 * La validación es relativa a una versión del PSL. Si el PSL cambia de versión,
 * la validación queda obsoleta y debe rehacerse.
 *
 * Referencia: CONTRACT-INSTITUTIONAL-LIFECYCLE §4, Gates G-PLS-5 y G-PLS-6
 */

import type { LocalHealthProfile } from "../../domain/health-profile";
import type {
  FormalValidationTarget,
  FormalValidationRecord,
  InstitutionalActorRole,
} from "../../domain/institutional-lifecycle";
import { assessProfileValidation, profileCanFeedDownstream } from "../../domain/quality/ProfileValidationCriterion";
import { LEVEL3_FORMAL_VALIDATION_PERMISSION } from "../../domain/institutional-lifecycle";

// ── Tipos públicos ─────────────────────────────────────────────────────────────

export interface CreateFormalValidationInput {
  target: FormalValidationTarget;
  psl: LocalHealthProfile;       // PSL al que corresponde el borrador validado
  validatedBy: string;
  validatedByRole: InstitutionalActorRole;
  externalReference?: string;
  validationNotes?: string;
}

export interface FormalValidationViolation {
  code: string;
  message: string;
}

export type FormalValidationResult =
  | { ok: true; record: FormalValidationRecord }
  | { ok: false; violations: FormalValidationViolation[] };

// ── Validación ─────────────────────────────────────────────────────────────────

export function validateCreateFormalValidation(
  input: CreateFormalValidationInput
): FormalValidationViolation[] {
  const violations: FormalValidationViolation[] = [];
  const { psl, validatedBy, validatedByRole } = input;

  // FVAL-01: el PSL debe ser el Perfil vigente. La validación técnica del Perfil
  // ya no es requisito; se registra como criterio de calidad en el registro.
  if (!profileCanFeedDownstream(psl.status)) {
    violations.push({
      code: "FVAL-01",
      message: `No pueden validarse formalmente borradores de un PSL sustituido o archivado. Estado actual: "${psl.status}".`,
    });
  }

  if (!LEVEL3_FORMAL_VALIDATION_PERMISSION.allowedRoles.includes(validatedByRole)) {
    violations.push({
      code: "FVAL-02",
      message: `El rol "${validatedByRole}" no está autorizado para realizar validaciones formales del Nivel 3. Roles permitidos: ${LEVEL3_FORMAL_VALIDATION_PERMISSION.allowedRoles.join(", ")}.`,
    });
  }

  if (!validatedBy.trim()) {
    violations.push({
      code: "FVAL-03",
      message: "Debe indicarse el nombre y cargo del responsable que valida (validatedBy).",
    });
  }

  return violations;
}

// ── Creación del registro ──────────────────────────────────────────────────────

export function createFormalValidation(
  input: CreateFormalValidationInput
): FormalValidationResult {
  const violations = validateCreateFormalValidation(input);
  if (violations.length > 0) {
    return { ok: false, violations };
  }

  const { target, psl, validatedBy, validatedByRole, externalReference, validationNotes } = input;

  const record: FormalValidationRecord = {
    id: crypto.randomUUID(),
    target,
    sourcePSLId: psl.id,
    sourcePSLVersion: psl.version,
    validatedAt: new Date().toISOString(),
    validatedBy,
    validatedByRole,
    externalReference,
    validationNotes,
    profileValidationAtValidation: (({ level, met }) => ({ level, met }))(assessProfileValidation(psl.status, false)),
  };

  return { ok: true, record };
}
