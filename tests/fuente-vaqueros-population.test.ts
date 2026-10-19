import { describe, expect, it } from "vitest";
import { getPopulationReferenceSet } from "../src/application/sam/populationReferenceRegistry";

describe("padrón de Fuente Vaqueros 2025 en el registro de SAM", () => {
  const ref = getPopulationReferenceSet("fuente-vaqueros").allAges!;
  it("se resuelve por id del expediente y por código INE", () => {
    expect(getPopulationReferenceSet("18079").allAges).toBe(ref);
  });
  it("tiene 21 bandas y las sumas coinciden con el total del INE", () => {
    const m = ref.ageSexMatrix!;
    expect(m).toHaveLength(21);
    const h = m.reduce((s, c) => s + c.male, 0);
    const f = m.reduce((s, c) => s + c.female, 0);
    expect([h, f, h + f]).toEqual([2368, 2376, 4744]);
    expect(ref.populationTotal).toBe(4744);
  });
  it("solo ofrece todas las edades; no inventa referencia adulta ni de menores", () => {
    const set = getPopulationReferenceSet("fuente-vaqueros");
    expect(set.adult).toBeUndefined();
    expect(set.minor).toBeUndefined();
  });
  it("otro municipio sigue sin referencia", () => {
    expect(getPopulationReferenceSet("loja")).toEqual({});
  });
});
