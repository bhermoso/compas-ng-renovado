import type { IBSEAdjustment, IBSEMeanField } from "../../domain/ibse/IBSEAdjustment";
import { ageBandsForMunicipality } from "../sam/ageBandsForMunicipality";
import { getPopulationReferenceSet } from "../sam/populationReferenceRegistry";
import { computePoststratifiedMean } from "../sam/computePoststratifiedMean";
import { parseIBSECSV } from "./IBSECSVParser";

/** Raw response rows are used transiently, never persisted in the study or atoms. */
export type IBSEAdjustmentTarget = "none" | "15-plus";

export async function prepareIBSEImport(text: string, municipalityId: string, target: IBSEAdjustmentTarget = "none") {
  const bands = ageBandsForMunicipality(municipalityId);
  const { adjustmentRows = [], ...parsed } = parseIBSECSV(text, { ageBands: bands, collectAdjustmentRows: true });
  const blocked = (reason: string) => ({ ...parsed, demographicAdjustment: { status: "blocked", reasons: [reason] } as IBSEAdjustment });
  if (target === "none") return blocked("No se ha solicitado ajuste demográfico. Se conservan las medias participantes.");
  if (parsed.warnings.length) return blocked("El archivo no contiene todas las columnas requeridas para verificar el ajuste.");
  const registered = getPopulationReferenceSet(municipalityId).allAges;
  if (!registered?.ageSexMatrix) return blocked("El municipio no dispone de una referencia poblacional por edad y sexo registrada.");
  // The 15-year boundary matches whole quinquennial cells; never split 15-19 to invent a 16+ reference.
  const reference = structuredClone(registered);
  reference.ageSexMatrix = reference.ageSexMatrix!.filter((cell) => bands.some((band) => band.label === cell.ageBand && band.min >= 15));
  reference.populationTotal = reference.ageSexMatrix.reduce((sum, cell) => sum + cell.male + cell.female, 0);
  reference.ageGroupLabel = "15 años y más";
  if (!adjustmentRows.length) return blocked("No hay respuestas válidas para calcular el ajuste.");
  const normalized = adjustmentRows.map((row) => {
    const age = /^\d+$/.test(row.age) ? Number(row.age) : NaN;
    const band = bands.find((b) => Number.isSafeInteger(age) && age >= b.min && age <= b.max);
    const sex = ["1", "male", "hombre"].includes(row.sex.toLowerCase()) ? "male" as const
      : ["2", "female", "mujer"].includes(row.sex.toLowerCase()) ? "female" as const : undefined;
    return { ...row, band, sex };
  });
  if (normalized.some((row) => !row.band || !row.sex || Object.values(row.values).some((value) => !Number.isFinite(value) || value < 0 || value > 100))) {
    return blocked("Hay respuestas sin edad o sexo asignables, o puntuaciones fuera de 0–100. No se han excluido silenciosamente para ponderar.");
  }
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  const sampleFingerprint = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  const fields: IBSEMeanField[] = ["meanTotal", "meanFactorVinculo", "meanFactorSituacion", "meanFactorControl", "meanFactorPersona"];
  const metrics = {} as Extract<IBSEAdjustment, { status: "computed" }>["metrics"];
  let lastResult;
  for (const field of fields) {
    const result = computePoststratifiedMean({
      municipalityCode: reference.municipalityCode,
      sampleId: `ibse:${municipalityId}:${sampleFingerprint}`,
      sampleFingerprint,
      reference,
      observations: normalized.map((row) => ({ ageBand: row.band!.label, sex: row.sex!, value: row.values[field] })),
    });
    if (result.status === "blocked") return { ...parsed, demographicAdjustment: result as IBSEAdjustment };
    metrics[field] = { observedMean: result.observedMean, adjustedMean: result.adjustedMean, nValid: result.nValid, sumWeights: result.sumWeights, effectiveSampleSize: result.effectiveSampleSize };
    lastResult = result;
  }
  const demographicAdjustment: IBSEAdjustment = {
    status: "computed", sampleFingerprint, reference: structuredClone(reference), metrics,
    method: "age-sex-poststratification-v1", requiresHumanValidation: true,
    cells: lastResult!.cells,
    methodologicalCautions: lastResult!.methodologicalCautions,
  };
  return { ...parsed, demographicAdjustment, methodologicalCautions: [
    ...parsed.methodologicalCautions.filter((caution) => !caution.startsWith("No se ha aplicado ponderación demográfica")),
    "Las medias principales son observadas. El ajuste demográfico se conserva por separado y está pendiente de validación humana.",
    ...demographicAdjustment.methodologicalCautions,
  ] };
}
