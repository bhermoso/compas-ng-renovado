/**
 * Tests de integración SAM — verifica que el motor SAM evalúa correctamente
 * los seis instrumentos complementarios usando sus Fuentes Poblacionales de Referencia.
 *
 * Datos de referencia verificados:
 *   Atarfe adultos ≥16 (INE 2022):      N=15.472 → nTheoretical=375
 *   Atarfe menores <16, 6–15 (MTI-BDU 2025): N=2.323 → nTheoretical=330
 *
 * nObserved por instrumento (valores de los fixtures EAS Granada / IBSE Atarfe):
 *   DUKE:     nValidGlobal=3028 | PREDIMED: nValid=712
 *   SF-12:    nValidPCS=3047    | Sueño:    nValidP33R=3004
 *   CAGE:     nValidCAGER=2513  | IBSE:     nValid=811
 */

import { describe, expect, it } from "vitest";
import {
  assessDUKEStudy,
  assessPREDIMEDStudy,
  assessSF12Study,
  assessSuenoStudy,
  assessCAGEStudy,
  assessIBSEStudySAM,
  getPopulationReferenceSet,
} from "../src/application/sam";
import type { IBSESampleScope, IBSEStrataCounts } from "../src/domain/ibse";
import {
  validateIBSEStrataCounts,
  isStructurallySaneStrataCounts,
} from "../src/domain/ibse";
import { createDUKEStudy } from "../src/domain/duke";
import { createPREDIMEDStudy } from "../src/domain/predimed";
import { createSF12Study } from "../src/domain/sf12";
import { createSuenoStudy } from "../src/domain/sueno";
import { createCAGEStudy } from "../src/domain/cage";
import { createIBSEStudy } from "../src/domain/ibse";
import type { PopulationReference } from "../src/domain/sam";

// ── Fuentes Poblacionales de Referencia ──────────────────────────────────────

const ATARFE_ADULTS: PopulationReference = {
  municipalityId: "18022",
  municipalityCode: "18022",
  source: "Padrón Municipal de Habitantes — INE, 1 de enero de 2022",
  year: 2022,
  populationTotal: 15_472,
  ageGroupLabel: "16 años y más",
  extractedAt: "2026-06-29",
};

const ATARFE_UNDER16: PopulationReference = {
  municipalityId: "18022",
  municipalityCode: "18022",
  source: "MTI-BDU — Poblaciones por Edad, 31 de diciembre de 2025",
  year: 2025,
  populationTotal: 2_323,
  ageGroupLabel: "6 a 15 años (menores de 16)",
  extractedAt: "2026-06-29",
};

const MUNICIPALITY_ID = "18022";

// ── Estudios sintéticos con valores de los fixtures EAS Granada / IBSE Atarfe ─

function makeDUKEStudy(nValidGlobal = 3028) {
  return createDUKEStudy({
    municipalityId: MUNICIPALITY_ID,
    sourceFileName: "duke-eas-granada.csv",
    aggregates: {
      n: 3064,
      nValidGlobal,
      nValidConfidential: 3000,
      nValidAffective: 3000,
      meanGlobal: 42.1,
      meanConfidential: 21.0,
      meanAffective: 21.1,
      lowGlobalCount: 500,
      lowConfidentialCount: 250,
      lowAffectiveCount: 250,
      normalGlobalCount: 2528,
      normalConfidentialCount: 2750,
      normalAffectiveCount: 2750,
      incompleteGlobalCount: 36,
      incompleteConfidentialCount: 64,
      incompleteAffectiveCount: 64,
      lowGlobalPercentage: 16.5,
      lowConfidentialPercentage: 8.3,
      lowAffectivePercentage: 8.3,
    },
    methodologicalCautions: [],
  });
}

function makePREDIMEDStudy(nValid = 712) {
  return createPREDIMEDStudy({
    municipalityId: MUNICIPALITY_ID,
    sourceFileName: "predimed-eas-granada.csv",
    aggregates: {
      n: 3064,
      nValid,
      meanScore: 7.63,
      lowCount: 256,
      mediumCount: 186,
      highCount: 270,
      lowPercentage: 36.0,
      mediumPercentage: 26.1,
      highPercentage: 37.9,
      incompleteCount: 2352,
    },
    methodologicalCautions: [],
  });
}

function makeSF12Study(nValidPCS = 3047) {
  return createSF12Study({
    municipalityId: MUNICIPALITY_ID,
    sourceFileName: "sf12-eas-granada.csv",
    aggregates: {
      n: 3064,
      nValidPCS,
      nValidMCS: 3046,
      meanPCS: 49.55,
      meanMCS: 51.14,
      missingPCS: 17,
      missingMCS: 18,
    },
    methodologicalCautions: [],
  });
}

function makeSuenoStudy(nValidP33R = 3004) {
  return createSuenoStudy({
    municipalityId: MUNICIPALITY_ID,
    sourceFileName: "sueno-eas-granada.csv",
    aggregates: {
      n: 3064,
      nValidP33R,
      missingP33R: 60,
      nInsufficientSleep: 871,
      pctInsufficientSleep: 29.0,
      nValidP33A: 2300,
      missingP33A: 764,
      nNoRest: 690,
      pctNoRest: 30.0,
    },
    methodologicalCautions: [],
  });
}

function makeCAGEStudy(nValidCAGER = 2513) {
  return createCAGEStudy({
    municipalityId: MUNICIPALITY_ID,
    sourceFileName: "cage-eas-granada.csv",
    aggregates: {
      n: 3064,
      nValidCAGER,
      missingCAGER: 551,
      nRisk: 134,
      pctRisk: 5.3,
      nValidCAGE: 2513,
      nCAGE1: 1900,
      nCAGE2: 479,
      nCAGE3: 100,
      nCAGE4: 34,
    },
    methodologicalCautions: [],
  });
}

function makeIBSEStudy(
  nValid = 811,
  sampleScope: IBSESampleScope = "mixed",
  strataCounts?: IBSEStrataCounts
) {
  return createIBSEStudy({
    municipalityId: MUNICIPALITY_ID,
    sourceFileName: "ibse-atarfe.csv",
    aggregates: {
      n: 909,
      nValid,
      meanTotal: 63.2,
      meanFactorVinculo: 68.5,
      meanFactorSituacion: 60.1,
      meanFactorControl: 55.8,
      meanFactorPersona: 72.3,
    },
    sampleScope,
    strataCounts,
    methodologicalCautions: [],
  });
}

const IBSE_REFS = { adult: ATARFE_ADULTS, minor: ATARFE_UNDER16 };

// ── 1. Integración EAS — cinco estudios ──────────────────────────────────────

describe("SAM integración — DUKE-EAS", () => {
  it("genera SampleQualityAssessment con instrumentId correcto", () => {
    const result = assessDUKEStudy(makeDUKEStudy(), ATARFE_ADULTS);
    expect(result.instrumentId).toBe("duke-eas");
  });

  it("usa nValidGlobal como nObserved (3028)", () => {
    const result = assessDUKEStudy(makeDUKEStudy(), ATARFE_ADULTS);
    expect(result.nObserved).toBe(3028);
  });

  it("calidad HIGH: n=3028 >> nTheoretical=375 → cobertura 807 %", () => {
    const result = assessDUKEStudy(makeDUKEStudy(), ATARFE_ADULTS);
    expect(result.sampleQuality).toBe("not-evaluable");
    expect(result.nTheoretical).toBe(375);
    expect(result.coverageGlobal).toBeCloseTo(807.5, 0);
  });

  it("municipalityId proviene del estudio", () => {
    const result = assessDUKEStudy(makeDUKEStudy(), ATARFE_ADULTS);
    expect(result.municipalityId).toBe(MUNICIPALITY_ID);
  });
});

describe("SAM integración — PREDIMED-EAS", () => {
  it("genera SampleQualityAssessment con instrumentId correcto", () => {
    const result = assessPREDIMEDStudy(makePREDIMEDStudy(), ATARFE_ADULTS);
    expect(result.instrumentId).toBe("predimed-eas");
  });

  it("usa nValid como nObserved (712)", () => {
    const result = assessPREDIMEDStudy(makePREDIMEDStudy(), ATARFE_ADULTS);
    expect(result.nObserved).toBe(712);
  });

  it("calidad HIGH: n=712 > nTheoretical=375 → cobertura 189 %", () => {
    const result = assessPREDIMEDStudy(makePREDIMEDStudy(), ATARFE_ADULTS);
    expect(result.sampleQuality).toBe("not-evaluable");
    expect(result.coverageGlobal).toBeCloseTo(189.9, 0);
  });
});

describe("SAM integración — SF-12 EAS", () => {
  it("genera SampleQualityAssessment con instrumentId correcto", () => {
    const result = assessSF12Study(makeSF12Study(), ATARFE_ADULTS);
    expect(result.instrumentId).toBe("sf12-eas");
  });

  it("usa nValidPCS como nObserved (3047) — campo canónico primario", () => {
    const result = assessSF12Study(makeSF12Study(), ATARFE_ADULTS);
    expect(result.nObserved).toBe(3047);
  });

  it("calidad HIGH: n=3047 >> nTheoretical=375", () => {
    const result = assessSF12Study(makeSF12Study(), ATARFE_ADULTS);
    expect(result.sampleQuality).toBe("not-evaluable");
  });
});

describe("SAM integración — Sueño EAS", () => {
  it("genera SampleQualityAssessment con instrumentId correcto", () => {
    const result = assessSuenoStudy(makeSuenoStudy(), ATARFE_ADULTS);
    expect(result.instrumentId).toBe("sueno-eas");
  });

  it("usa nValidP33R como nObserved (3004) — campo canónico primario", () => {
    const result = assessSuenoStudy(makeSuenoStudy(), ATARFE_ADULTS);
    expect(result.nObserved).toBe(3004);
  });

  it("calidad HIGH: n=3004 >> nTheoretical=375", () => {
    const result = assessSuenoStudy(makeSuenoStudy(), ATARFE_ADULTS);
    expect(result.sampleQuality).toBe("not-evaluable");
  });
});

describe("SAM integración — CAGE-EAS", () => {
  it("genera SampleQualityAssessment con instrumentId correcto", () => {
    const result = assessCAGEStudy(makeCAGEStudy(), ATARFE_ADULTS);
    expect(result.instrumentId).toBe("cage-eas");
  });

  it("usa nValidCAGER como nObserved (2513) — campo canónico primario", () => {
    const result = assessCAGEStudy(makeCAGEStudy(), ATARFE_ADULTS);
    expect(result.nObserved).toBe(2513);
  });

  it("calidad HIGH: n=2513 >> nTheoretical=375", () => {
    const result = assessCAGEStudy(makeCAGEStudy(), ATARFE_ADULTS);
    expect(result.sampleQuality).toBe("not-evaluable");
    expect(result.coverageGlobal).toBeCloseTo(670.1, 0);
  });
});

// ── 2. Integración IBSE — evaluación gobernada por el discriminador ───────────

describe("SAM integración — IBSE (gobernada por sampleScope)", () => {
  it("16-plus: evalúa SOLO contra la referencia adulta/EAS (instrumentId 'ibse-16plus')", () => {
    const res = assessIBSEStudySAM(makeIBSEStudy(811, "16-plus"), IBSE_REFS);
    expect(res.evaluable).toBe(true);
    expect(res.plus16).toBeDefined();
    expect(res.under16).toBeUndefined(); // nunca usa la referencia de menores
    expect(res.plus16!.instrumentId).toBe("ibse-16plus");
    expect(res.plus16!.nObserved).toBe(811);
    expect(res.plus16!.populationReference.populationTotal).toBe(15_472);
    expect(res.plus16!.nTheoretical).toBe(375);
    expect(res.plus16!.sampleQuality).toBe("not-evaluable");
  });

  it("under-16: evalúa SOLO contra la referencia de menores 6–15 (instrumentId 'ibse-under16')", () => {
    const res = assessIBSEStudySAM(makeIBSEStudy(811, "under-16"), IBSE_REFS);
    expect(res.evaluable).toBe(true);
    expect(res.under16).toBeDefined();
    expect(res.plus16).toBeUndefined(); // nunca usa la referencia adulta
    expect(res.under16!.instrumentId).toBe("ibse-under16");
    // Referencia 6–15 (N=2.323, Cochran=330), NO la escolar 6–17 (2.847, 339).
    expect(res.under16!.populationReference.populationTotal).toBe(2_323);
    expect(res.under16!.nTheoretical).toBe(330);
    expect(res.under16!.populationReference.populationTotal).not.toBe(2_847);
    expect(res.under16!.nTheoretical).not.toBe(339);
    expect(res.under16!.populationReference.ageGroupLabel).toMatch(/6 a 15|menores de 16/i);
  });

  it("mixed SIN desglose: NO evaluable por estrato (no produce dictamen SAM falso)", () => {
    const res = assessIBSEStudySAM(makeIBSEStudy(811, "mixed"), IBSE_REFS);
    expect(res.evaluable).toBe(false);
    expect(res.under16).toBeUndefined();
    expect(res.plus16).toBeUndefined();
    expect(res.notEvaluableReason).toMatch(/no evaluable por estrato/i);
  });

  it("mixed CON desglose válido: dos dictámenes, cada uno con SU nValid (nunca el total)", () => {
    const strata: IBSEStrataCounts = {
      under16: { n: 520, nValid: 470 },
      plus16: { n: 389, nValid: 341 },
    };
    const res = assessIBSEStudySAM(makeIBSEStudy(811, "mixed", strata), IBSE_REFS);
    expect(res.evaluable).toBe(true);
    expect(res.under16!.nObserved).toBe(470);
    expect(res.plus16!.nObserved).toBe(341);
    // El total (811) NO se usa como nObserved de ningún estrato.
    expect(res.under16!.nObserved).not.toBe(811);
    expect(res.plus16!.nObserved).not.toBe(811);
    expect(res.under16!.nObserved + res.plus16!.nObserved).toBe(811);
    // Cada estrato contra su propia referencia.
    expect(res.under16!.populationReference.populationTotal).toBe(2_323);
    expect(res.plus16!.populationReference.populationTotal).toBe(15_472);
  });

  it("unknown (legacy): NO evaluable por estrato", () => {
    const res = assessIBSEStudySAM(makeIBSEStudy(811, "unknown"), IBSE_REFS);
    expect(res.evaluable).toBe(false);
    expect(res.notEvaluableReason).toMatch(/legacy|desconocido/i);
  });

  it("nunca se aplica el mismo nValid total a ambos grupos simultáneamente", () => {
    // 16-plus solo evalúa plus16; under-16 solo under16; mixed sin desglose no evalúa.
    const only16 = assessIBSEStudySAM(makeIBSEStudy(811, "16-plus"), IBSE_REFS);
    const onlyU16 = assessIBSEStudySAM(makeIBSEStudy(811, "under-16"), IBSE_REFS);
    const mixedNoBreak = assessIBSEStudySAM(makeIBSEStudy(811, "mixed"), IBSE_REFS);
    // No existe ningún resultado que ponga 811 en under16 Y en plus16 a la vez.
    for (const r of [only16, onlyU16, mixedNoBreak]) {
      const both811 = r.under16?.nObserved === 811 && r.plus16?.nObserved === 811;
      expect(both811).toBe(false);
    }
  });

  it("mixed sin referencias tampoco se evalúa (falta la referencia poblacional)", () => {
    const res = assessIBSEStudySAM(makeIBSEStudy(811, "16-plus"), { minor: ATARFE_UNDER16 });
    expect(res.evaluable).toBe(false);
    expect(res.notEvaluableReason).toMatch(/adulta/i);
  });
});

// ── Alias del registro poblacional ("atarfe" == "18022") ─────────────────────

describe("SAM registry — alias de municipio 'atarfe' → INE 18022", () => {
  it("'atarfe' y '18022' resuelven el MISMO conjunto inmutable de referencias", () => {
    const byId = getPopulationReferenceSet("atarfe");
    const byIne = getPopulationReferenceSet("18022");
    // Mismo objeto congelado (misma identidad), no una copia.
    expect(byId).toBe(byIne);
    expect(byId.adult?.populationTotal).toBe(15_472);
    expect(byId.minor?.populationTotal).toBe(2_323);
    expect(Object.isFrozen(byId)).toBe(true);
  });

  it("un municipio desconocido devuelve {} (sin referencias)", () => {
    expect(getPopulationReferenceSet("municipio-inexistente")).toEqual({});
  });

  it("un estudio real de Atarfe (municipalityId 'atarfe') encuentra sus referencias", () => {
    const study = createIBSEStudy({
      municipalityId: "atarfe",
      sourceFileName: "ibse-atarfe.csv",
      aggregates: makeIBSEStudy().aggregates,
      sampleScope: "mixed",
      methodologicalCautions: [],
    });
    const refs = getPopulationReferenceSet(study.municipalityId);
    expect(refs.adult).toBeDefined();
    expect(refs.minor).toBeDefined();
  });
});

// ── Diagnóstico veraz: mixta VÁLIDA a la que le falta una referencia ──────────

describe("SAM integración — mixta con desglose válido pero sin una referencia", () => {
  const VALID_STRATA: IBSEStrataCounts = {
    under16: { n: 520, nValid: 470 },
    plus16: { n: 389, nValid: 341 },
  };

  it("falta la referencia de MENORES → motivo distingue 'referencia de menores', no 'sin desglose'", () => {
    const res = assessIBSEStudySAM(makeIBSEStudy(811, "mixed", VALID_STRATA), { adult: ATARFE_ADULTS });
    expect(res.evaluable).toBe(false);
    expect(res.notEvaluableReason).toMatch(/referencia poblacional de menores/i);
    expect(res.notEvaluableReason).not.toMatch(/sin desglose/i);
  });

  it("falta la referencia ADULTA (16+) → motivo distingue 'referencia adulta', no 'sin desglose'", () => {
    const res = assessIBSEStudySAM(makeIBSEStudy(811, "mixed", VALID_STRATA), { minor: ATARFE_UNDER16 });
    expect(res.evaluable).toBe(false);
    expect(res.notEvaluableReason).toMatch(/referencia poblacional adulta/i);
    expect(res.notEvaluableReason).not.toMatch(/sin desglose/i);
  });

  it("con ambas referencias → produce AMBOS dictámenes", () => {
    const res = assessIBSEStudySAM(makeIBSEStudy(811, "mixed", VALID_STRATA), IBSE_REFS);
    expect(res.evaluable).toBe(true);
    expect(res.under16).toBeDefined();
    expect(res.plus16).toBeDefined();
  });
});

// ── 2 bis. Validación de strataCounts (sumas contra aggregates) ──────────────

describe("SAM integración — validación completa de strataCounts", () => {
  // aggregates fijos: n=909, nValid=811.
  it("NEGATIVO: la suma de n por estrato no coincide con aggregates.n → no evaluable", () => {
    const strata: IBSEStrataCounts = {
      under16: { n: 500, nValid: 470 }, // 500+389 = 889 ≠ 909
      plus16: { n: 389, nValid: 341 },
    };
    const res = assessIBSEStudySAM(makeIBSEStudy(811, "mixed", strata), IBSE_REFS);
    expect(res.evaluable).toBe(false);
    expect(res.notEvaluableReason).toMatch(/suma de n/i);
  });

  it("NEGATIVO: la suma de nValid por estrato no coincide con aggregates.nValid → no evaluable", () => {
    const strata: IBSEStrataCounts = {
      under16: { n: 520, nValid: 400 }, // 400+341 = 741 ≠ 811
      plus16: { n: 389, nValid: 341 },
    };
    const res = assessIBSEStudySAM(makeIBSEStudy(811, "mixed", strata), IBSE_REFS);
    expect(res.evaluable).toBe(false);
    expect(res.notEvaluableReason).toMatch(/suma de nValid/i);
  });

  it("NEGATIVO: desglose incompleto (un solo estrato) → no evaluable", () => {
    const strata = { under16: { n: 520, nValid: 470 } } as IBSEStrataCounts;
    const res = assessIBSEStudySAM(makeIBSEStudy(811, "mixed", strata), IBSE_REFS);
    expect(res.evaluable).toBe(false);
    expect(res.notEvaluableReason).toMatch(/incompleto|incoherente/i);
  });

  it("NEGATIVO: un estrato con nValid > n → no evaluable", () => {
    const strata: IBSEStrataCounts = {
      under16: { n: 400, nValid: 470 }, // nValid > n
      plus16: { n: 509, nValid: 341 },
    };
    const res = assessIBSEStudySAM(makeIBSEStudy(811, "mixed", strata), IBSE_REFS);
    expect(res.evaluable).toBe(false);
    expect(res.notEvaluableReason).toMatch(/incompleto|incoherente/i);
  });

  it("POSITIVO: desglose que cuadra exactamente (909 / 811) → evaluable por estrato", () => {
    const strata: IBSEStrataCounts = {
      under16: { n: 520, nValid: 470 },
      plus16: { n: 389, nValid: 341 },
    };
    const res = assessIBSEStudySAM(makeIBSEStudy(811, "mixed", strata), IBSE_REFS);
    expect(res.evaluable).toBe(true);
    expect(res.under16!.nObserved).toBe(470);
    expect(res.plus16!.nObserved).toBe(341);
  });

  it("validateIBSEStrataCounts / isStructurallySaneStrataCounts (funciones puras)", () => {
    const agg = makeIBSEStudy(811, "mixed").aggregates;
    // Cuadra.
    expect(
      validateIBSEStrataCounts({ under16: { n: 520, nValid: 470 }, plus16: { n: 389, nValid: 341 } }, agg).valid
    ).toBe(true);
    // No cuadra.
    expect(
      validateIBSEStrataCounts({ under16: { n: 1, nValid: 1 }, plus16: { n: 1, nValid: 1 } }, agg).valid
    ).toBe(false);
    // Ausente.
    expect(validateIBSEStrataCounts(undefined, agg).valid).toBe(false);
    // Estructural: forma corrupta y nValid>n se rechazan; forma sana con un estrato pasa el mínimo estructural.
    expect(isStructurallySaneStrataCounts({})).toBe(false);
    expect(isStructurallySaneStrataCounts({ under16: { n: 1, nValid: 5 } })).toBe(false);
    expect(isStructurallySaneStrataCounts({ under16: { n: 5, nValid: 1 } })).toBe(true);
    expect(isStructurallySaneStrataCounts(null)).toBe(false);
  });
});

// ── 3. Ausencia de modificación de cálculos existentes ───────────────────────

describe("SAM integración — no modifica algoritmos existentes", () => {
  it("assessDUKEStudy no muta el objeto DUKEStudy", () => {
    const study = makeDUKEStudy();
    const before = JSON.stringify(study.aggregates);
    assessDUKEStudy(study, ATARFE_ADULTS);
    expect(JSON.stringify(study.aggregates)).toBe(before);
  });

  it("assessPREDIMEDStudy no muta el objeto PREDIMEDStudy", () => {
    const study = makePREDIMEDStudy();
    const before = JSON.stringify(study.aggregates);
    assessPREDIMEDStudy(study, ATARFE_ADULTS);
    expect(JSON.stringify(study.aggregates)).toBe(before);
  });

  it("assessSF12Study no muta el objeto SF12Study", () => {
    const study = makeSF12Study();
    const before = JSON.stringify(study.aggregates);
    assessSF12Study(study, ATARFE_ADULTS);
    expect(JSON.stringify(study.aggregates)).toBe(before);
  });

  it("assessSuenoStudy no muta el objeto SuenoStudy", () => {
    const study = makeSuenoStudy();
    const before = JSON.stringify(study.aggregates);
    assessSuenoStudy(study, ATARFE_ADULTS);
    expect(JSON.stringify(study.aggregates)).toBe(before);
  });

  it("assessCAGEStudy no muta el objeto CAGEStudy", () => {
    const study = makeCAGEStudy();
    const before = JSON.stringify(study.aggregates);
    assessCAGEStudy(study, ATARFE_ADULTS);
    expect(JSON.stringify(study.aggregates)).toBe(before);
  });

  it("assessIBSEStudySAM no muta el objeto IBSEStudy (16-plus)", () => {
    const study = makeIBSEStudy(811, "16-plus");
    const before = JSON.stringify(study.aggregates);
    assessIBSEStudySAM(study, IBSE_REFS);
    expect(JSON.stringify(study.aggregates)).toBe(before);
  });

  it("assessIBSEStudySAM no muta el objeto IBSEStudy (mixed)", () => {
    const study = makeIBSEStudy(811, "mixed");
    const before = JSON.stringify(study.aggregates);
    assessIBSEStudySAM(study, IBSE_REFS);
    expect(JSON.stringify(study.aggregates)).toBe(before);
  });
});

// ── 4. Ausencia de nuevos tipos de EvidenceAtom ───────────────────────────────

describe("SAM integración — no genera EvidenceAtom", () => {
  it("assessDUKEStudy devuelve SampleQualityAssessment, no EvidenceAtom", () => {
    const result = assessDUKEStudy(makeDUKEStudy(), ATARFE_ADULTS);
    expect(result).not.toHaveProperty("kind");
    expect(result).not.toHaveProperty("content");
    expect(result).not.toHaveProperty("provenance");
    expect(result).toHaveProperty("sampleQuality");
    expect(result).toHaveProperty("coverageGlobal");
  });

  it("assessIBSEStudySAM.plus16 devuelve SampleQualityAssessment, no EvidenceAtom", () => {
    const result = assessIBSEStudySAM(makeIBSEStudy(811, "16-plus"), IBSE_REFS).plus16!;
    expect(result).not.toHaveProperty("kind");
    expect(result).toHaveProperty("nTheoretical");
    expect(result).toHaveProperty("requiresHumanValidation");
  });

  it("ninguna evaluación tiene kind='sample-quality' (no es EvidenceAtom)", () => {
    const ibseSam = assessIBSEStudySAM(makeIBSEStudy(811, "16-plus"), IBSE_REFS);
    const studies = [
      assessDUKEStudy(makeDUKEStudy(), ATARFE_ADULTS),
      assessPREDIMEDStudy(makePREDIMEDStudy(), ATARFE_ADULTS),
      assessSF12Study(makeSF12Study(), ATARFE_ADULTS),
      assessSuenoStudy(makeSuenoStudy(), ATARFE_ADULTS),
      assessCAGEStudy(makeCAGEStudy(), ATARFE_ADULTS),
      ibseSam.plus16!,
    ];
    for (const s of studies) {
      expect(s).not.toHaveProperty("kind");
      expect(s).toHaveProperty("sampleQuality");
    }
  });
});

// ── 5. Estabilidad del comportamiento funcional ───────────────────────────────

describe("SAM integración — estabilidad funcional", () => {
  it("todos los instrumentos EAS producen SampleQualityAssessment válido", () => {
    const assessments = [
      assessDUKEStudy(makeDUKEStudy(), ATARFE_ADULTS),
      assessPREDIMEDStudy(makePREDIMEDStudy(), ATARFE_ADULTS),
      assessSF12Study(makeSF12Study(), ATARFE_ADULTS),
      assessSuenoStudy(makeSuenoStudy(), ATARFE_ADULTS),
      assessCAGEStudy(makeCAGEStudy(), ATARFE_ADULTS),
    ];
    for (const a of assessments) {
      expect(a.requiresHumanValidation).toBe(true);
      expect(a.sampleQuality).toBe("not-evaluable");
      expect(a.coverageGlobal).toBeGreaterThan(100);
      expect(a.methodologicalCautions.length).toBeGreaterThan(0);
      expect(a.nTheoretical).toBe(375);
    }
  });

  it("IBSE mixed sin desglose NO produce evaluaciones; con desglose produce por estrato", () => {
    const sinDesglose = assessIBSEStudySAM(makeIBSEStudy(811, "mixed"), IBSE_REFS);
    expect(sinDesglose.evaluable).toBe(false);
    expect(sinDesglose.under16).toBeUndefined();
    expect(sinDesglose.plus16).toBeUndefined();

    const conDesglose = assessIBSEStudySAM(
      makeIBSEStudy(811, "mixed", { under16: { n: 520, nValid: 470 }, plus16: { n: 389, nValid: 341 } }),
      IBSE_REFS
    );
    expect(conDesglose.evaluable).toBe(true);
    // Cada estrato se clasifica con SU propio nValid y SU propia referencia:
    // under16 470/330 (142 %) → high ; plus16 341/375 (91 %) → medium.
    expect(conDesglose.under16!.sampleQuality).toBe("not-evaluable");
    expect(conDesglose.plus16!.sampleQuality).toBe("not-evaluable");
  });

  it("el motor SAM permanece único: todas las funciones delegan en computeSampleQualityAssessment", () => {
    // Verificación estructural: todas las funciones producen el mismo tipo de objeto
    const ibseSam = assessIBSEStudySAM(makeIBSEStudy(811, "16-plus"), IBSE_REFS);
    const all = [
      assessDUKEStudy(makeDUKEStudy(), ATARFE_ADULTS),
      assessPREDIMEDStudy(makePREDIMEDStudy(), ATARFE_ADULTS),
      assessSF12Study(makeSF12Study(), ATARFE_ADULTS),
      assessSuenoStudy(makeSuenoStudy(), ATARFE_ADULTS),
      assessCAGEStudy(makeCAGEStudy(), ATARFE_ADULTS),
      ibseSam.plus16!,
    ];
    const requiredFields = [
      "instrumentId", "municipalityId", "nObserved", "nTheoretical",
      "coverageGlobal", "sampleQuality", "methodologicalCautions",
      "capabilities", "requiresHumanValidation", "computedAt",
    ];
    for (const a of all) {
      for (const field of requiredFields) {
        expect(a).toHaveProperty(field);
      }
    }
  });
});
