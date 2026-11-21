import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PlanningInstrumentCatalog } from "../src/ui/components/PlanningInstrumentCatalog";
import { ADDICTIONS_MODULE, EMOTIONAL_WELLBEING_MODULE, HEALTHY_AGING_MODULE } from "../src/domain/action-plan-catalog/ActionPlanCatalog";

// Cada línea del Plan solo ofrece los instrumentos preparados para sus objetivos:
// Bienestar emocional y Adicciones no heredan los ejes de Envejecimiento saludable.
describe("Instrumentos de recogida por línea del Plan de Acción", () => {
  const AGING_AXES = ["Edadismo", "Soledad no deseada", "Autonomía", "Participación"];
  for (const [module, code] of [[EMOTIONAL_WELLBEING_MODULE, "BEM-I1.1"], [ADDICTIONS_MODULE, "ADI-I1.1"]] as const) {
    it(`${module.title} no ofrece ejes ni notas de Envejecimiento`, () => {
      const html = renderToStaticMarkup(<PlanningInstrumentCatalog notationModule={module} indicatorCode={code} indicatorDisplayCode={code} />);
      for (const axis of AGING_AXES) expect(html).not.toContain(`<option>${axis}</option>`);
      expect(html).not.toContain("mediciones del Zaidín");
      expect(html).toContain("no tiene todavía instrumentos de recogida preparados");
      expect(html).toContain(module.title);
    });
  }
  it("Envejecimiento saludable conserva su catálogo y sus ejes", () => {
    const html = renderToStaticMarkup(<PlanningInstrumentCatalog notationModule={HEALTHY_AGING_MODULE} indicatorCode="ENV-I5.1" indicatorDisplayCode="ENV-I5.1" />);
    for (const axis of AGING_AXES) expect(html).toContain(`<option>${axis}</option>`);
    expect(html).toContain("CENVE");
  });
});
