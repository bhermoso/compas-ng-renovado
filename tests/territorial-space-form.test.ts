import { describe, it, expect } from "vitest";
import { GRANADA_MUNICIPALITIES } from "../src/domain/territory/granadaMunicipalities";
import {
  availableMunicipalities, buildSpace, districtsOf, groupSpaces, municipalityDisplayName, slugify, spaceAlreadyExists,
} from "../src/application/territory/territorialSpaceForm";

describe("catálogo de municipios de Granada (INE)", () => {
  it("tiene 174 códigos únicos de la provincia y sin diseminado", () => {
    expect(GRANADA_MUNICIPALITIES).toHaveLength(174);
    expect(new Set(GRANADA_MUNICIPALITIES.map((m) => m.ineCode)).size).toBe(174);
    expect(GRANADA_MUNICIPALITIES.every((m) => /^18\d{3}$/.test(m.ineCode))).toBe(true);
    expect(GRANADA_MUNICIPALITIES.some((m) => m.ineCode === "18999")).toBe(false);
  });
  it("los municipios con expediente cargado coinciden con el INE", () => {
    const by = (c: string) => GRANADA_MUNICIPALITIES.find((m) => m.ineCode === c)?.ineName;
    expect(by("18022")).toBe("Atarfe");
    expect(by("18079")).toBe("Fuente Vaqueros");
    expect(by("18913")).toBe("Zagra");
    expect(by("18087")).toBe("Granada");
  });
});

describe("alta de espacios sin escribir identificadores", () => {
  it("normaliza el artículo del INE y genera el identificador", () => {
    expect(municipalityDisplayName("Zubia, La")).toBe("La Zubia");
    expect(buildSpace({ kind: "municipio", ineCode: "18193" })).toEqual({ id: "la-zubia", name: "La Zubia", type: "municipio" });
    expect(buildSpace({ kind: "municipio", ineCode: "18079" })?.id).toBe("fuente-vaqueros");
  });
  it("el distrito conserva la convención existente «Municipio · Distrito»", () => {
    expect(buildSpace({ kind: "distrito-municipal", ineCode: "18087", districtName: "Zaidín" }))
      .toEqual({ id: "granada-zaidin", name: "Granada · Zaidín", type: "distrito-municipal" });
    expect(buildSpace({ kind: "distrito-municipal", ineCode: "18087", districtName: "  " })).toBeUndefined();
  });
  it("rechaza código fuera del catálogo y mancomunidad sin nombre", () => {
    expect(buildSpace({ kind: "municipio", ineCode: "99999" })).toBeUndefined();
    expect(buildSpace({ kind: "mancomunidad", name: " " })).toBeUndefined();
    expect(slugify("Mancomunidad Río Monachil")).toBe("mancomunidad-rio-monachil");
  });
});

describe("desplegables que se actualizan con cada alta", () => {
  const base = [
    { id: "atarfe", name: "Atarfe", type: "municipio" as const },
    { id: "granada-zaidin", name: "Granada · Zaidín", type: "distrito-municipal" as const },
  ];
  it("un municipio con espacio deja de ofrecerse y reaparece al faltar", () => {
    expect(availableMunicipalities([]).length).toBe(174);
    const after = availableMunicipalities(base);
    expect(after.length).toBe(173);
    expect(after.some((m) => m.ineCode === "18022")).toBe(false);
    const next = [...base, buildSpace({ kind: "municipio", ineCode: "18079" })!];
    expect(availableMunicipalities(next).length).toBe(172);
  });
  it("detecta duplicados por nombre aunque el id difiera", () => {
    expect(spaceAlreadyExists([{ id: "otro-id", name: "Atarfe", type: "municipio" }], buildSpace({ kind: "municipio", ineCode: "18022" })!)).toBe(true);
  });
  it("los distritos de un municipio y la agrupación salen de los espacios existentes", () => {
    expect(districtsOf(base, "18087").map((s) => s.id)).toEqual(["granada-zaidin"]);
    expect(districtsOf(base, "18022")).toEqual([]);
    expect(groupSpaces(base).map((g) => g.label)).toEqual(["Municipios", "Distritos municipales"]);
  });
});
