import { describe, expect, it } from "vitest";
import { EMOTIONAL_WELLBEING_MODULE } from "../src/domain/action-plan-catalog/ActionPlanCatalog";
import { BEM_LEGACY_ALIGNMENT, BEM_OFFICIAL_OBJECTIVES, BEM_OFFICIAL_INDICATORS } from "../src/domain/action-plan-catalog/OfficialMentalHealthReferences";
import { BEM_OBJECTIVE_REVIEW, BEM_OFFICIAL_GROUPING, auditBemCandidateCompleteness } from "../src/domain/action-plan-catalog/BemOfficialRevisionCandidate";

describe("Auditoría normativa de Bienestar emocional", () => {
  const legacy = EMOTIONAL_WELLBEING_MODULE;
  it("conserva el catálogo municipal 0.2 mientras se consensúa una versión nueva", () => {
    expect(legacy.version).toBe("0.2");
    expect(legacy.generalObjectives).toHaveLength(7);
    expect(legacy.generalObjectives.flatMap(g => g.specificObjectives)).toHaveLength(17);
  });
  it("inventaría exactamente los 17 indicadores previos sin confundir correspondencia con literalidad", () => {
    const ids = legacy.generalObjectives.flatMap(g => g.specificObjectives.map(s => s.indicator.code)).sort();
    expect(Object.keys(BEM_LEGACY_ALIGNMENT).sort()).toEqual(ids);
    expect(Object.values(BEM_LEGACY_ALIGNMENT).every(a => a.alignment !== "objective-correspondence")).toBe(true);
  });
  it("cada relación oficial tiene una referencia trazable y ningún indicador reclama equivalencia municipal automática", () => {
    const objectiveIds = new Set(BEM_OFFICIAL_OBJECTIVES.map(o => o.id));
    const indicatorIds = new Set(BEM_OFFICIAL_INDICATORS.map(i => i.id));
    for (const o of BEM_OFFICIAL_OBJECTIVES) {
      expect(o.title.trim().length).toBeGreaterThan(15);
      expect(o.uri).toMatch(/^https:\/\//);
      expect(o.location).toBeTruthy();
    }
    for (const i of BEM_OFFICIAL_INDICATORS) {
      expect(objectiveIds.has(i.objectiveId)).toBe(true);
      expect(i.municipalComparability).toBe("requires-methodological-review");
      expect(i.source).toBeTruthy();
    }
    for (const item of Object.values(BEM_LEGACY_ALIGNMENT)) {
      if (item.officialObjectiveId) expect(objectiveIds.has(item.officialObjectiveId)).toBe(true);
      if (item.officialIndicatorId) expect(indicatorIds.has(item.officialIndicatorId)).toBe(true);
    }
  });
  it("distingue el valor autonómico del IBSE del monitor municipal mixto", () => {
    const ibse = BEM_OFFICIAL_INDICATORS.find(i => i.id === "PESMA-OE01-IBSE")!;
    expect(ibse.source).toContain("Andaluza");
    expect(ibse.population).toContain("> 16");
    expect(ibse.location).toContain("75,94");
    expect(BEM_LEGACY_ALIGNMENT["BEM-I1.1"].alignment).toBe("indicator-same-instrument-pending-comparability");
  });
  it("la propuesta 0.3 tiene correspondencia única de los 17 objetivos específicos sin activarse", () => {
    const expected = legacy.generalObjectives.flatMap(g => g.specificObjectives.map(s => s.code)).sort();
    expect(BEM_OBJECTIVE_REVIEW.map(s => s.legacySpecificCode).sort()).toEqual(expected);
    const audit = auditBemCandidateCompleteness();
    expect(audit).toMatchObject({
      version: "0.3-candidate",
      mappedSpecificObjectives: 17,
      mappedLegacyIndicators: 17,
      uniqueSpecificObjectives: true,
      knownOfficialReferences: true,
      activationAllowed: false,
    });
    expect(BEM_OFFICIAL_GROUPING).toHaveLength(6);
  });
  it("no confunde indicadores de actividad con los oficiales ni importa objetivos clínicos sin valoración", () => {
    const gea = BEM_OBJECTIVE_REVIEW.find(x => x.legacySpecificCode === "BEM-OE3.1")!;
    expect(gea.officialIndicatorId).toBe("PESMA-P01.02-GEA-GRUBEA");
    expect(gea.verification).toMatch(/no porcentaje/i);
    const community = BEM_OBJECTIVE_REVIEW.find(x => x.legacySpecificCode === "BEM-OE4.2")!;
    expect(community.verification).toContain("SSPA");
    const primary = BEM_OBJECTIVE_REVIEW.find(x => x.legacySpecificCode === "BEM-OE5.2")!;
    expect(primary.disposition).toBe("requiere-decision-institucional");
    expect(primary.officialObjectiveId).toBe("PESMA-OE05");
    expect(BEM_OBJECTIVE_REVIEW.find(x => x.legacySpecificCode === "BEM-OE7.1")!.officialObjectiveId).toBe("PESMA-OE10");
  });
});
