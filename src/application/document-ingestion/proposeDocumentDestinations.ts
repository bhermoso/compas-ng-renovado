import type { DocumentKind } from "../../domain/repository";
import type { PreliminaryAnalysis } from "./preliminaryDocumentAnalyzer";

export interface DocumentDestinationProposal {
  target: "health-report" | "complementary-studies" | "document-ingestion" | "manual-review";
  label: string;
  basis: string;
  requiresHumanConfirmation: true;
}

/** Suggestions refer only to existing COMPÁS UI paths, and never import data. */
export function proposeDocumentDestinations(
  analysis: PreliminaryAnalysis,
  declaredKind: DocumentKind | "undetermined"
): DocumentDestinationProposal[] {
  if (analysis.format === "zip") return [{
    target:"manual-review",label:"Revisar cada entrada del ZIP",
    basis:"Un ZIP puede contener archivos destinados a módulos distintos.",
    requiresHumanConfirmation:true
  }];
  if (analysis.format === "csv" && (analysis.methodologicalMatches?.length ?? 0) > 0) return [{
    target:"complementary-studies",label:"Estudios complementarios",
    basis:"La cabecera coincide parcialmente o totalmente con adaptadores metodológicos; el parser específico aún debe validar los datos.",
    requiresHumanConfirmation:true
  }];
  if (declaredKind === "health-report" && (analysis.format === "pdf" || analysis.format === "docx" || analysis.format === "doc")) return [{
    target:"health-report",label:"Informe de Salud",
    basis:"Tipo declarado manualmente; la carga existente deberá comprobar el contenido.",
    requiresHumanConfirmation:true
  }];
  if (["strategic-framework","territorial-documentation","qualitative-material"].includes(declaredKind) && (analysis.format === "pdf" || analysis.format === "docx")) return [{
    target:"document-ingestion",label:"Incorporar nueva documentación",
    basis:"Tipo declarado y formato compatible con la carga documental existente.",
    requiresHumanConfirmation:true
  }];
  return [{
    target:"manual-review",label:"Revisión documental manual",
    basis:"Sin ruta especializada verificada para esta combinación de formato y clasificación.",
    requiresHumanConfirmation:true
  }];
}
