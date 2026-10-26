import { describe, expect, it } from "vitest";
import {
  computeSampleQualityAssessment,
  type ComputeSAMInput,
} from "../src/application/sam";
import { DEFAULT_COCHRAN_PARAMS } from "../src/domain/sam";
import type { PopulationReference } from "../src/domain/sam";

// ── Fixture: Atarfe ≥16 años (Padrón INE 2022) ───────────────────────────────
// Derivado de "Atarfe población 2022.xlsx" en la raíz del proyecto.
// Suma verificada: 15.472 personas ≥16 años (grupos 16–19, 20–29, …, 90+).
// Ver fixtures/population/atarfe-population-2022.ts para detalle completo.
const ATARFE_POP: PopulationReference = {
  municipalityId: "18022",
  municipalityCode: "18022",
  source: "Padrón Municipal de Habitantes — INE, 1 de enero de 2022",
  year: 2022,
  populationTotal: 15_472,
  ageGroupLabel: "16 años y más",
  extractedAt: "2026-06-29",
};

// Fixture sintético para pruebas de FPC con población pequeña (N=500)
const SYNTHETIC_POP_500: PopulationReference = {
  municipalityId: "municipio-sintetico",
  municipalityCode: "00000",
  source: "Fixture sintético — solo para tests",
  year: 2024,
  populationTotal: 500,
  ageGroupLabel: "16 años y más",
  extractedAt: "2026-06-29",
};

function makeInput(
  overrides: Partial<ComputeSAMInput> = {}
): ComputeSAMInput {
  return {
    instrumentId: "duke-eas",
    municipalityId: "18022",
    nObserved: 811,
    populationReference: ATARFE_POP,
    ...overrides,
  };
}

// ── 1. Cochran con corrección de población finita ─────────────────────────────

describe("SAM — Cochran con FPC", () => {
  it("calcula nTheoreticalRaw correcto para parámetros estándar (≈384.16)", () => {
    const result = computeSampleQualityAssessment(makeInput({ nObserved: 1 }));
    // n0 = (1.96² × 0.5 × 0.5) / 0.05² = 384.16
    expect(result.nTheoreticalRaw).toBeCloseTo(384.16, 1);
  });

  it("aplica FPC correctamente para Atarfe N=15.472 → nTheoretical=375", () => {
    const result = computeSampleQualityAssessment(makeInput({ nObserved: 1 }));
    // ceil(384.16 / (1 + 383.16/15472)) = ceil(374.88) = 375
    expect(result.nTheoretical).toBe(375);
  });

  it("aplica FPC correctamente para población pequeña N=500 → nTheoretical=218", () => {
    const result = computeSampleQualityAssessment(
      makeInput({ nObserved: 1, populationReference: SYNTHETIC_POP_500 })
    );
    // ceil(384.16 / (1 + 383.16/500)) = ceil(217.5) = 218
    expect(result.nTheoretical).toBe(218);
  });

  it("acepta parámetros Cochran personalizados (confianza 99 %)", () => {
    const result = computeSampleQualityAssessment(
      makeInput({ cochranParams: { confidence: 0.99, marginOfError: 0.05 } })
    );
    // n0 = (2.576² × 0.5 × 0.5) / 0.05² = 663.49...
    expect(result.nTheoreticalRaw).toBeGreaterThan(600);
    expect(result.cochranParams.confidence).toBe(0.99);
  });

  it("lanza error para nivel de confianza no soportado", () => {
    expect(() =>
      computeSampleQualityAssessment(
        makeInput({ cochranParams: { confidence: 0.85 } })
      )
    ).toThrow("0.85");
  });

  it("retiene los parámetros Cochran usados en el resultado", () => {
    const result = computeSampleQualityAssessment(makeInput({ nObserved: 375 }));
    expect(result.cochranParams).toEqual(DEFAULT_COCHRAN_PARAMS);
  });
});

// ── 2. Clasificación de calidad muestral ─────────────────────────────────────

describe("SAM — Clasificación de calidad muestral", () => {
  it("calidad ALTA: muestra observada ≥ 100 % teórica (IBSE Atarfe, n=811)", () => {
    // coverage = 811/375 = 216.3%
    const result = computeSampleQualityAssessment(makeInput({ nObserved: 811 }));
    expect(result.sampleQuality).toBe("high");
    expect(result.coverageGlobal).toBeCloseTo(216.27, 1);
  });

  it("calidad ALTA: exactamente en el umbral 100 % (n=375)", () => {
    // coverage = 375/375 = 100.00%
    const result = computeSampleQualityAssessment(makeInput({ nObserved: 375 }));
    expect(result.sampleQuality).toBe("high");
    expect(result.coverageGlobal).toBeCloseTo(100.0, 1);
  });

  it("calidad MEDIA: inmediatamente por debajo del umbral 100 % (n=374)", () => {
    // coverage = 374/375 = 99.7%
    const result = computeSampleQualityAssessment(makeInput({ nObserved: 374 }));
    expect(result.sampleQuality).toBe("medium");
    expect(result.coverageGlobal).toBeCloseTo(99.73, 1);
  });

  it("calidad MEDIA: exactamente en el umbral 60 % (n=225)", () => {
    // coverage = 225/375 = 60.00%
    const result = computeSampleQualityAssessment(makeInput({ nObserved: 225 }));
    expect(result.sampleQuality).toBe("medium");
    expect(result.coverageGlobal).toBeCloseTo(60.0, 1);
  });

  it("calidad BAJA: inmediatamente por debajo del umbral 60 % (n=224)", () => {
    // coverage = 224/375 = 59.7%
    const result = computeSampleQualityAssessment(makeInput({ nObserved: 224 }));
    expect(result.sampleQuality).toBe("low");
    expect(result.coverageGlobal).toBeCloseTo(59.73, 1);
  });

  it("calidad BAJA: muestra muy reducida (n=100)", () => {
    // coverage = 100/375 = 26.7%
    const result = computeSampleQualityAssessment(makeInput({ nObserved: 100 }));
    expect(result.sampleQuality).toBe("low");
    expect(result.coverageGlobal).toBeCloseTo(26.67, 1);
  });

  it("calidad correcta con población pequeña (N=500): LOW para n=130", () => {
    // nTheoretical=218, coverage = 130/218 = 59.6%
    const result = computeSampleQualityAssessment(
      makeInput({ nObserved: 130, populationReference: SYNTHETIC_POP_500 })
    );
    expect(result.sampleQuality).toBe("low");
    expect(result.nTheoretical).toBe(218);
  });

  it("calidad correcta con población pequeña (N=500): MEDIUM para n=131", () => {
    // nTheoretical=218, coverage = 131/218 = 60.1%
    const result = computeSampleQualityAssessment(
      makeInput({ nObserved: 131, populationReference: SYNTHETIC_POP_500 })
    );
    expect(result.sampleQuality).toBe("medium");
  });
});

// ── 3. No modificación de evidencia ──────────────────────────────────────────

describe("SAM — Ausencia de modificación de evidencia", () => {
  it("la función no muta el objeto de entrada", () => {
    const input = makeInput({ nObserved: 300 });
    const inputCopy = JSON.parse(JSON.stringify(input)) as ComputeSAMInput;
    computeSampleQualityAssessment(input);
    expect(input).toEqual(inputCopy);
  });

  it("la función no muta el objeto PopulationReference", () => {
    const pop = { ...ATARFE_POP };
    const popCopy = { ...pop };
    computeSampleQualityAssessment(makeInput({ populationReference: pop }));
    expect(pop).toEqual(popCopy);
  });

  it("el resultado preserva el nObserved original sin modificarlo", () => {
    const result = computeSampleQualityAssessment(makeInput({ nObserved: 300 }));
    expect(result.nObserved).toBe(300);
  });

  it("el resultado preserva la referencia poblacional sin modificarla", () => {
    const result = computeSampleQualityAssessment(makeInput({ nObserved: 300 }));
    expect(result.populationReference).toEqual(ATARFE_POP);
  });

  it("llamadas sucesivas producen resultados independientes (sin estado compartido)", () => {
    const r1 = computeSampleQualityAssessment(makeInput({ nObserved: 200 }));
    const r2 = computeSampleQualityAssessment(makeInput({ nObserved: 400 }));
    expect(r1.sampleQuality).toBe("low");
    expect(r2.sampleQuality).toBe("high");
    expect(r1.nObserved).toBe(200);
    expect(r2.nObserved).toBe(400);
  });
});

// ── 4. Cautelas metodológicas ─────────────────────────────────────────────────

describe("SAM — Cautelas metodológicas", () => {
  it("calidad ALTA: al menos 2 cautelas estándar, sin cautela de insuficiencia", () => {
    const result = computeSampleQualityAssessment(makeInput({ nObserved: 811 }));
    expect(result.methodologicalCautions.length).toBeGreaterThanOrEqual(2);
    expect(
      result.methodologicalCautions.some((c) => c.includes("insuficiente"))
    ).toBe(false);
    expect(
      result.methodologicalCautions.some((c) => c.includes("No modifica"))
    ).toBe(true);
  });

  it("calidad MEDIA: incluye cautela de cobertura parcial", () => {
    const result = computeSampleQualityAssessment(makeInput({ nObserved: 250 }));
    expect(
      result.methodologicalCautions.some((c) => c.includes("parcial"))
    ).toBe(true);
  });

  it("calidad BAJA: incluye cautela de muestra insuficiente", () => {
    const result = computeSampleQualityAssessment(makeInput({ nObserved: 100 }));
    expect(
      result.methodologicalCautions.some((c) => c.includes("insuficiente"))
    ).toBe(true);
  });

  it("todas las calidades incluyen cautela sobre la fuente poblacional", () => {
    for (const nObserved of [100, 250, 811]) {
      const result = computeSampleQualityAssessment(makeInput({ nObserved }));
      expect(
        result.methodologicalCautions.some((c) =>
          c.includes("Fuente poblacional de referencia")
        )
      ).toBe(true);
    }
  });

  it("todas las calidades incluyen cautela de no modificación", () => {
    for (const nObserved of [100, 250, 811]) {
      const result = computeSampleQualityAssessment(makeInput({ nObserved }));
      expect(
        result.methodologicalCautions.some((c) =>
          c.includes("No modifica")
        )
      ).toBe(true);
    }
  });

  it("calidad ALTA con nObs=375 no incluye cautela de representatividad", () => {
    // coverage = 100 %: el texto no afirma representatividad por alcanzar el tamaño
    const result = computeSampleQualityAssessment(makeInput({ nObserved: 375 }));
    expect(
      result.methodologicalCautions.some((c) =>
        c.includes("representatividad estadística plena")
      )
    ).toBe(false);
  });
});

// ── 5. Invariantes del objeto resultado ──────────────────────────────────────

describe("SAM — Invariantes del SampleQualityAssessment", () => {
  it("requiresHumanValidation es siempre true", () => {
    for (const nObserved of [50, 225, 500]) {
      const result = computeSampleQualityAssessment(makeInput({ nObserved }));
      expect(result.requiresHumanValidation).toBe(true);
    }
  });

  it("computedAt es un timestamp ISO 8601 válido", () => {
    const result = computeSampleQualityAssessment(makeInput({ nObserved: 200 }));
    expect(() => new Date(result.computedAt).toISOString()).not.toThrow();
  });

  it("capabilities.canInferGlobalCoverage es true", () => {
    const result = computeSampleQualityAssessment(makeInput({ nObserved: 200 }));
    expect(result.capabilities.canInferGlobalCoverage).toBe(true);
  });

  it("capabilities.canClassifyQuality es true", () => {
    const result = computeSampleQualityAssessment(makeInput({ nObserved: 200 }));
    expect(result.capabilities.canClassifyQuality).toBe(true);
  });

  it("instrumentId y municipalityId se preservan del input", () => {
    const result = computeSampleQualityAssessment(
      makeInput({ instrumentId: "ibse", municipalityId: "test-123" })
    );
    expect(result.instrumentId).toBe("ibse");
    expect(result.municipalityId).toBe("test-123");
  });

  it("sampleQualityRationale contiene nObserved y nTheoretical", () => {
    const result = computeSampleQualityAssessment(makeInput({ nObserved: 200 }));
    expect(result.sampleQualityRationale).toContain("200");
    expect(result.sampleQualityRationale).toContain("375");
  });

  it("nTheoretical <= populationTotal (FPC siempre reduce n)", () => {
    for (const pop of [ATARFE_POP, SYNTHETIC_POP_500]) {
      const result = computeSampleQualityAssessment(
        makeInput({ nObserved: 1, populationReference: pop })
      );
      expect(result.nTheoretical).toBeLessThanOrEqual(pop.populationTotal);
    }
  });

  it("coverageGlobal es proporcional: nObserved / nTheoretical × 100", () => {
    const result = computeSampleQualityAssessment(makeInput({ nObserved: 300 }));
    const expected = (300 / result.nTheoretical) * 100;
    expect(result.coverageGlobal).toBeCloseTo(expected, 5);
  });
});
