import { describe, expect, it } from "vitest";
import { getPopulationReferenceSet } from "../src/application/sam/populationReferenceRegistry";
import { ageBandsForMunicipality } from "../src/application/sam";

describe("población de Zagra 2025 (INE 68535) en el registro de SAM", () => {
  const ref = getPopulationReferenceSet("zagra").allAges!;
  it("se resuelve por id del expediente y por código INE", () => {
    expect(getPopulationReferenceSet("18913").allAges).toBe(ref);
  });
  it("tiene 21 bandas y las sumas coinciden con el total publicado", () => {
    const m = ref.ageSexMatrix!;
    expect(m).toHaveLength(21);
    const h = m.reduce((s, c) => s + c.male, 0);
    const f = m.reduce((s, c) => s + c.female, 0);
    expect([h, f, h + f]).toEqual([420, 423, 843]);
    expect(ref.populationTotal).toBe(843);
    expect(ref.year).toBe(2025);
  });
  it("la última banda es abierta 100+ y SAM la interpreta", () => {
    const bands = ageBandsForMunicipality("zagra");
    expect(bands).toHaveLength(21);
    expect(bands[20].label).toBe("100+");
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
