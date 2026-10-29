import { describe, expect, it } from "vitest";
import { samAssessmentToEvidenceAtom } from "../src/application/sam";
import { computeSampleQualityAssessment } from "../src/application/sam";
import type { PopulationReference } from "../src/domain/sam";

const POP: PopulationReference = {
  municipalityId: "18022",
  municipalityCode: "18022",
  source: "Padrón Municipal de Habitantes — INE, 1 de enero de 2022",
  year: 2022,
  populationTotal: 15_472,
  ageGroupLabel: "16 años y más",
  extractedAt: "2026-06-29",
};

function makeAssessment(nObserved: number, instrumentId = "duke-eas") {
  return computeSampleQualityAssessment({
    instrumentId,
    municipalityId: "18022",
    nObserved,
    populationReference: POP,
  });
}

// ── 1. Estructura del EvidenceAtom ───────────────────────────────────────────

describe("samAssessmentToEvidenceAtom — estructura canónica", () => {
  it("kind es 'sample-quality'", () => {
    const atom = samAssessmentToEvidenceAtom(makeAssessment(811));
    expect(atom.kind).toBe("sample-quality");
  });

  it("origin es 'sam'", () => {
    const atom = samAssessmentToEvidenceAtom(makeAssessment(811));
    expect(atom.provenance.origin).toBe("sam");
  });

  it("id es estable y determinista (sam:{municipalityId}:{instrumentId})", () => {
    const atom = samAssessmentToEvidenceAtom(makeAssessment(811, "duke-eas"));
    expect(atom.id).toBe("sam:18022:duke-eas");
  });

  it("municipalityId se preserva del assessment", () => {
    const atom = samAssessmentToEvidenceAtom(makeAssessment(811));
    expect(atom.municipalityId).toBe("18022");
  });

  it("title contiene el instrumentId", () => {
    const atom = samAssessmentToEvidenceAtom(makeAssessment(300, "sf12-eas"));
    expect(atom.title).toContain("sf12-eas");
    expect(atom.title).toContain("SAM");
  });

  it("requiresHumanValidation es true", () => {
    const atom = samAssessmentToEvidenceAtom(makeAssessment(811));
    expect(atom.methodology.requiresHumanValidation).toBe(true);
  });
});

// ── 2. Mapeo de confidence desde SampleQualityLevel ──────────────────────────

describe("samAssessmentToEvidenceAtom — mapeo confidence", () => {
  it("confianza no evaluable independientemente del tamaño (n=811, nTheoretical=375)", () => {
    // coverage = 811/375 = 216% → HIGH
    const atom = samAssessmentToEvidenceAtom(makeAssessment(811));
    expect(atom.confidence).toBe("not-evaluable");
  });

  it("confianza no evaluable independientemente del tamaño (n=250, coverage=66%)", () => {
    // coverage = 250/375 = 66.7% → MEDIUM
    const atom = samAssessmentToEvidenceAtom(makeAssessment(250));
    expect(atom.confidence).toBe("not-evaluable");
  });

  it("confianza no evaluable independientemente del tamaño (n=100, coverage=26%)", () => {
    // coverage = 100/375 = 26.7% → LOW
    const atom = samAssessmentToEvidenceAtom(makeAssessment(100));
    expect(atom.confidence).toBe("not-evaluable");
  });
});

// ── 3. Contenido del atom ─────────────────────────────────────────────────────

describe("samAssessmentToEvidenceAtom — contenido", () => {
  it("content es exactamente el sampleQualityRationale del assessment", () => {
    const assessment = makeAssessment(811);
    const atom = samAssessmentToEvidenceAtom(assessment);
    expect(atom.content).toContain(assessment.sampleQualityRationale);
    expect(atom.content).toContain("Cobertura poblacional: No evaluable");
  });

  it("methodology.limitations son las cautelas metodológicas del assessment", () => {
    const assessment = makeAssessment(100);
    const atom = samAssessmentToEvidenceAtom(assessment);
    expect(atom.methodology.limitations).toEqual(assessment.methodologicalCautions);
  });

  it("methodology.description contiene referencia al instrumento y parámetros Cochran", () => {
    const assessment = makeAssessment(811);
    const atom = samAssessmentToEvidenceAtom(assessment);
    expect(atom.methodology.description).toContain("Cochran");
    expect(atom.methodology.description).toContain("95");
    expect(atom.methodology.description).toContain(`${assessment.nTheoretical}`);
  });

  it("provenance.sourceLabel es el instrumentId", () => {
    const atom = samAssessmentToEvidenceAtom(makeAssessment(811, "predimed-eas"));
    expect(atom.provenance.sourceLabel).toBe("predimed-eas");
  });

  it("tags incluyen 'sam', 'sample-quality' y el instrumentId", () => {
    const atom = samAssessmentToEvidenceAtom(makeAssessment(811, "cage-eas"));
    expect(atom.tags).toContain("sam");
    expect(atom.tags).toContain("sample-quality");
    expect(atom.tags).toContain("cage-eas");
  });
});

// ── 4. Trazabilidad ───────────────────────────────────────────────────────────

describe("samAssessmentToEvidenceAtom — trazabilidad", () => {
  it("IDs distintos para instrumentos distintos del mismo municipio", () => {
    const atomDuke = samAssessmentToEvidenceAtom(makeAssessment(3028, "duke-eas"));
    const atomCage = samAssessmentToEvidenceAtom(makeAssessment(2513, "cage-eas"));
    expect(atomDuke.id).not.toBe(atomCage.id);
  });

  it("IDs distintos para el mismo instrumento en municipios distintos", () => {
    const assessment1 = computeSampleQualityAssessment({
      instrumentId: "duke-eas",
      municipalityId: "18022",
      nObserved: 3028,
      populationReference: POP,
    });
    const assessment2 = computeSampleQualityAssessment({
      instrumentId: "duke-eas",
      municipalityId: "99999",
      nObserved: 3028,
      populationReference: { ...POP, municipalityId: "99999" },
    });
    const atom1 = samAssessmentToEvidenceAtom(assessment1);
    const atom2 = samAssessmentToEvidenceAtom(assessment2);
    expect(atom1.id).not.toBe(atom2.id);
  });

  it("atom tiene timestamps válidos (createdAt, updatedAt)", () => {
    const atom = samAssessmentToEvidenceAtom(makeAssessment(811));
    expect(() => new Date(atom.createdAt).toISOString()).not.toThrow();
    expect(() => new Date(atom.updatedAt).toISOString()).not.toThrow();
  });
});

// ── 5. No modificación del assessment ────────────────────────────────────────

describe("samAssessmentToEvidenceAtom — no muta el assessment", () => {
  it("el assessment permanece inalterado tras la conversión", () => {
    const assessment = makeAssessment(811);
    const before = JSON.stringify(assessment);
    samAssessmentToEvidenceAtom(assessment);
    expect(JSON.stringify(assessment)).toBe(before);
  });

  it("modificar el atom no afecta al assessment", () => {
    const assessment = makeAssessment(811);
    const atom = samAssessmentToEvidenceAtom(assessment);
    (atom as { kind: string }).kind = "indicator";
    expect(assessment.sampleQuality).toBe("not-evaluable");
  });

  it("llamadas sucesivas con el mismo assessment producen atoms equivalentes", () => {
    const assessment = makeAssessment(250);
    const atom1 = samAssessmentToEvidenceAtom(assessment);
    const atom2 = samAssessmentToEvidenceAtom(assessment);
    expect(atom1.id).toBe(atom2.id);
    expect(atom1.confidence).toBe(atom2.confidence);
    expect(atom1.content).toBe(atom2.content);
  });
});
