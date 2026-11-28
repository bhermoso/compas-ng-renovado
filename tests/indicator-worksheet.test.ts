import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Packer } from "docx";
import mammoth from "mammoth";
import {
  actionFields,
  activityFields,
  createIndicatorWorksheet,
  worksheetContextChanged,
  worksheetKey,
} from "../src/domain/action-plan-catalog/IndicatorWorksheet";
import { actionProposalsForIndicator } from "../src/domain/action-plan-catalog/ActionWorksheetProposal";
import { buildIndicatorWorksheetDocument } from "../src/application/action-plan/exportIndicatorWorksheet";
import { createCompleteMunicipalityWorkspace } from "../src/application/workspace";
import { parseWorkspaceJSON } from "../src/infrastructure/persistence/local-storage";
import { isEmptyWorkspaceForPersistenceGuard } from "../src/application/workspace/isEmptyWorkspaceForPersistenceGuard";

const context = { municipalityId: "worksheet-test", moduleId: "env-2027-2030", moduleVersion: "3.1", line: "Envejecimiento saludable", generalObjective: "ENV-OG1", objective: "ENV-OE1.1", indicatorCode: "ENV-I1.1", indicator: "Autonomía funcional", unit: "%", source: "Propuesta documental" };

describe("Fichas cumplimentables — integridad y entrega", () => {
  it("no crea observaciones, actuaciones ni responsables y conserva la referencia original", () => {
    const sheet = createIndicatorWorksheet(context);
    expect(sheet.values).toEqual({});
    expect(sheet.actions).toEqual([]);
    expect(sheet.consolidations).toEqual([]);
    expect(worksheetContextChanged(sheet, { ...context, indicator: "Redacción adaptada" })).toBe(true);
    expect(sheet.context.indicator).toBe("Autonomía funcional");
    expect(worksheetKey({ ...context, municipalityId: "other" })).not.toBe(worksheetKey(context));
  });

  it("ofrece borradores de actuaciones de Edadismo sin añadirlos ni asignar responsables", () => {
    const first = actionProposalsForIndicator("ENV-I5.1");
    const second = actionProposalsForIndicator("ENV-I5.2");
    expect(first).toHaveLength(1);
    expect(second).toHaveLength(1);
    expect(actionProposalsForIndicator("ENV-I1.1")).toEqual([]);
    expect(first[0].values.agreement).toContain("pendiente de revisión y acuerdo");
    expect(first[0].values.owner).toBeUndefined();
    expect(second[0].values.owner).toBeUndefined();
    expect(createIndicatorWorksheet({ ...context, indicatorCode: "ENV-I5.1" }).actions).toEqual([]);
  });

  it("persiste fichas, actuaciones y varios periodos sin poblar diagnóstico ni decisiones", () => {
    const workspace = createCompleteMunicipalityWorkspace({ id: context.municipalityId, name: "Prueba de persistencia" });
    const sheet = createIndicatorWorksheet(context);
    sheet.values.owner = "Responsable de prueba";
    sheet.actions.push({ id: "action-test", values: { name: "Actuación de prueba" }, returns: [
      { id: "r1", values: { period: "periodo uno", numerator: "0", denominator: "10" } },
      { id: "r2", values: { period: "periodo dos", limitations: "Sin datos" } },
    ], activities: [{ id: "act-1", values: { name: "Taller verificable", evidence: "Acta" } }] });
    workspace.indicatorWorksheets = [sheet];
    const restored = parseWorkspaceJSON(JSON.stringify(workspace))!;
    expect(restored.indicatorWorksheets).toEqual([sheet]);
    expect(isEmptyWorkspaceForPersistenceGuard(restored)).toBe(false);
    expect(restored.evidenceStore.atoms).toEqual([]);
    expect(restored.actionPlanModuleReviews).toBeUndefined();
    expect(restored.validatedPSL).toBeUndefined();
    expect(parseWorkspaceJSON(JSON.stringify({ ...workspace, indicatorWorksheets: undefined }))?.indicatorWorksheets).toBeUndefined();
  });

  it("contrata la frontera entre actuación y actividad", () => {
    const contract = readFileSync(
      resolve(process.cwd(), "docs/FICHAS-INDICADORES-ACTUACIONES.md"),
      "utf8"
    );
    const contractText = contract.replace(/\s+/g, " ");
    expect(contract).toContain("Actuación");
    expect(contract).toContain("unidad de intervención comprometida");
    expect(contract).toContain("Actividad");
    expect(contract).toContain("unidad concreta de ejecución");
    expect(contractText).toContain("una actividad siempre pertenece a una actuación");
    expect(actionFields.map(([, label]) => label)).toContain(
      "Qué se hará y cómo contribuirá al objetivo"
    );
    expect(activityFields.map(([, label]) => label)).toContain(
      "Producto o dato que aportará a la actuación"
    );
  });

  it("Word conserva texto, cero observado y ausencia de datos; lista las actuaciones de la agenda", async () => {
    const sheet = createIndicatorWorksheet(context);
    sheet.values.owner = "Responsable de prueba & equipo";
    sheet.returns = [{ id: "r1", values: { actuation: "Taller de prueba", numerator: "0" } }];
    const agenda = [{ id: "ag1", municipalityId: "m", setting: null, order: 0, origin: "manual" as const, name: "Taller de prueba",
      identification: {}, strategic: { mainIndicator: `${context.indicatorCode} · indicador` }, population: {}, responsibles: { responsible: "Centro de salud" },
      tracking: { status: "planificada" as const }, result: { nextCycleDecision: "no-decidido" as const }, createdAt: "", updatedAt: "" }];
    const buffer = await Packer.toBuffer(buildIndicatorWorksheetDocument(sheet, "Pendiente del Grupo Motor", true, agenda));
    const { value } = await mammoth.extractRawText({ buffer });
    expect(value).toContain("Responsable de prueba & equipo");
    expect(value).toContain("Taller de prueba · Planificada · Centro de salud");
    expect(value).not.toContain("Ficha de actuación anterior");
    expect(value).toContain("\n0\n");
    expect(value).toContain("[Pendiente de cumplimentar]");
    expect(value).toContain("la referencia actual ha cambiado");
    expect(value).toContain("Pendiente del Grupo Motor");
  });
});
