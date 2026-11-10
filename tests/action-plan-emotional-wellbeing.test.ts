import { describe, expect, it } from "vitest";
import { ACTION_PLAN_CATALOG, EMOTIONAL_WELLBEING_MODULE } from "../src/domain/action-plan-catalog/ActionPlanCatalog";
import { municipalActionPlanModule } from "../src/domain/action-plan-catalog/MunicipalActionPlanModule";

const m = EMOTIONAL_WELLBEING_MODULE;
const specific = m.generalObjectives.flatMap((g) => g.specificObjectives);

describe("Línea «Bienestar emocional y salud mental» (versión 0.2)", () => {
  it("forma parte del catálogo con identificador estable", () => {
    expect(ACTION_PLAN_CATALOG.map((x) => x.id)).toContain("bem-2027-2030");
    expect(m.version).toBe("0.2");
  });

  it("tiene 7 objetivos generales, 17 específicos y un indicador por cada uno, con códigos únicos", () => {
    expect(m.generalObjectives).toHaveLength(7);
    expect(specific).toHaveLength(17);
    const codes = [...m.generalObjectives.map((g) => g.code), ...specific.map((o) => o.code), ...specific.map((o) => o.indicator.code)];
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes.every((c) => c.startsWith("BEM-"))).toBe(true);
  });

  it("es una propuesta en construcción y no fija actuaciones", () => {
    expect(m.cautions[0]).toMatch(/en construcción/);
    expect(JSON.stringify(m)).not.toMatch(/responsable:|presupuesto de/i);
  });

  it("los indicadores del IBSE declaran escala común y límites de comparación", () => {
    const ibse = specific.map((o) => o.indicator).filter((i) => i.suggestedSource.includes("IBSE"));
    expect(ibse.length).toBeGreaterThanOrEqual(4);
    for (const i of ibse) {
      expect(i.operationalDefinition).not.toMatch(/^Pendiente/);
      expect(i.limitation).toMatch(/mismo procedimiento/);
    }
  });

  it("se ofrece igual a cualquier municipio, sin adaptación territorial previa", () => {
    for (const id of ["atarfe", "loja", "zagra", "municipio-nuevo-2027"]) {
      expect(municipalActionPlanModule(id, m)).toBe(m);
    }
  });

  it("cada objetivo e indicador declara su procedencia, con fuente y tipo", () => {
    expect(m.strategicObjectiveProvenance?.source).toBeTruthy();
    const elements = [
      ...m.generalObjectives.map((g) => g.provenance),
      ...specific.map((o) => o.provenance),
      ...specific.map((o) => o.indicator.provenance),
    ];
    expect(elements).toHaveLength(7 + 17 + 17);
    for (const p of elements) {
      expect(["literal", "adaptado", "propio"]).toContain(p?.kind);
      expect(p?.source.length).toBeGreaterThan(10);
    }
    // Solo dos elementos reproducen textos oficiales (EPVSA: indicadores 1.4.5 y 1.6.3).
    expect(elements.filter((p) => p?.kind === "literal")).toHaveLength(2);
    expect(m.sourceLabel).toMatch(/líneas 2, 3 y 8/);
  });

  it("los indicadores literales conservan la redacción de la EPVSA", () => {
    const byCode = new Map(specific.map((o) => [o.indicator.code, o.indicator.title]));
    expect(byCode.get("BEM-I2.2")).toMatch(/población adulta que percibe como bajo su apoyo social y afectivo/);
    expect(byCode.get("BEM-I3.3")).toMatch(/8 a 15 años que usa más de dos horas al día aparatos electrónicos\.$/);
  });
});

import { ADDICTIONS_MODULE, HEALTHY_AGING_MODULE } from "../src/domain/action-plan-catalog/ActionPlanCatalog";
import { SUPPORT_DOCUMENTS, getSupportDocument } from "../src/domain/strategy/SupportDocuments";

describe("Procedencia del catálogo y documentación de apoyo", () => {
  const all = (mod: typeof HEALTHY_AGING_MODULE) => [
    mod.strategicObjectiveProvenance,
    ...mod.generalObjectives.map((g) => g.provenance),
    ...mod.generalObjectives.flatMap((g) => g.specificObjectives.flatMap((o) => [o.provenance, o.indicator.provenance])),
  ];

  it("las tres líneas declaran procedencia en todos sus elementos", () => {
    expect(all(HEALTHY_AGING_MODULE)).toHaveLength(1 + 9 + 36);
    expect(all(ADDICTIONS_MODULE)).toHaveLength(1 + 6 + 24);
    for (const mod of [HEALTHY_AGING_MODULE, ADDICTIONS_MODULE, EMOTIONAL_WELLBEING_MODULE]) {
      for (const p of all(mod)) {
        expect(["literal", "adaptado", "propio"]).toContain(p?.kind);
        expect(p?.source.length).toBeGreaterThan(10);
      }
    }
  });

  it("envejecimiento y adicciones conservan su versión; el Plan Local del Zaidín figura en la línea, no en cada elemento", () => {
    expect(HEALTHY_AGING_MODULE.version).toBe("3.1");
    expect(ADDICTIONS_MODULE.version).toBe("3.1");
    expect(HEALTHY_AGING_MODULE.sourceLabel).toMatch(/Zaidín/);
    expect(ADDICTIONS_MODULE.sourceLabel).toMatch(/Zaidín/);
    expect(JSON.stringify([...all(HEALTHY_AGING_MODULE), ...all(ADDICTIONS_MODULE)])).not.toMatch(/Zaidín/);
  });

  it("cada documento citado existe en el repositorio común, y los adaptados citan al menos uno", () => {
    for (const mod of [HEALTHY_AGING_MODULE, ADDICTIONS_MODULE, EMOTIONAL_WELLBEING_MODULE]) {
      for (const p of all(mod)) {
        for (const id of p?.documents ?? []) expect(getSupportDocument(id)).toBeDefined();
        if (p?.kind !== "propio") expect((p?.documents ?? []).length).toBeGreaterThan(0);
      }
    }
    expect(SUPPORT_DOCUMENTS.filter((d) => d.location.kind === "compas").map((d) => d.id).sort()).toEqual(["epvsa", "esca", "mayores"]);
  });
});
