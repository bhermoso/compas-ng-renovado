import type { EvidenceAtom } from "../../domain/evidence";
import type { SampleQualityAssessment } from "../../domain/sam";
import { computeSampleQualityAssessment } from "./computeSampleQualityAssessment";
import { samAssessmentToEvidenceAtom } from "./SAMAssessmentToEvidenceAtom";

/** Explicit, non-persisting migration plan. Archive `previous` before replacement. */
export function planSAMEvidenceMigration(previous: EvidenceAtom, assessment: SampleQualityAssessment) {
  if (previous.provenance.origin !== "sam" || previous.municipalityId !== assessment.municipalityId ||
      previous.id !== `sam:${assessment.municipalityId}:${assessment.instrumentId}`) {
    throw new Error("La evidencia histórica no corresponde a esta evaluación SAM.");
  }
  const recalculated = computeSampleQualityAssessment({
    ...assessment,
    // Historical values never certify unique residents or matching periods.
    participationBasis: undefined,
  });
  const replacement = samAssessmentToEvidenceAtom({ ...recalculated, composition: assessment.composition });
  return { previous: structuredClone(previous), replacement };
}
