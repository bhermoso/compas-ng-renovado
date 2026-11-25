import { describe, expect, it } from "vitest";
import { analyzeIBSEYouth, meanWithInterval } from "../src/application/ibse/analyzeIBSEYouth";
import { ageBandsForMunicipality } from "../src/application/sam/ageBandsForMunicipality";
import { getSingleAgePopulation } from "../src/application/sam/populationReferenceRegistry";

const H = "record_id,sexo,edad,ibse_deprimido,ibse_feliz,ibse_solo,ibse_disfrutar,ibse_energia,ibse_tranquilo,ibse_optimista,ibse_bienmismo,ibse_factor_vinculo,ibse_factor_situacion,ibse_factor_control,ibse_factor_persona,ibse_total,monitor_ibse_complete";
// Ítems en su mejor valor: 100 en todos los factores; en el peor: 0.
const best = "1,4,1,4,4,4,1,1,,,,,,2";
const worst = "4,1,4,1,1,1,5,5,,,,,,2";

function csv(rows: Array<[number, number, string]>) {
  return [H, ...rows.map(([sex, age, items], i) => `${i + 1},${sex},${age},${items}`)].join("\n");
}

describe("análisis del IBSE en la franja joven", () => {
  const population = getSingleAgePopulation("atarfe")!;

  it("la población por edad simple de Atarfe es la declarada en la fuente", () => {
    expect(population.counts[13]).toBe(245);
    expect(population.counts[17]).toBe(262);
    expect(getSingleAgePopulation("zagra")).toBeUndefined();
  });

  it("cuenta respuestas por edad y sexo y compara la franja con las edades mayores", () => {
    const text = csv([[1, 14, best], [2, 14, worst], [2, 15, best], [1, 30, worst]]);
    const a = analyzeIBSEYouth({ csvText: text, municipalityId: "atarfe", ageBands: ageBandsForMunicipality("atarfe"), population, minAge: 14, maxAge: 17 })!;
    expect(a.ages.map((r) => [r.age, r.n, r.population])).toEqual([[14, 2, 226], [15, 1, 247]]);
    expect(a.ages[0].total.mean).toBe(50);
    expect(a.ages[0].men).toEqual({ n: 1, meanTotal: 100 });
    expect(a.ages[0].women).toEqual({ n: 1, meanTotal: 0 });
    expect(a.group.population).toBe(226 + 247 + 262 + 262);
    expect(a.group.n).toBe(3);
    expect(a.older).toEqual({ n: 1, means: { meanTotal: 0, meanFactorVinculo: 0, meanFactorPersona: 0, meanFactorSituacion: 0, meanFactorControl: 0 } });
    // Sin 10 respuestas no hay intervalo.
    expect(a.ages[0].total.low).toBeUndefined();
  });

  it("el intervalo usa la corrección por población finita y desaparece si se responde todo", () => {
    const xs = [40, 50, 60, 70, 80, 40, 50, 60, 70, 80];
    const wide = meanWithInterval(xs, 100_000);
    const narrow = meanWithInterval(xs, 20);
    expect(wide.mean).toBe(60);
    expect(narrow.high! - narrow.low!).toBeLessThan(wide.high! - wide.low!);
    const census = meanWithInterval(xs, 10);
    expect(census.low).toBeCloseTo(60, 10);
    expect(census.high).toBeCloseTo(60, 10);
  });
});
