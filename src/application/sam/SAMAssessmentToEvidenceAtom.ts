import { createEvidenceAtom, type EvidenceAtom } from "../../domain/evidence";
import type { SampleQualityAssessment } from "../../domain/sam/SampleQualityAssessment";
import { SAM_METHODOLOGY_VERSION } from "../../domain/sam/SampleQualityAssessment";
import { describeSAM } from "./describeSAM";
import { computeSampleQualityAssessment } from "./computeSampleQualityAssessment";

export function samAssessmentToEvidenceAtom(
  input: SampleQualityAssessment
): EvidenceAtom {
  const assessment = input.methodologyVersion === SAM_METHODOLOGY_VERSION ? input : {
    ...computeSampleQualityAssessment(input),
    composition: input.composition,
    computedAt: input.computedAt,
  };
  return createEvidenceAtom({
    id: `sam:${assessment.municipalityId}:${assessment.instrumentId}`,
    municipalityId: assessment.municipalityId,
    kind: "sample-quality",
    title: `SAM — Tamaño y composición: ${assessment.instrumentId}`,
    content: `${assessment.sampleQualityRationale} ${describeSAM(assessment)}`,
    confidence: "not-evaluable",
    provenance: {
      origin: "sam",
      sourceLabel: assessment.instrumentId,
      extractedAt: assessment.computedAt,
    },
    methodology: {
      version: SAM_METHODOLOGY_VERSION,
      description:
        `Cochran + FPC. Confianza: ${(assessment.cochranParams.confidence * 100).toFixed(0)} %. ` +
        `Error: ±${(assessment.cochranParams.marginOfError * 100).toFixed(0)} %. ` +
        `n teórico: ${assessment.nTheoretical} ` +
        `(N = ${assessment.populationReference.populationTotal}, ` +
        `${assessment.populationReference.ageGroupLabel}). ` +
        `Porcentaje del tamaño teórico (no cobertura poblacional): ${assessment.coverageGlobal.toFixed(1)} %. ` +
        `Fuente: ${assessment.populationReference.source} (${assessment.populationReference.year}).`,
      limitations: assessment.methodologicalCautions,
      requiresHumanValidation: true,
    },
    tags: ["sam", "sample-quality", assessment.instrumentId],
  });
}
