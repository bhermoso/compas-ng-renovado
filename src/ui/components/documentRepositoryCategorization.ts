import type { DocumentKind, MunicipalDocument } from "../../domain/repository";

export const STUDY_LABEL_BY_TAG: Record<string, string> = {
  ibse: "IBSE",
  "duke-eas": "DUKE-EAS",
  "predimed-eas": "PREDIMED-EAS",
  "sf12-eas": "SF-12 EAS",
  "sueno-eas": "Sueño EAS",
  "cage-eas": "CAGE-EAS",
  auditc: "AUDIT-C",
  "ipaq-eas": "IPAQ-EAS",
  ghq12: "GHQ-12",
  phq9: "PHQ-9",
  psqi: "PSQI",
  fagerstrom: "Fagerström",
  sbq: "SBQ",
};

export const KIND_LABEL: Record<DocumentKind, string> = {
  "health-report": "Informe sobre la situación de salud",
  "localiza-salud": "Localiza Salud",
  "strategic-framework": "Marco estratégico y normativo",
  "complementary-study": "Estudio complementario",
  "eas-variable": "Variable EAS",
  "cmi-indicator": "Indicador CMI",
  "community-asset": "Activo comunitario",
  "redcap-export": "Exportación REDCap",
  "territorial-documentation": "Documentación territorial",
  "qualitative-material": "Material cualitativo",
  "longitudinal-evidence": "Evidencia longitudinal",
  other: "Otro documento",
};

export type DocCategory =
  | "primary-source"
  | "complementary-study"
  | "community-asset"
  | "strategic-input"
  | "other-source";

export function getCategory(document: MunicipalDocument): DocCategory {
  if (document.kind === "health-report") return "primary-source";
  if (document.kind === "community-asset" || document.kind === "localiza-salud") return "community-asset";
  if (
    document.kind === "complementary-study" ||
    (document.kind === "redcap-export" && document.tags.some((tag) => STUDY_LABEL_BY_TAG[tag] !== undefined))
  ) {
    return "complementary-study";
  }
  // Los marcos estratégicos y normativos son base de la fase de Plan de
  // Acción / Plan Local de Salud. El Perfil concluye, pero no recomienda:
  // estos documentos no forman parte del diagnóstico territorial.
  if (document.kind === "strategic-framework") return "strategic-input";
  return "other-source";
}
