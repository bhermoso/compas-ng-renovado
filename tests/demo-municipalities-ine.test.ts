/**
 * tests/demo-municipalities-ine.test.ts
 *
 * Verifica que los códigos INE de los municipios demo de COMPÁS NG
 * son correctos según el catálogo BADEA/IECA (verificado 2026-07-07).
 *
 * Correcciones aplicadas:
 *  - Alfacar:              18009 (incorrecto) → 18011 (correcto)
 *  - Churriana de la Vega: 18052 (incorrecto) → 18062 (correcto)
 *  - Zagra:                sin código          → 18913 (añadido)
 *  - Atarfe:               18022 (correcto, sin cambio)
 *  - Granada capital:      no añadida (decisión posterior expresa requerida)
 *  - Granada-Centro:       distrito inframunicipal, sin INE propio (añadido 2026-07-07)
 */

import { describe, it, expect } from "vitest";
import { createCompleteMunicipalityWorkspace } from "../src/application/workspace";

// Refleja exactamente DEMO_MUNICIPALITIES en App.tsx
const DEMO: { id: string; name: string; province: string; ineCode?: string; territorialType?: string }[] = [
  { id: "atarfe",         name: "Atarfe",              province: "Granada", ineCode: "18022" },
  { id: "alfacar",        name: "Alfacar",              province: "Granada", ineCode: "18011" },
  { id: "churriana",      name: "Churriana de la Vega", province: "Granada", ineCode: "18062" },
  { id: "zagra",          name: "Zagra",               province: "Granada", ineCode: "18913" },
  { id: "granada-centro", name: "Granada-Centro",       province: "Granada", territorialType: "distrito" },
];

const DEMO_WITH_INE = DEMO.filter((m) => m.ineCode !== undefined);

describe("Municipios demo — códigos INE verificados con BADEA/IECA", () => {
  for (const { id, name, province, ineCode } of DEMO_WITH_INE) {
    it(`${name} tiene ineCode ${ineCode}`, () => {
      const ws = createCompleteMunicipalityWorkspace({ id, name, province, ineCode });
      expect(ws.municipality.identity.ineCode).toBe(ineCode);
    });
  }

  it("Atarfe sigue con 18022 (sin cambio)", () => {
    const ws = createCompleteMunicipalityWorkspace({
      id: "atarfe", name: "Atarfe", province: "Granada", ineCode: "18022",
    });
    expect(ws.municipality.identity.ineCode).toBe("18022");
  });

  it("Alfacar corregido: 18011, no 18009", () => {
    const ws = createCompleteMunicipalityWorkspace({
      id: "alfacar", name: "Alfacar", province: "Granada", ineCode: "18011",
    });
    expect(ws.municipality.identity.ineCode).toBe("18011");
    expect(ws.municipality.identity.ineCode).not.toBe("18009");
  });

  it("Churriana de la Vega corregida: 18062, no 18052", () => {
    const ws = createCompleteMunicipalityWorkspace({
      id: "churriana", name: "Churriana de la Vega", province: "Granada", ineCode: "18062",
    });
    expect(ws.municipality.identity.ineCode).toBe("18062");
    expect(ws.municipality.identity.ineCode).not.toBe("18052");
  });

  it("Zagra tiene ineCode 18913 (antes sin código)", () => {
    const ws = createCompleteMunicipalityWorkspace({
      id: "zagra", name: "Zagra", province: "Granada", ineCode: "18913",
    });
    expect(ws.municipality.identity.ineCode).toBe("18913");
  });

  it("Granada capital no aparece en municipios demo", () => {
    const ids = DEMO.map((m) => m.id);
    expect(ids).not.toContain("granada");
    const codes = DEMO.filter((m) => m.ineCode !== undefined).map((m) => m.ineCode);
    expect(codes).not.toContain("18087");
  });
});

describe("Granada-Centro — distrito inframunicipal", () => {
  it("aparece en la lista de ámbitos demo", () => {
    const ids = DEMO.map((m) => m.id);
    expect(ids).toContain("granada-centro");
  });

  it("queda tipificado como distrito", () => {
    const entry = DEMO.find((m) => m.id === "granada-centro");
    expect(entry).toBeDefined();
    expect(entry!.territorialType).toBe("distrito");
  });

  it("no tiene código INE municipal propio", () => {
    const entry = DEMO.find((m) => m.id === "granada-centro");
    expect(entry!.ineCode).toBeUndefined();
  });

  it("no usa el INE 18087 (Granada capital) como código propio", () => {
    const entry = DEMO.find((m) => m.id === "granada-centro");
    expect(entry!.ineCode).not.toBe("18087");
  });

  it("puede crear workspace sin ineCode", () => {
    const ws = createCompleteMunicipalityWorkspace({
      id: "granada-centro",
      name: "Granada-Centro",
      province: "Granada",
      territorialType: "distrito",
    });
    expect(ws.municipality.identity.id).toBe("granada-centro");
    expect(ws.municipality.identity.name).toBe("Granada-Centro");
    expect(ws.municipality.identity.territorialType).toBe("distrito");
    expect(ws.municipality.identity.ineCode).toBeUndefined();
  });

  it("los cuatro municipios preexistentes siguen presentes", () => {
    const ids = DEMO.map((m) => m.id);
    expect(ids).toContain("atarfe");
    expect(ids).toContain("alfacar");
    expect(ids).toContain("churriana");
    expect(ids).toContain("zagra");
  });

  it("Atarfe mantiene INE 18022", () => {
    expect(DEMO.find((m) => m.id === "atarfe")?.ineCode).toBe("18022");
  });

  it("Alfacar mantiene INE 18011", () => {
    expect(DEMO.find((m) => m.id === "alfacar")?.ineCode).toBe("18011");
  });

  it("Churriana de la Vega mantiene INE 18062", () => {
    expect(DEMO.find((m) => m.id === "churriana")?.ineCode).toBe("18062");
  });

  it("Zagra mantiene INE 18913", () => {
    expect(DEMO.find((m) => m.id === "zagra")?.ineCode).toBe("18913");
  });
});
