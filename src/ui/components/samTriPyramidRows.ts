import type { SampleQualityAssessment } from "../../domain/sam";
import { computeHamiltonAllocation } from "../../application/sam/computeHamiltonAllocation";
import type { CellDeviation } from "../../application/sam/computeCellRepresentativeness";

export type SamTriPyramidRow = {
  ageBand: string;
  popMale: number;
  popFemale: number;
  idealMale: number;
  idealFemale: number;
  /** Porcentajes sobre el total de cada pirámide. */
  pctPop: { male: number; female: number };
  pctIdeal: { male: number; female: number };
  pctAchieved: { male: number; female: number };
  diff: { male: number | null; female: number | null };
};

export function buildSamTriPyramidRows(
  assessment: SampleQualityAssessment
): { rows: SamTriPyramidRow[] } | { notEvaluable: string } {
  const matrix = assessment.populationReference.ageSexMatrix;
  if (!matrix || matrix.length === 0) {
    return {
      notEvaluable:
        "No evaluable: falta el padrón desglosado por edad y sexo para este municipio.",
    };
  }
  const rep = assessment.representativeness;
  if (!rep) {
    return {
      notEvaluable:
        "No evaluable: la muestra no dispone de edad y sexo de los participantes, por lo que no puede compararse con la población.",
    };
  }
  if (rep.cells.length !== matrix.length * 2) {
    return {
      notEvaluable:
        "No evaluable: las bandas de edad de la muestra no coinciden con las del padrón.",
    };
  }

  const cell = (band: string, sex: "male" | "female"): CellDeviation | undefined =>
    rep.cells.find((c) => c.ageBand === band && c.sex === sex);
  const missing = matrix.some((m) => !cell(m.ageBand, "male") || !cell(m.ageBand, "female"));
  if (missing) {
    return {
      notEvaluable:
        "No evaluable: las bandas de edad de la muestra no coinciden con las del padrón.",
    };
  }

  const allocation = computeHamiltonAllocation(matrix, assessment.nTheoretical);
  const popTotal = matrix.reduce((s, c) => s + c.male + c.female, 0);
  const idealTotal = allocation.cells.reduce((s, c) => s + c.male + c.female, 0);
  if (popTotal === 0 || idealTotal === 0) {
    return { notEvaluable: "No evaluable: el padrón o la muestra teórica no tienen efectivos." };
  }

  const rows: SamTriPyramidRow[] = matrix.map((m, i) => {
    const cm = cell(m.ageBand, "male") as CellDeviation;
    const cf = cell(m.ageBand, "female") as CellDeviation;
    const a = allocation.cells[i];
    return {
      ageBand: m.ageBand,
      popMale: m.male,
      popFemale: m.female,
      idealMale: a.male,
      idealFemale: a.female,
      pctPop: { male: (m.male / popTotal) * 100, female: (m.female / popTotal) * 100 },
      pctIdeal: { male: (a.male / idealTotal) * 100, female: (a.female / idealTotal) * 100 },
      pctAchieved: { male: cm.pctAchieved, female: cf.pctAchieved },
      diff: { male: cm.diffPp, female: cf.diffPp },
    };
  });
  return { rows };
}

