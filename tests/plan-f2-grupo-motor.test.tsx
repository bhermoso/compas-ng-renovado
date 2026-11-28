import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ADDICTIONS_MODULE, EMOTIONAL_WELLBEING_MODULE, HEALTHY_AGING_MODULE } from "../src/domain/action-plan-catalog/ActionPlanCatalog";
import { ActionPlanCatalogPanel } from "../src/ui/components/BrowserCanonicalActionPlanPanel";

const base = { municipalityId: "m", municipalityName: "Municipio", reviews: [], worksheets: [], drafts: [], onDraftChange: () => {}, onSave: () => [] as string[] };
const bem = [{ module: EMOTIONAL_WELLBEING_MODULE, sourceScenarioIds: ["propia-1"] }];

describe("Plan de Acción · las líneas siguen la decisión del Grupo Motor (F2, 28/11/2026)", () => {
  it("la línea adoptada va primero y es editable; las demás, solo consulta", () => {
    const html = renderToStaticMarkup(<ActionPlanCatalogPanel {...base} section="lineas" eligibleModules={bem}
      groupMotor={{ state: "current", decidedBy: "GM", decidedAt: "2026-11-26T12:00:00.000Z" }} />);
    const order = [EMOTIONAL_WELLBEING_MODULE.title, HEALTHY_AGING_MODULE.title, ADDICTIONS_MODULE.title].map((t) => html.indexOf(`<strong>${t}</strong>`));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect(order[0]).toBeLessThan(order[1]);
    expect(order[0]).toBeLessThan(order[2]);
    expect(html.match(/Adoptada por el Grupo Motor/g)).toHaveLength(1);
    expect(html.match(/Solo consulta/g)).toHaveLength(2);
    expect(html.match(/Incluir la línea completa en el Plan/g)).toHaveLength(1);
    expect(html).toContain("Líneas adoptadas por el Grupo Motor el 26/11/2026:</strong> Bienestar emocional y salud mental");
  });

  it("sin decisión vigente, todas las líneas quedan para consulta", () => {
    const none = renderToStaticMarkup(<ActionPlanCatalogPanel {...base} section="lineas" eligibleModules={[]} groupMotor={{ state: "none" }} />);
    expect(none).toContain("El Grupo Motor no ha registrado su decisión.");
    expect(none).not.toContain("Incluir la línea completa en el Plan");
    const stale = renderToStaticMarkup(<ActionPlanCatalogPanel {...base} section="lineas" eligibleModules={[]} groupMotor={{ state: "stale" }} />);
    expect(stale).toContain("no corresponde al Perfil vigente");
  });

  it("el Plan resultante no está «listo» con líneas adoptadas sin trabajar", () => {
    const html = renderToStaticMarkup(<ActionPlanCatalogPanel {...base} section="resultante" eligibleModules={bem}
      groupMotor={{ state: "current" }} />);
    expect(html).not.toContain("Listo para versión definitiva");
    expect(html).toContain("1 línea adoptada sin trabajar");
    expect(html).toContain("sin objetivos incorporados todavía: Bienestar emocional y salud mental");
  });

  it("sin líneas adoptadas, el Plan resultante lo dice", () => {
    const html = renderToStaticMarkup(<ActionPlanCatalogPanel {...base} section="resultante" eligibleModules={[]} groupMotor={{ state: "none" }} />);
    expect(html).toContain("Sin líneas adoptadas");
  });
});
