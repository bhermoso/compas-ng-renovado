import { describe, expect, it } from "vitest";
import {
  createDeliberativePrioritySelection,
  isDeliberativePrioritySelectionStale,
} from "../src/domain/deliberative-prioritisation";
import type { ThematicPrioritisation } from "../src/domain/thematic-prioritisation";
import { generatePAI } from "../src/application/pai";
import { StaticFrameworkProvider } from "../src/application/mte";
import { createCompleteMunicipalityWorkspace, isEmptyWorkspaceForPersistenceGuard } from "../src/application/workspace";
import { LECTURA_COMPLEJA } from "./strategic-scenario-fixtures";

const NOW = "2026-09-03T08:00:00.000Z";
const citizenPrioritisation: ThematicPrioritisation = {
  municipalityId: LECTURA_COMPLEJA.municipalityId,
  selectedTopicIds: ["bienestar-emocional", "sueno-descanso"],
  updatedAt: "2026-09-02T12:00:00.000Z",
};

function validSelection() {
  const result = createDeliberativePrioritySelection({
    lectura: LECTURA_COMPLEJA,
    citizenPrioritisation,
    selectedScenarioIds: [
      LECTURA_COMPLEJA.escenarios[1].id,
      LECTURA_COMPLEJA.escenarios[3].id,
    ],
    deliberationRationale: "El Grupo Motor selecciona estas candidaturas tras contrastar pertinencia y capacidad local.",
    citizenInfluenceStatement: "Los temas ciudadanos de bienestar emocional y sueño reforzaron la selección documentada.",
    decidedBy: "Grupo Motor RELAS de prueba",
    now: NOW,
  });
  if (!result.ok) throw new Error(result.violations.join("; "));
  return result.selection;
}

describe("PA-RELAS-01 — compuerta deliberativa MTE → PAI", () => {
  it("no crea una selección automática ni admite una decisión sin contenido humano", () => {
    const result = createDeliberativePrioritySelection({
      lectura: LECTURA_COMPLEJA,
      citizenPrioritisation,
      selectedScenarioIds: [],
      deliberationRationale: "",
      citizenInfluenceStatement: "",
      decidedBy: "",
      now: NOW,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations).toEqual(expect.arrayContaining([
        expect.stringContaining("al menos una recomendación del Perfil o registrar una prioridad propia"),
        expect.stringContaining("motivación"),
        expect.stringContaining("conocimiento ciudadano"),
        expect.stringContaining("Grupo Motor"),
      ]));
    }
  });

  it("separa y congela candidaturas técnicas, temas ciudadanos y decisión del Grupo Motor", () => {
    const selection = validSelection();

    expect(selection.candidateScenarioIds).toEqual(
      LECTURA_COMPLEJA.escenarios.map((scenario) => scenario.id)
    );
    expect(selection.citizenTopicIds).toEqual(citizenPrioritisation.selectedTopicIds);
    expect(selection.selectedScenarioIds).toHaveLength(2);
    expect(selection.decidedByRole).toBe("group-motor");
    expect(selection.requiresHumanValidation).toBe(true);
  });

  it("rechaza módulos catalogados vinculados a candidaturas no seleccionadas", () => {
    const result = createDeliberativePrioritySelection({
      lectura: LECTURA_COMPLEJA,
      citizenPrioritisation,
      selectedScenarioIds: [LECTURA_COMPLEJA.escenarios[1].id],
      catalogModuleLinks: [{
        scenarioId: LECTURA_COMPLEJA.escenarios[3].id,
        moduleId: "env-2027-2030",
      }],
      deliberationRationale: "El Grupo Motor selecciona una candidatura tras deliberación.",
      citizenInfluenceStatement: "Se documenta la influencia del conocimiento ciudadano.",
      decidedBy: "Grupo Motor RELAS de prueba",
      now: NOW,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.violations).toContain(
      "G-DPS-7: todo módulo catalogado debe vincularse a una candidatura seleccionada"
    );
  });

  it("invalida la decisión cuando cambia la priorización ciudadana", () => {
    const selection = validSelection();
    const changedCitizenPrioritisation = {
      ...citizenPrioritisation,
      updatedAt: "2026-09-03T09:00:00.000Z",
    };

    expect(isDeliberativePrioritySelectionStale(
      selection,
      LECTURA_COMPLEJA,
      citizenPrioritisation
    )).toBe(false);
    expect(isDeliberativePrioritySelectionStale(
      selection,
      LECTURA_COMPLEJA,
      changedCitizenPrioritisation
    )).toBe(true);
  });

  it("bloquea PAI sin selección deliberativa", () => {
    const result = generatePAI(
      LECTURA_COMPLEJA,
      undefined,
      new StaticFrameworkProvider([], "1.0.0"),
      NOW
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.violations[0]).toContain("selección deliberativa");
  });

  it("PAI incorpora solo los escenarios seleccionados por el Grupo Motor", () => {
    const selection = validSelection();
    const result = generatePAI(
      LECTURA_COMPLEJA,
      selection,
      new StaticFrameworkProvider([], "1.0.0"),
      NOW
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.borrador.sourcePrioritySelectionId).toBe(selection.id);
      expect(result.borrador.objetivos.map((objective) => objective.escenarioOrigen)).toEqual(
        selection.selectedScenarioIds
      );
      expect(result.borrador.objetivos).toHaveLength(2);
    }
  });

  it("la decisión persistida cuenta como contenido del workspace", () => {
    const workspace = {
      ...createCompleteMunicipalityWorkspace({ id: "municipio-test", name: "Municipio test" }),
      deliberativePrioritySelection: validSelection(),
    };

    expect(isEmptyWorkspaceForPersistenceGuard(workspace)).toBe(false);
  });

  it("una revisión de módulo PA-RELAS-02 cuenta como contenido persistible", () => {
    const workspace = {
      ...createCompleteMunicipalityWorkspace({ id: "municipio-test", name: "Municipio test" }),
      actionPlanModuleReviews: [{
        id: "review-1",
        municipalityId: "municipio-test",
        moduleId: "adi-2027-2030",
        moduleVersion: "3.1",
        sourceLecturaId: "lectura-1",
        sourcePrioritySelectionId: "selection-1",
        sourceScenarioIds: ["scenario-1"],
        decisions: [],
        reviewedBy: "Grupo Motor",
        reviewedAt: NOW,
        requiresHumanValidation: true as const,
      }],
    };

    expect(isEmptyWorkspaceForPersistenceGuard(workspace)).toBe(false);
  });
});
