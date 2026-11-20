import { describe, expect, it } from "vitest";
import { EMOTIONAL_WELLBEING_MODULE } from "../src/domain/action-plan-catalog/ActionPlanCatalog";
import { BEM_LEGACY_ALIGNMENT, BEM_OFFICIAL_OBJECTIVES, BEM_OFFICIAL_INDICATORS } from "../src/domain/action-plan-catalog/OfficialMentalHealthReferences";

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
});
