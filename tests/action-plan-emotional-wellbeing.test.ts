import { describe, expect, it } from "vitest";
import { ACTION_PLAN_CATALOG, EMOTIONAL_WELLBEING_MODULE } from "../src/domain/action-plan-catalog/ActionPlanCatalog";
import { municipalActionPlanModule } from "../src/domain/action-plan-catalog/MunicipalActionPlanModule";

const m = EMOTIONAL_WELLBEING_MODULE;
const specific = m.generalObjectives.flatMap((g) => g.specificObjectives);

describe("Línea «Bienestar emocional y salud mental» (versión 0.1)", () => {
  it("forma parte del catálogo con identificador estable", () => {
    expect(ACTION_PLAN_CATALOG.map((x) => x.id)).toContain("bem-2027-2030");
    expect(m.version).toBe("0.1");
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
});
