import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { assessSample } from "../src/application/sam/assessSample";

const read = (p: string) => readFileSync(p, "utf-8");

describe("CONTRACT-SAM-ANY-SAMPLE", () => {
  const contract = read("docs/contracts/CONTRACT-SAM-ANY-SAMPLE.md");
  const index = read("docs/contracts/CONTRACT-INDEX.md");
  it("está registrado en el índice y enlazado desde el contrato de la tripirámide", () => {
    expect(index).toContain("### CONTRACT-SAM-ANY-SAMPLE");
    expect(read("docs/contracts/CONTRACT-DYNAMIC-TRIPYRAMID.md")).toContain("CONTRACT-SAM-ANY-SAMPLE");
    expect(contract).toContain("CONTRACT-DYNAMIC-TRIPYRAMID");
  });
  it("sin padrón verificado el municipio no es evaluable y no se estima", () => {
    const r = assessSample({ instrumentId: "csv-manual", municipalityId: "municipio-sin-padron", nObserved: 100 });
    expect(r.status).toBe("not-evaluable");
  });
  it("con padrón y sin registros emite tamaño y declara la representatividad no evaluable", () => {
    const r = assessSample({ instrumentId: "csv-manual", municipalityId: "atarfe", nObserved: 100 });
    expect(r.status).toBe("evaluable");
    if (r.status === "evaluable") expect(r.compositionNote).toMatch(/No evaluable por edad y sexo/);
  });
  it("un registro sin sexo reconocible no se imputa", () => {
    const records = Array.from({ length: 60 }, (_, i) => ({ sex: i % 5 === 0 ? "x" : i % 2 ? "1" : "2", age: 20 + (i % 50) }));
    const r = assessSample({ instrumentId: "csv-manual", municipalityId: "atarfe", records });
    expect(r.status).toBe("evaluable");
    if (r.status === "evaluable") expect(r.observed?.unassignableCount ?? 0).toBeGreaterThan(0);
  });
});
