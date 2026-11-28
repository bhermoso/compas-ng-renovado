import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { ACTION_PLAN_CATALOG } from "../src/domain/action-plan-catalog";
import { buildPlanDocument } from "../src/domain/action-plan-catalog/PlanDocument";
import { buildDefinitiveActionPlanProjection } from "../src/domain/action-plan-catalog/DefinitiveActionPlanProjection";
import type { PlanPreparationDraft } from "../src/domain/action-plan-catalog/PlanPreparationDraft";

const read = (p: string) => readFileSync(p, "utf8");

describe("Plan de Acción · mecánica (F1, 28/11/2026)", () => {
  it("«Abrir ficha» abre primero la sección «Líneas e indicadores»", () => {
    expect(read("src/App.tsx")).toContain('onOpenIndicatorFicha={(code) => { setPlanTab("lineas"); openIndicatorFicha(code); }}');
    expect(read("src/ui/components/openIndicatorFicha.ts")).toContain("requestAnimationFrame");
  });

  it("los paneles hermanos del Plan resultante no comparten clave", () => {
    const preview = read("src/ui/components/DefinitiveActionPlanPreview.tsx");
    expect(preview).toContain("key={`documento-${municipalityId}`}");
    expect(preview).toContain("key={`perfil-${municipalityId}`}");
  });

  it("no hay botón «Guardar redacción»: la redacción se guarda al escribir", () => {
    const panel = read("src/ui/components/PlanPreparationPanel.tsx");
    expect(panel).not.toContain("Guardar redacción");
    expect(panel).not.toContain("Guardado en el expediente local");
  });

  it("sin bloques con nombre, el documento no inventa «Bloque temático · código»", () => {
    const module = ACTION_PLAN_CATALOG.find((m) => m.generalObjectives.every((g) => !g.thematicBlockName))!;
    expect(module).toBeDefined();
    const draft: PlanPreparationDraft = { municipalityId: "m", moduleId: module.id, version: module.version, updatedAt: "2026-11-28", decisions: {} };
    draft.decisions[module.id] = { status: "included", sourceText: module.strategicObjective };
    for (const g of module.generalObjectives) {
      draft.decisions[g.code] = { status: "included", sourceText: g.title };
      for (const s of g.specificObjectives) {
        draft.decisions[s.code] = { status: "included", sourceText: s.title };
        draft.decisions[s.indicator.code] = { status: "included", sourceText: s.indicator.title };
      }
    }
    const doc = buildPlanDocument("m", buildDefinitiveActionPlanProjection("m", [module], [draft]), "2026-11-28");
    expect(doc.paragraphs.some((p) => p.text.startsWith("Bloque temático"))).toBe(false);
    const first = module.generalObjectives[0];
    expect(doc.paragraphs.find((p) => p.text.startsWith(`Objetivo general · ${first.displayCode ?? first.code}`))?.heading).toBe(true);
  });
});
