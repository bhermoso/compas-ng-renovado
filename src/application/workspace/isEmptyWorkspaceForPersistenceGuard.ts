import type { MunicipalityWorkspace } from "../../domain/workspace";

/**
 * Determina si un workspace está vacío a efectos de la guardia de persistencia.
 *
 * Contexto: cuando loadWorkspaceFromLocalStorage() falla pero hay datos en localStorage,
 * App.tsx activa una guardia que impide que un workspace recién creado (vacío) sobreescriba
 * los datos existentes. Esta función define qué significa "vacío" en ese contexto.
 *
 * INVARIANTE: toda colección opcional de MunicipalityWorkspace que el usuario pueda poblar
 * DEBE aparecer aquí. Si falta una colección, el guard puede bloquear el guardado de datos
 * reales, provocando pérdida silenciosa de información.
 *
 * Última revisión: Intervención GES (2026-07-02) — añadido questionnaireProjects;
 *   auditoría de cierre — añadido compiledProfiles, pslApproval, formalValidations.
 *   Incidente de persistencia (2026-07-07) — añadidos los siete estudios incorporados
 *   después de la revisión anterior (AUDIT-C, IPAQ, GHQ-12, PHQ-9, PSQI, Fagerström, SBQ),
 *   projectDatasetImports y perfilLocalDeSalud. La omisión reproducía la causa raíz de
 *   la Intervención 3: un workspace con SOLO esas colecciones se consideraba "vacío"
 *   y el guard bloqueaba su guardado, con pérdida silenciosa.
 */
export function isEmptyWorkspaceForPersistenceGuard(
  workspace: MunicipalityWorkspace
): boolean {
  return (
    workspace.repository.documents.length === 0 &&
    workspace.evidenceStore.atoms.length === 0 &&
    workspace.healthReport === undefined &&
    workspace.ibseStudy === undefined &&
    workspace.dukeStudy === undefined &&
    workspace.predimedStudy === undefined &&
    workspace.sf12Study === undefined &&
    workspace.suenoStudy === undefined &&
    workspace.cageStudy === undefined &&
    workspace.auditcStudy === undefined &&
    workspace.ipaqStudy === undefined &&
    workspace.ghq12Study === undefined &&
    workspace.phq9Study === undefined &&
    workspace.psqiStudy === undefined &&
    workspace.fagerstromStudy === undefined &&
    workspace.sbqStudy === undefined &&
    workspace.thematicPrioritisation === undefined &&
    workspace.thematicPrioritisationStudy === undefined &&
    workspace.deliberativePrioritySelection === undefined &&
    (workspace.actionPlanModuleReviews?.length ?? 0) === 0 &&
    (workspace.planPreparationDrafts?.length ?? 0) === 0 &&
    (workspace.indicatorWorksheets?.length ?? 0) === 0 &&
    (workspace.agendaActuations?.length ?? 0) === 0 &&
    (workspace.historialEstadosTerritorial?.length ?? 0) === 0 &&
    workspace.validatedPSL === undefined &&
    (workspace.compiledProfiles?.length ?? 0) === 0 &&
    workspace.pslApproval === undefined &&
    (workspace.formalValidations?.length ?? 0) === 0 &&
    // Proyectos GES — omitido en Intervención 3, causa raíz de la regresión de persistencia
    (workspace.questionnaireProjects?.length ?? 0) === 0 &&
    (workspace.projectDatasetImports?.length ?? 0) === 0 &&
    // Perfil interpretativo: cuenta como contenido cuando tiene algún elemento
    ((workspace.perfilLocalDeSalud?.interpretaciones.length ?? 0) +
      (workspace.perfilLocalDeSalud?.hipotesis.length ?? 0) +
      (workspace.perfilLocalDeSalud?.preguntasAbiertas.length ?? 0)) === 0
  );
}
