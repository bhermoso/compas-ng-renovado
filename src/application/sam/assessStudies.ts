// SAM cubre 6 estudios con evaluación implementada:
// IBSE (2 evaluaciones), DUKE-EAS, PREDIMED-EAS, SF-12 EAS, Sueño EAS, CAGE-EAS.
//
// IPAQ-EAS también procede de la Encuesta Andaluza de Salud pero no tiene función
// SAM implementada todavía (pendiente de definir la referencia poblacional adecuada).
//
// Los 6 estudios de administración propia vía REDCap municipal (AUDIT-C, GHQ-12,
// PHQ-9, PSQI, Fagerström, SBQ) no tienen evaluación SAM: carecen de referencia
// poblacional EAS metodológicamente equivalente.

import type { IBSEStudy } from "../../domain/ibse";
import { validateIBSEStrataCounts } from "../../domain/ibse";
import type { DUKEStudy } from "../../domain/duke";
import type { PREDIMEDStudy } from "../../domain/predimed";
import type { SF12Study } from "../../domain/sf12";
import type { SuenoStudy } from "../../domain/sueno";
import type { CAGEStudy } from "../../domain/cage";
import type { AgeSexCell, PopulationReference } from "../../domain/sam/PopulationReference";
import type { SampleQualityAssessment } from "../../domain/sam/SampleQualityAssessment";
import { computeSampleQualityAssessment } from "./computeSampleQualityAssessment";
import { computeHamiltonAllocation } from "./computeHamiltonAllocation";
import { computeCellRepresentativeness } from "./computeCellRepresentativeness";

// ── EAS — Encuesta Andaluza de Salud (adultos ≥16) ──────────────────────────

export function assessDUKEStudy(
  study: DUKEStudy,
  ref: PopulationReference
): SampleQualityAssessment {
  return computeSampleQualityAssessment({
    instrumentId: "duke-eas",
    municipalityId: study.municipalityId,
    nObserved: study.aggregates.nValidGlobal,
    populationReference: ref,
  });
}

export function assessPREDIMEDStudy(
  study: PREDIMEDStudy,
  ref: PopulationReference
): SampleQualityAssessment {
  return computeSampleQualityAssessment({
    instrumentId: "predimed-eas",
    municipalityId: study.municipalityId,
    nObserved: study.aggregates.nValid,
    populationReference: ref,
  });
}

export function assessSF12Study(
  study: SF12Study,
  ref: PopulationReference
): SampleQualityAssessment {
  // nValidPCS es el campo canónico primario del SF-12 EAS.
  // Se usa como estimador del tamaño muestral efectivo del instrumento.
  return computeSampleQualityAssessment({
    instrumentId: "sf12-eas",
    municipalityId: study.municipalityId,
    nObserved: study.aggregates.nValidPCS,
    populationReference: ref,
  });
}

export function assessSuenoStudy(
  study: SuenoStudy,
  ref: PopulationReference
): SampleQualityAssessment {
  // nValidP33R es el campo canónico primario del módulo Sueño EAS (~98 % cobertura).
  return computeSampleQualityAssessment({
    instrumentId: "sueno-eas",
    municipalityId: study.municipalityId,
    nObserved: study.aggregates.nValidP33R,
    populationReference: ref,
  });
}

export function assessCAGEStudy(
  study: CAGEStudy,
  ref: PopulationReference
): SampleQualityAssessment {
  // nValidCAGER es el campo canónico primario del CAGE EAS (~82 % cobertura).
  return computeSampleQualityAssessment({
    instrumentId: "cage-eas",
    municipalityId: study.municipalityId,
    nObserved: study.aggregates.nValidCAGER,
    populationReference: ref,
  });
}

// ── IBSE — evaluación SAM gobernada por el discriminador de muestra ──────────
//
// Corrección metodológica (revisión 2026-07-16): la evaluación SAM del IBSE
// depende del universo etario REAL de la muestra (`study.sampleScope`), no de una
// doble evaluación que reutilizaba el mismo `nValid` total contra dos poblaciones
// (el antiguo par assessIBSEStudy16Plus / assessIBSEStudyFull, retirado).
//
// Reglas:
//   - "16-plus": se evalúa SOLO contra la referencia adulta/EAS (≥16).
//   - "under-16": se evalúa SOLO contra una referencia poblacional de menores.
//   - "mixed": produce dictámenes por estrato SOLO si existen recuentos válidos
//     desglosados (`strataCounts`) Y ambas referencias. En otro caso NO es
//     evaluable por estrato (nunca se reutiliza el nValid total para ambos grupos).
//   - "unknown": no evaluable (dato legacy o sin desglose de edad).

/** Referencias poblacionales disponibles para la evaluación SAM del IBSE. */
export interface IBSEPopulationRefs {
  /** Universo adulto/EAS (≥16 años). */
  adult?: PopulationReference;
  /** Universo de menores (población escolar de referencia). */
  minor?: PopulationReference;
}

/** Resultado de la evaluación SAM del IBSE, gobernada por el discriminador. */
export interface IBSESAMResult {
  scope: IBSEStudy["sampleScope"];
  evaluable: boolean;
  /** Motivo cuando `evaluable` es false. */
  notEvaluableReason?: string;
  /** Dictamen del estrato de menores (cuando procede). */
  under16?: SampleQualityAssessment;
  /** Dictamen del estrato de 16 o más (cuando procede). */
  plus16?: SampleQualityAssessment;
}

function assess16Plus(
  study: IBSEStudy,
  nObserved: number,
  refAdult: PopulationReference
): SampleQualityAssessment {
  return computeSampleQualityAssessment({
    instrumentId: "ibse-16plus",
    municipalityId: study.municipalityId,
    nObserved,
    populationReference: refAdult,
  });
}

function assessUnder16(
  study: IBSEStudy,
  nObserved: number,
  refMinor: PopulationReference
): SampleQualityAssessment {
  return computeSampleQualityAssessment({
    instrumentId: "ibse-under16",
    municipalityId: study.municipalityId,
    nObserved,
    populationReference: refMinor,
  });
}

export function assessIBSEStudySAM(
  study: IBSEStudy,
  refs: IBSEPopulationRefs
): IBSESAMResult {
  const scope = study.sampleScope;

  if (scope === "16-plus") {
    if (refs.adult === undefined) {
      return { scope, evaluable: false, notEvaluableReason: "Sin referencia poblacional adulta (≥16) verificada para este municipio." };
    }
    return { scope, evaluable: true, plus16: assess16Plus(study, study.aggregates.nValid, refs.adult) };
  }

  if (scope === "under-16") {
    if (refs.minor === undefined) {
      return { scope, evaluable: false, notEvaluableReason: "Sin referencia poblacional de menores verificada para este municipio." };
    }
    return { scope, evaluable: true, under16: assessUnder16(study, study.aggregates.nValid, refs.minor) };
  }

  if (scope === "mixed") {
    // Orden de comprobaciones (diagnóstico veraz):
    //   1. desglose ausente o inválido;
    //   2. desglose válido pero falta la referencia de menores;
    //   3. desglose válido pero falta la referencia de 16+;
    //   4. desglose válido y ambas referencias → ambos dictámenes.
    const strata = validateIBSEStrataCounts(study.strataCounts, study.aggregates);
    if (!strata.valid) {
      return {
        scope,
        evaluable: false,
        notEvaluableReason:
          study.strataCounts === undefined
            ? "Muestra mixta sin desglose etario: no evaluable por estrato con este export."
            : `Muestra mixta con desglose inválido: ${strata.reason}`,
      };
    }
    // El desglose SÍ es válido: lo que puede faltar es una referencia poblacional.
    if (refs.minor === undefined) {
      return {
        scope,
        evaluable: false,
        notEvaluableReason:
          "Desglose etario válido, pero falta la referencia poblacional de menores para evaluar el estrato de menores de 16.",
      };
    }
    if (refs.adult === undefined) {
      return {
        scope,
        evaluable: false,
        notEvaluableReason:
          "Desglose etario válido, pero falta la referencia poblacional adulta (≥16) para evaluar el estrato de 16 o más.",
      };
    }
    // Cada estrato con SU propio nValid: nunca se reutiliza el total.
    return {
      scope,
      evaluable: true,
      under16: assessUnder16(study, study.strataCounts!.under16!.nValid, refs.minor),
      plus16: assess16Plus(study, study.strataCounts!.plus16!.nValid, refs.adult),
    };
  }

  // unknown
  return {
    scope,
    evaluable: false,
    notEvaluableReason: "Discriminador de muestra desconocido (dato legacy): no evaluable por estrato.",
  };
}

// ── Representatividad demográfica (Hamilton + desviaciones por celda) ─────────
//
// Solo actúa cuando PopulationReference.ageSexMatrix está disponible Y se
// aporta la distribución observada por celda (ageSexObserved). En su ausencia,
// el flujo Cochran + cobertura global no se modifica.

/**
 * Enriquece un SampleQualityAssessment existente con la evaluación de
 * representatividad demográfica por celda (edad × sexo).
 *
 * @param assessment    Dictamen SAM ya calculado (Cochran + cobertura).
 * @param ageSexObserved  Distribución observada por celda en la muestra.
 *   Debe tener el mismo número de bandas y el mismo orden que
 *   assessment.populationReference.ageSexMatrix.
 * @returns  El mismo dictamen enriquecido con `representativeness`.
 *   Si ageSexMatrix no está en la referencia, devuelve el dictamen sin cambios.
 */
export function enrichWithRepresentativeness(
  assessment: SampleQualityAssessment,
  ageSexObserved: AgeSexCell[]
): SampleQualityAssessment {
  const matrix = assessment.populationReference.ageSexMatrix;
  if (matrix === undefined) {
    return assessment;
  }

  const theoretical = computeHamiltonAllocation(matrix, assessment.nTheoretical);
  const achieved = ageSexObserved.map((c) => ({
    ageBand: c.ageBand,
    male: c.male,
    female: c.female,
  }));

  const representativeness = computeCellRepresentativeness(
    theoretical.cells,
    achieved
  );

  return { ...assessment, representativeness };
}
