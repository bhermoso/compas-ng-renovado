import { municipalActionPlanModule } from "../src/domain/action-plan-catalog/MunicipalActionPlanModule";
import { HEALTHY_AGING_MODULE } from "../src/domain/action-plan-catalog/ActionPlanCatalog";
import { ACTION_PLAN_CATALOG } from "../src/domain/action-plan-catalog/ActionPlanCatalog";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActionPlanCatalogPanel } from "../src/ui/components/ActionPlanCatalogPanel";
import { getEligibleActionPlanModules } from "../src/domain/action-plan-catalog";
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
    expect(html.match(/Ficha del indicador · /g)).toHaveLength(specific);
    expect(html).not.toContain("Gestionar actuaciones");
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
      municipalityId: "municipio-ensayo",
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

  it("muestra un árbol que vincula objetivo, indicador y actuación de la agenda (28/11/2026)", () => {
    // Módulo común de Envejecimiento en un municipio cualquiera, con un borrador explícito.
    const module = municipalActionPlanModule("alfacar", HEALTHY_AGING_MODULE);
    const general = module.generalObjectives[0];
    const first = general.specificObjectives[0];
    const draft = {
      municipalityId: "alfacar",
      moduleId: module.id,
      version: module.version,
      updatedAt: "2026-11-21T00:00:00.000Z",
      decisions: {
        [module.id]: { status: "included" as const, sourceText: module.strategicObjective },
        [general.code]: { status: "included" as const, sourceText: general.title },
        [first.code]: { status: "included" as const, sourceText: first.title },
        [first.indicator.code]: { status: "included" as const, sourceText: first.indicator.title },
      },
    };
    const sheet = createIndicatorWorksheet({
      municipalityId: "alfacar",
      moduleId: module.id,
      moduleVersion: module.version,
      line: module.title,
      generalObjective: general.code,
      objective: first.code,
      indicatorCode: first.indicator.code,
      indicator: first.indicator.title,
      unit: first.indicator.unit,
      source: module.sourceLabel,
    });
    const agendaActuations = [{
      id: "agenda-tree", municipalityId: "alfacar", setting: null, order: 0, origin: "manual" as const,
      name: "Actuación conectada al indicador",
      identification: { year: 2027, description: "Ejecuta la actividad que alimenta el indicador." },
      strategic: { mainIndicator: `${first.indicator.displayCode ?? first.indicator.code} · ${first.indicator.title}` },
      population: {}, responsibles: { responsible: "Centro de salud" },
      tracking: { status: "planificada" as const, resources: "Equipo profesional y sala comunitaria" },
      result: { nextCycleDecision: "no-decidido" as const }, createdAt: "", updatedAt: "",
    }];

    const html = renderToStaticMarkup(createElement(ActionPlanCatalogPanel, {
      municipalityId: "alfacar",
      lectura,
      selection,
      eligibleModules: getEligibleActionPlanModules(lectura, selection),
      reviews: [],
      drafts: [draft],
      onDraftChange: () => {},
      worksheets: [sheet],
      agendaActuations,
      onWorksheetChange: () => {},
      onSave: () => [],
    }));

    expect(html).toContain("Árbol de objetivos, indicadores y actuaciones de la agenda");
    expect(html).toContain("Objetivo específico");
    expect(html).toContain("Indicador de seguimiento");
    expect(html).toContain("Actuación de la agenda");
    expect(html).toContain("Actuación conectada al indicador");
    expect(html).toContain("1 actuación en la agenda");
  });
});
