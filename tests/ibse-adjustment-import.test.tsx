import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { prepareIBSEImport } from "../src/application/ibse/prepareIBSEImport";
import { parseIBSECSV, ibseStudyToEvidenceAtoms } from "../src/application/ibse";
import { createIBSEStudy } from "../src/domain/ibse";
import { IBSEPanel } from "../src/ui/components/IBSEPanel";
import { ATARFE_POPULATION_2025 } from "../fixtures/population/atarfe-population-2025";
import { parseWorkspaceJSON, serializeWorkspaceForStorage } from "../src/infrastructure/persistence/local-storage";

const header = "monitor_ibse_complete,ibse_total,ibse_factor_vinculo,ibse_factor_situacion,ibse_factor_control,ibse_factor_persona,sexo,edad";
// Synthetic coverage of every 15+ cell; these are not real IBSE responses.
const rows = ATARFE_POPULATION_2025.ageSexMatrix!.filter((cell) => parseInt(cell.ageBand) >= 15)
  .flatMap((cell) => [1, 2].map((sex) => `2,${sex === 1 ? 80 : 40},60,50,30,90,${sex},${parseInt(cell.ageBand)}`));
const csv = [header, ...rows].join("\n");

describe("IBSE import with a separate demographic adjustment", () => {
  it("requires explicit target selection and leaves legacy means unchanged", async () => {
    const parsed = await prepareIBSEImport(csv, "atarfe");
    expect(parsed.demographicAdjustment.status).toBe("blocked");
    expect(parsed.aggregates).toEqual(parseIBSECSV(csv).aggregates);
    expect(parsed).not.toHaveProperty("adjustmentRows");
  });

  it.each(["atarfe", "18022"])("computes all factors with traceability for %s", async (id) => {
    const parsed = await prepareIBSEImport(csv, id, "15-plus");
    const adjustment = parsed.demographicAdjustment;
    expect(adjustment.status).toBe("computed");
    if (adjustment.status !== "computed") throw new Error("Expected adjustment");
    expect(adjustment.sampleFingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(adjustment.reference.ageGroupLabel).toBe("15 años y más");
    expect(adjustment.metrics.meanTotal.nValid).toBe(rows.length);
    expect(adjustment.metrics.meanFactorVinculo.adjustedMean).toBeCloseTo(60);
    expect(parsed.aggregates).toEqual(parseIBSECSV(csv).aggregates);
    const study = createIBSEStudy({ municipalityId: id, sourceFileName: "synthetic.csv", ...parsed });
    const workspace = parseWorkspaceJSON(readFileSync("public/seeds/compas-ng-workspace-atarfe.json", "utf8"))!;
    workspace.ibseStudy = study;
    const restored = parseWorkspaceJSON(serializeWorkspaceForStorage(workspace))!.ibseStudy!;
    expect(restored.demographicAdjustment).toEqual(adjustment);
    const atoms = ibseStudyToEvidenceAtoms(restored);
    expect(atoms).toHaveLength(6);
    for (const atom of atoms) {
      expect(atom.methodology?.limitations?.join(" ")).toContain(adjustment.sampleFingerprint);
      expect(atom.methodology?.limitations?.join(" ")).toContain("2025");
    }
    const html = renderToStaticMarkup(createElement(IBSEPanel, { ibseStudy: restored }));
    expect(html).toContain("Media observada");
    expect(html).toContain("Media ajustada");
    expect(html).toContain("pendiente de validación humana");
  });

  it("blocks missing demographic data in the real repository fixture", async () => {
    const parsed = await prepareIBSEImport(readFileSync("fixtures/ibse-atarfe.csv", "utf8"), "atarfe", "15-plus");
    expect(parsed.demographicAdjustment.status).toBe("blocked");
    expect(parsed.aggregates.meanTotal).toBe(63.2);
  });

  it.each([
    ["missing cell", [header, ...rows.slice(1)].join("\n")],
    ["unassignable age", csv.replace(",1,15", ",1,15x")],
    ["unknown sex", csv.replace(",1,15", ",9,15")],
    ["younger than target", csv + "\n2,50,50,50,50,50,1,14"],
    ["invalid numeric suffix", csv.replace("2,80,", "2,80x,")],
    ["out of scale", csv.replace("2,80,", "2,101,")],
  ])("does not silently repair %s", async (_name, value) => {
    expect((await prepareIBSEImport(value, "atarfe", "15-plus")).demographicAdjustment.status).toBe("blocked");
  });

  it("does not reuse Atarfe's reference for Loja", async () => {
    expect((await prepareIBSEImport(csv, "loja", "15-plus")).demographicAdjustment.status).toBe("blocked");
  });
});
