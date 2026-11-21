import type { MunicipalDocument } from "../domain/repository";

/**
 * Organización de lectura del archivo por función municipal, no por extensión.
 * Compatible con fichas históricas: en Loja el Plan de Acción 2022 figura
 * erróneamente como strategic-framework, pero pertenece al expediente local.
 * No muta fichas, IDs, originales, evidencias ni estados de validación.
 */
export const MUNICIPAL_DOCUMENT_SECTIONS = [
  { id: "health", label: "01 · Informes de Salud", detail: "Fuentes sanitarias primarias del territorio" },
  { id: "profile", label: "02 · Perfiles y documentos de diagnóstico", detail: "Perfiles históricos y documentación diagnóstica municipal" },
  { id: "studies", label: "03 · Estudios e indicadores complementarios", detail: "IBSE, REDCap, estadísticas y actualizaciones específicas" },
  { id: "assets", label: "04 · Activos para la salud", detail: "Inventarios y recursos comunitarios del ámbito" },
  { id: "prioritization", label: "05 · Priorización", detail: "Resultados y documentos de priorización participativa" },
  { id: "plans", label: "06 · Planes de Acción municipales", detail: "Planes y borradores propios, no marcos generales" },
  { id: "strategic", label: "07 · Copias municipales de marcos comunes", detail: "El marco estratégico común es el mismo en todos los expedientes; estas copias no forman parte de la evidencia local" },
  { id: "other", label: "08 · Otras fuentes territoriales", detail: "Documentación local que requiere clasificación" },
] as const;

export type MunicipalDocumentSection = typeof MUNICIPAL_DOCUMENT_SECTIONS[number]["id"];

function norm(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
}
const tagged = (document: MunicipalDocument, fragment: string) =>
  document.tags.some(tag => norm(tag).includes(fragment));

export function municipalDocumentSection(document: MunicipalDocument): MunicipalDocumentSection {
  const title = norm(document.title);
  // Una priorización que propone líneas de acción no es por ello un Plan aprobado
  // ni un borrador autónomo de Plan de Acción.
  if (tagged(document,"prioriti") || tagged(document,"prioriz") ||
    (document.kind === "qualitative-material" && /prioriz/.test(title))) return "prioritization";
  const localPlan = tagged(document,"action-plan") || tagged(document,"plan-local") ||
    (document.territorialScale === "municipio" && /plan de accion|plan local de salud/.test(title));
  if (localPlan) return "plans";
  if (document.kind === "health-report") return "health";
  if (document.kind === "localiza-salud" || document.kind === "community-asset") return "assets";
  if (document.kind === "complementary-study" || document.kind === "redcap-export" ||
    document.kind === "eas-variable" || document.kind === "cmi-indicator") return "studies";
  if (document.kind === "strategic-framework") return "strategic";
  if (document.kind === "territorial-documentation" && /perfil|diagnostico/.test(title)) return "profile";
  return "other";
}

export function organizeMunicipalDocuments(documents: readonly MunicipalDocument[]) {
  return MUNICIPAL_DOCUMENT_SECTIONS.map(section => ({
    ...section,
    documents: documents.filter(document => municipalDocumentSection(document) === section.id),
  }));
}
