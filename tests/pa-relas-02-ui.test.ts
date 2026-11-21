import { ACTION_PLAN_CATALOG } from "../src/domain/action-plan-catalog/ActionPlanCatalog";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActionPlanCatalogPanel } from "../src/ui/components/ActionPlanCatalogPanel";
import { getEligibleActionPlanModules } from "../src/domain/action-plan-catalog";
import { ZAIDIN_AGING_PROPOSAL } from "../src/domain/action-plan-catalog/PlanPreparationDraft";
import { createIndicatorWorksheet } from "../src/domain/action-plan-catalog/IndicatorWorksheet";
import type { DeliberativePrioritySelection } from "../src/domain/deliberative-prioritisation";
import type { LecturaEstrategicaLocal } from "../src/domain/strategic-scenario";
import { LECTURA_COMPLEJA } from "./strategic-scenario-fixtures";

const scenario = { ...LECTURA_COMPLEJA.escenarios[0], id: "aging", tema: "Envejecimiento saludable" };
const lectura: LecturaEstrategicaLocal = { ...LECTURA_COMPLEJA, id: "lectura-ui", escenarios: [scenario] };
const selection: DeliberativePrioritySelection = {
  id: "selection-ui",
  municipalityId: lectura.municipalityId,
  sourceLecturaId: lectura.id,
  sourcePSLId: lectura.sourcePSLId,
  sourcePSLVersion: lectura.sourcePSLVersion,
  candidateScenarioIds: [scenario.id],
  selectedScenarioIds: [scenario.id],
  catalogModuleLinks: [{ scenarioId: scenario.id, moduleId: "env-2027-2030" }],
  citizenTopicIds: [],
  deliberationRationale: "Acuerdo de prueba",
  citizenInfluenceStatement: "Constancia de prueba",
  decidedBy: "Grupo Motor",
  decidedByRole: "group-motor",
  decidedAt: "2026-09-04T08:00:00.000Z",
  requiresHumanValidation: true,
};

describe("PA-RELAS-02 — representación editorial", () => {
  it("muestra las dos líneas para consulta aunque aún no exista selección", () => {
    const html = renderToStaticMarkup(createElement(ActionPlanCatalogPanel, {
      municipalityId: lectura.municipalityId,
      eligibleModules: [],
      reviews: [],
      worksheets: [],
      onWorksheetChange: () => {},
      onSave: () => [],
    }));
    // Las tres líneas del catálogo se consultan sin selección; una ficha por objetivo específico.
    const specific = ACTION_PLAN_CATALOG.reduce((n, m) => n + m.generalObjectives.reduce((k, g) => k + g.specificObjectives.length, 0), 0);
    expect(html).toContain("Envejecimiento saludable");
    expect(html).toContain("Prevención y abordaje de las adicciones");
    expect(html).toContain("Bienestar emocional y salud mental");
    expect(html).toContain("Puedes examinar su arquitectura");
    expect(html).not.toContain("Aceptar todo");
    expect(html.match(/Ver ficha técnica propuesta/g)).toHaveLength(specific);
    expect(html.match(/Gestionar actuaciones/g)).toHaveLength(specific);
    expect(html).toContain("Método de cálculo");
    expect(html).toContain("Criterio de calidad");
  });

  it("identifica propuesta, procedencia, decisiones humanas y ficha técnica", () => {
    const html = renderToStaticMarkup(createElement(ActionPlanCatalogPanel, {
      municipalityId: lectura.municipalityId,
      lectura,
      selection,
      eligibleModules: getEligibleActionPlanModules(lectura, selection),
      reviews: [],
      worksheets: [],
      onWorksheetChange: () => {},
      onSave: () => [],
    }));

    expect(html).toContain("Módulo propuesto");
    expect(html).toContain("Grupo Motor seleccionó la prioridad");
    expect(html).toContain("Aceptar todo");
    expect(html).toContain("Decisión sobre la línea estratégica");
    expect(html).toContain("Modificar / adaptar");
    expect(html).toContain("Ver ficha técnica propuesta");
    expect(html).toContain("Pendiente de asignación formal");
    expect(html).toContain("no genera actuaciones");
  });

  it("cuando hay edición directa no muestra la revisión formal legacy", () => {
    const html = renderToStaticMarkup(createElement(ActionPlanCatalogPanel, {
      municipalityId: "granada-zaidin",
      lectura,
      selection,
      eligibleModules: getEligibleActionPlanModules(lectura, selection),
      reviews: [],
      drafts: [],
      onDraftChange: () => {},
      worksheets: [],
      onWorksheetChange: () => {},
      onSave: () => [],
    }));

    expect(html).toContain("Plan de Acción · edición territorial directa");
    expect(html).toContain("la nueva redacción queda guardada como texto vigente");
    expect(html).not.toContain("Revisión formal y catálogo original");
    expect(html).not.toContain("Guardar revisión del módulo");
    expect(html).not.toContain("Acción administrativa");
  });

  it("muestra un árbol operativo que vincula objetivo, indicador, actuación y actividad", () => {
    const first = ZAIDIN_AGING_PROPOSAL.generalObjectives[0].specificObjectives[0];
    const sheet = createIndicatorWorksheet({
      municipalityId: "granada-zaidin",
      moduleId: ZAIDIN_AGING_PROPOSAL.id,
      moduleVersion: ZAIDIN_AGING_PROPOSAL.version,
      line: ZAIDIN_AGING_PROPOSAL.title,
      generalObjective: ZAIDIN_AGING_PROPOSAL.generalObjectives[0].code,
      objective: first.code,
      indicatorCode: first.indicator.code,
      indicator: first.indicator.title,
      unit: first.indicator.unit,
      source: ZAIDIN_AGING_PROPOSAL.sourceLabel,
    });
    sheet.actions = [{
      id: "action-tree",
      values: {
        name: "Actuación conectada al indicador",
        owner: "Centro de salud",
        contribution: "Ejecuta la actividad que alimenta el indicador.",
        schedule: "Primer semestre",
        resources: "Equipo profesional y sala comunitaria",
        requestedData: "Personas participantes y sesiones realizadas",
        source: "Registro de actividad",
      },
      activities: [{
        id: "activity-tree",
        values: {
          name: "Taller inicial verificable",
          status: "planificado",
          schedule: "2027",
          evidence: "Registro de asistencia",
        },
      }],
      returns: [{ id: "return-tree", values: { period: "2027" } }],
    }];

    const html = renderToStaticMarkup(createElement(ActionPlanCatalogPanel, {
      municipalityId: "granada-zaidin",
      lectura,
      selection,
      eligibleModules: getEligibleActionPlanModules(lectura, selection),
      reviews: [],
      drafts: [],
      onDraftChange: () => {},
      worksheets: [sheet],
      onWorksheetChange: () => {},
      onSave: () => [],
    }));

    expect(html).toContain("Árbol operativo de objetivos, indicadores y actividades");
    expect(html).toContain("Objetivo específico");
    expect(html).toContain("Indicador de seguimiento");
    expect(html).toContain("Actuación → actividades → entregas");
    expect(html).toContain("Actuación conectada al indicador");
    expect(html).toContain("Taller inicial verificable");
    expect(html).toContain("1 entrega registrada");
  });
});
