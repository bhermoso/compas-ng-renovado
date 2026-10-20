import type { LocalHealthProfileStatus } from "../health-profile/LocalHealthProfile";

/**
 * Criterio de calidad «Perfil validado».
 *
 * La validación técnica del Perfil de Salud Local no bloquea el trabajo posterior
 * (Lectura Estratégica, priorización, Plan de Acción, Plan Local de Salud). Se
 * informa como criterio de calidad: cada producto que parte del Perfil declara si
 * el criterio se cumple, y no lo oculta ni lo corrige.
 */
export type ProfileValidationLevel =
  | "approved"        // aprobado institucionalmente
  | "validated"       // validado técnicamente y vigente
  | "validated-stale" // validado, pero las fuentes han cambiado desde entonces
  | "not-validated"   // generado o en revisión; sin validación técnica
  | "retired";        // sustituido o archivado: no es el Perfil vigente

export interface ProfileValidationCriterion {
  readonly id: "perfil-validado";
  readonly level: ProfileValidationLevel;
  /** Verdadero solo si el Perfil está validado o aprobado y la validación sigue vigente. */
  readonly met: boolean;
  readonly label: string;
  readonly detail: string;
}

export function assessProfileValidation(
  status: LocalHealthProfileStatus | undefined,
  isStale: boolean
): ProfileValidationCriterion {
  const base = { id: "perfil-validado" as const };
  if (status === "superseded" || status === "archived") {
    return { ...base, level: "retired", met: false, label: "Perfil retirado",
      detail: "Este Perfil está sustituido o archivado; no es el Perfil vigente del municipio." };
  }
  if (status === "validated" || status === "approved") {
    if (isStale) {
      return { ...base, level: "validated-stale", met: false, label: "Validación desactualizada",
        detail: "El Perfil se validó, pero sus fuentes han cambiado desde entonces. Hay que revisarlo y volver a validarlo." };
    }
    return status === "approved"
      ? { ...base, level: "approved", met: true, label: "Perfil aprobado",
          detail: "Perfil aprobado institucionalmente." }
      : { ...base, level: "validated", met: true, label: "Perfil validado",
          detail: "Perfil validado técnicamente." };
  }
  return { ...base, level: "not-validated", met: false, label: "Perfil sin validar",
    detail: "El Perfil no tiene validación técnica. Lo que se construye a partir de él puede cambiar cuando se valide." };
}

/** Estados en los que el Perfil puede alimentar productos posteriores. */
export function profileCanFeedDownstream(status: LocalHealthProfileStatus | undefined): boolean {
  return status !== "superseded" && status !== "archived";
}
