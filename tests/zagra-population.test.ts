import { describe, expect, it } from "vitest";
import { getPopulationReferenceSet } from "../src/application/sam/populationReferenceRegistry";
import { ageBandsForMunicipality } from "../src/application/sam";

describe("padrón de Zagra 2016 en el registro de SAM", () => {
  const ref = getPopulationReferenceSet("zagra").allAges!;
  it("se resuelve por id del expediente y por código INE", () => {
    expect(getPopulationReferenceSet("18913").allAges).toBe(ref);
  });
  it("tiene 18 bandas y las sumas coinciden con los totales del export del IECA", () => {
    const m = ref.ageSexMatrix!;
    expect(m).toHaveLength(18);
    const h = m.reduce((s, c) => s + c.male, 0);
    const f = m.reduce((s, c) => s + c.female, 0);
    expect([h, f, h + f]).toEqual([449, 433, 882]);
    expect(ref.populationTotal).toBe(882);
    expect(ref.year).toBe(2016);
  });
  it("la última banda es abierta 85+ y SAM la interpreta", () => {
    const bands = ageBandsForMunicipality("zagra");
    expect(bands).toHaveLength(18);
    expect(bands[17].label).toBe("85+");
  });
  it("solo ofrece todas las edades; no inventa referencia adulta ni de menores", () => {
    const set = getPopulationReferenceSet("zagra");
    expect(set.adult).toBeUndefined();
    expect(set.minor).toBeUndefined();
  });
  it("otros municipios no cambian", () => {
    expect(getPopulationReferenceSet("loja")).toEqual({});
    expect(getPopulationReferenceSet("fuente-vaqueros").allAges?.populationTotal).toBe(4744);
  });
});
