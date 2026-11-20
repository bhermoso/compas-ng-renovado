import type { MunicipalityWorkspace } from "../domain/workspace";
import type { MunicipalDocument } from "../domain/repository";

/**
 * Corrección de metadatos históricamente comprobados en el seed de Loja.
 * No es un clasificador heurístico: exige ID, municipio, tipo, ámbito y
 * etiqueta del documento concreto. Nunca cambia contenido, original,
 * evidencia, plan validado, fechas, historial ni identificadores.
 */
export const LOJA_HISTORICAL_ACTION_PLAN_ID = "doc-action-plan-loja-2022";

export interface HistoricalDocumentNormalization {
  documentId: string;
  fromKind: MunicipalDocument["kind"];
  toKind: MunicipalDocument["kind"];
  reason: string;
}

export interface HistoricalNormalizationResult {
  workspace: MunicipalityWorkspace;
  changes: HistoricalDocumentNormalization[];
}

export function normalizeKnownMunicipalDocumentKinds(
  input: MunicipalityWorkspace,
): HistoricalNormalizationResult {
  if (input.municipality.identity.id !== "loja") {
    return { workspace: input, changes: [] };
  }
  const target = input.repository.documents.find(doc => doc.id === LOJA_HISTORICAL_ACTION_PLAN_ID);
  if (
    target?.municipalityId !== "loja" ||
    target.kind !== "strategic-framework" ||
    target.territorialScale !== "municipio" ||
    !target.tags.includes("action-plan") ||
    !target.tags.includes("historical-draft") ||
    target.sourceFileName !== "Plan Acción Loja.odt"
  ) {
    return { workspace: input, changes: [] };
  }

  const corrected: MunicipalDocument = { ...target, kind: "territorial-documentation" };
  return {
    workspace: {
      ...input,
      repository: {
        ...input.repository,
        documents: input.repository.documents.map(doc => doc.id === target.id ? corrected : doc),
      },
    },
    changes: [{
      documentId: target.id,
      fromKind: "strategic-framework",
      toKind: "territorial-documentation",
      reason: "Plan de Acción municipal de Loja de 2022; no es marco estratégico de aplicación general.",
    }],
  };
}

/** La modificación propuesta se limita exactamente a un campo. */
export function validateHistoricalNormalization(before: MunicipalityWorkspace, after: MunicipalityWorkspace): boolean {
  const original = before.repository.documents.find(doc => doc.id === LOJA_HISTORICAL_ACTION_PLAN_ID);
  const current = after.repository.documents.find(doc => doc.id === LOJA_HISTORICAL_ACTION_PLAN_ID);
  if (!original || !current) return false;
  const restored: MunicipalityWorkspace = {
    ...after,
    repository: {
      ...after.repository,
      documents: after.repository.documents.map(doc => doc.id === LOJA_HISTORICAL_ACTION_PLAN_ID ? { ...doc, kind: original.kind } : doc),
    },
  };
  return JSON.stringify(restored) === JSON.stringify(before);
}
