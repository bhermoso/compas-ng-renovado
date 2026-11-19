import { describe, expect, it } from "vitest";
import { canApplyProfilePreview, compareProfileUpdate, profileUpdateBaseline } from "../src/application/health-profile/profileUpdateDelta";
import type { ExternalHealthProfile } from "../src/domain/health-profile/ExternalHealthProfile";

const base = {
  id: "loja-base",
  title: "Loja · revisión 0.6.2",
  text: "C1. Texto original",
  summary: "Resumen original",
  findings: ["C1. Texto original"],
  areas: [{id:"R1",title:"Prevención",rationale:"Fundamento C1"}],
} as ExternalHealthProfile;

describe("Control de cambios del Actualizador", () => {
  it("expone íntegros los campos antes y después, en especial las recomendaciones", () => {
    const proposed = {
      ...base, id:"loja-revision", text:"C1. Texto actualizado",
      summary:"Resumen actualizado",
      findings:["C1. Texto actualizado"],
      areas:[{id:"R1",title:"Prevención comunitaria",rationale:"Fundamento C1 revisado"}],
    };
    const comparison = compareProfileUpdate(base,proposed);
    expect(comparison.summaryChanged).toBe(true);
    expect(comparison.findingsChanged).toBe(true);
    expect(comparison.areasChanged).toBe(true);
    expect(comparison.textChanged).toBe(true);
    expect(comparison.before.areas[0].title).toBe("Prevención");
    expect(comparison.after.areas[0].title).toBe("Prevención comunitaria");
    expect(base.areas[0].title).toBe("Prevención");
  });
  it("no simula diferencias si las recomendaciones no cambian", () => {
    const comparison=compareProfileUpdate(base,{...base,text:"Texto cambiado"});
    expect(comparison.areasChanged).toBe(false);
    expect(comparison.findingsChanged).toBe(false);
    expect(comparison.textChanged).toBe(true);
  });
  it("impide el guardado si cambia el Perfil entre vista previa y aplicación", () => {
    const expected=profileUpdateBaseline(base,[]);
    const actual=profileUpdateBaseline({...base,areas:[{...base.areas[0],title:"Cambio remoto"}]},[]);
    expect(canApplyProfilePreview(expected,actual)).toBe(false);
    expect(canApplyProfilePreview(expected,expected)).toBe(true);
    expect(canApplyProfilePreview(undefined,expected)).toBe(false);
  });
  it("también invalida la vista previa si cambia la descarga territorial", () => {
    const expected=profileUpdateBaseline(base,[{id:"s1",observations:[{value:1}]}]);
    const actual=profileUpdateBaseline(base,[{id:"s1",observations:[{value:2}]}]);
    expect(canApplyProfilePreview(expected,actual)).toBe(false);
  });
});
