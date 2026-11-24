import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createCompleteMunicipalityWorkspace } from "../src/application/workspace";
import { planActionParagraphs } from "../src/application/action-plan/exportPlanDocument";
import { describeProfilePlanLink, profilePlanOptions, type ProfilePlanLink } from "../src/application/action-plan/profilePlanLinks";
import { createDeliberativePrioritySelection } from "../src/domain/deliberative-prioritisation";
import type { LecturaEstrategicaLocal } from "../src/domain/strategic-scenario";
import type { ActionPlanTraceabilityLink } from "../src/domain/action-plan-catalog/ActionPlanTraceability";
import type { ExternalHealthProfile } from "../src/domain/health-profile/ExternalHealthProfile";
import { parseWorkspaceJSON, serializeWorkspaceForStorage } from "../src/infrastructure/persistence/local-storage";
import { ProfilePlanTracePanel } from "../src/ui/components/ProfilePlanTracePanel";

const date = "2026-11-24T12:00:00Z";
const lectura = {
  id: "lectura-p1", municipalityId: "ensayo", sourcePSLId: "p1", sourcePSLVersion: "p1",
  hasTranslatableContent: true,
  escenarios: [{ id: "s1", tema: "Envejecimiento saludable", areasOrigen: ["R1"] }],
} as LecturaEstrategicaLocal;
const target = {
  moduleId: "envejecimiento", moduleTitle: "Envejecimiento", moduleVersion: "1",
  objectiveCode: "O1", objectiveTitle: "Mejorar la participación",
  indicatorCode: "I1", indicatorTitle: "Participación en actividades", indicatorWorksheetKey: "ensayo/envejecimiento/I1",
} as ActionPlanTraceabilityLink;

function scenario() {
  const workspace = createCompleteMunicipalityWorkspace({ id: "ensayo", name: "Ensayo" });
  const profile: ExternalHealthProfile = {
    schema: "compas-external-profile/v1", id: "p1", municipalityId: "ensayo", title: "Perfil · revisión 1.0.0",
    period: "", author: "Equipo", createdAt: date, summary: "", text: "", findings: [], limitations: [],
    areas: [{ id: "R1", title: "Facilitar la participación", rationale: "" }, { id: "R2", title: "Otra propuesta", rationale: "" }],
    results: [
      { id: "r1", title: "Participación", value: "28,50", unit: "%", period: "2024", source: "Fuente de ensayo", scale: "Municipio", page: "Tabla 1", caution: "" },
      { id: "secret", title: "Cota", value: "< 5", unit: "personas", period: "2024", source: "Fuente de ensayo", scale: "Municipio", page: "Tabla 1", caution: "" },
    ],
    choices: [{ target: "R1", decision: "chosen", by: "Equipo", at: date }], status: "review", attachmentIds: [],
  };
  workspace.externalProfileLibrary = { profiles: [profile], activeId: profile.id, attachments: [] };
  const selection = createDeliberativePrioritySelection({
    lectura, selectedScenarioIds: ["s1"], catalogModuleLinks: [{ scenarioId: "s1", moduleId: target.moduleId }],
    deliberationRationale: "Acta sintética", citizenInfluenceStatement: "Sin consulta", decidedBy: "Grupo Motor", now: date,
  });
  if (!selection.ok) throw new Error(selection.violations.join(" "));
  workspace.deliberativePrioritySelection = selection.selection;
  const link: ProfilePlanLink = {
    profileId: profile.id, selectionId: selection.selection.id, recommendationId: "R1", scenarioId: "s1",
    worksheetKey: target.indicatorWorksheetKey, moduleVersion: "1", baselineResultId: "r1", recordedBy: "Equipo", recordedAt: date,
  };
  return { workspace, link, profile };
}

describe("trazabilidad del Perfil al indicador", () => {
  it("conserva la línea de base literal, el periodo y la fuente en la interfaz y exportación", () => {
    const { workspace, link } = scenario();
    workspace.profilePlanLinks = [link];
    const recovered = parseWorkspaceJSON(serializeWorkspaceForStorage(workspace))!;
    const options = profilePlanOptions(recovered, lectura, [target]);
    expect(options.recommendations.map(r => r.id)).toEqual(["R1"]);
    expect(options.baselines.map(r => r.id)).toEqual(["r1"]);
    const detail = describeProfilePlanLink(options, recovered.profilePlanLinks![0])!;
    expect(detail).toMatchObject({
      recommendation: "Facilitar la participación", priority: "Envejecimiento saludable",
      objective: "O1 · Mejorar la participación", indicator: "I1 · Participación en actividades",
      baseline: { value: "28,50", period: "2024", source: "Fuente de ensayo", locator: "Tabla 1", scope: "Municipio" },
    });
    const html = renderToStaticMarkup(<ProfilePlanTracePanel options={options} links={[link]} onSave={async () => {}} />);
    expect(html).toContain("Guardar vínculo");
    expect(html).toContain("28,50 %");
    expect(html).not.toContain("Otra propuesta");
    const paragraphs = planActionParagraphs({
      schemaVersion: 1, municipalityId: "ensayo", generatedAt: date, status: "draft", paragraphs: [], profilePlanLinks: [detail],
    });
    expect(paragraphs.map(p => p.text).join("\n")).toContain("28,50 % · 2024 · Municipio · Fuente de ensayo · Tabla 1");
  });

  it("deja fuera enlaces a prioridades anteriores, otra versión del indicador o cifras bajo secreto", () => {
    const { workspace, link } = scenario();
    const options = profilePlanOptions(workspace, lectura, [target]);
    expect(describeProfilePlanLink(options, { ...link, recommendationId: "R2" })).toBeUndefined();
    expect(describeProfilePlanLink(options, { ...link, moduleVersion: "2" })).toBeUndefined();
    expect(describeProfilePlanLink(options, { ...link, baselineResultId: "secret" })).toBeUndefined();
    expect(describeProfilePlanLink(profilePlanOptions(workspace, { ...lectura, id: "lectura-nueva" }, [target]), link)).toBeUndefined();
  });
});
