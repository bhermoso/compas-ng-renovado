import { describe, expect, it } from "vitest";
import { parseIBSECSV } from "../src/application/ibse";
import { ageBandsForMunicipality } from "../src/application/sam/ageBandsForMunicipality";
import { validateIBSEStrataCounts } from "../src/domain/ibse/ibseSampleScope";

const header = "record_id,sexo,edad,ibse_deprimido,ibse_feliz,ibse_solo,ibse_disfrutar,ibse_energia,ibse_tranquilo,ibse_optimista,ibse_bienmismo,monitor_ibse_complete";
const row = (id: number, edad: string, complete = "2") => `${id},1,${edad},1,4,1,4,4,4,1,1,${complete}`;
const bands = ageBandsForMunicipality("atarfe");

describe("IBSE · estratos de edad y año de nacimiento en el campo de edad", () => {
  it("convierte un año de nacimiento en edad con el año de la encuesta y lo declara", () => {
    const csv = [header, row(1, "14"), row(2, "40"), row(3, "1993")].join("\n");
    const r = parseIBSECSV(csv, { ageBands: bands, surveyYear: 2026 });
    expect(r.strataCounts).toMatchObject({ under16: { n: 1, nValid: 1 }, plus16: { n: 2, nValid: 2 } });
    expect(r.ageSexObserved?.unassignableCount).toBe(0);
    expect(r.methodologicalCautions.join(" ")).toContain("1993 → 33 años");
    expect(validateIBSEStrataCounts(r.strataCounts, r.aggregates).valid).toBe(true);
  });

  it("sin año de la encuesta no convierte: el registro queda sin estrato y el desglose no cuadra", () => {
    const csv = [header, row(1, "14"), row(2, "1993")].join("\n");
    const r = parseIBSECSV(csv, { ageBands: bands });
    expect(r.strataCounts?.noAge).toEqual({ n: 1, nValid: 1 });
    expect(validateIBSEStrataCounts(r.strataCounts, r.aggregates).valid).toBe(false);
  });

  it("los registros incompletos sin edad no impiden el desglose", () => {
    const csv = [header, row(1, "14"), row(2, "40"), row(3, "", "0")].join("\n");
    const r = parseIBSECSV(csv, { ageBands: bands, surveyYear: 2026 });
    expect(r.aggregates).toMatchObject({ n: 3, nValid: 2 });
    expect(r.strataCounts?.noAge).toEqual({ n: 1, nValid: 0 });
    expect(validateIBSEStrataCounts(r.strataCounts, r.aggregates).valid).toBe(true);
    expect(r.strataCounts?.under16?.means?.meanTotal).toBe(100);
  });
});
