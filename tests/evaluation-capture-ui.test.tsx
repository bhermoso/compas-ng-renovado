/**
 * Smoke/render tests para los componentes de captura de evaluación (Pieza 3).
 * Cubre: campos vacíos, mensajes de validación, "ninguna quedó fuera",
 * presencia del editor solo cuando se pasa el callback.
 */
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MonitoringPanel } from "../src/ui/components/MonitoringPanel";
import { DefinitiveActionPlanPreview } from "../src/ui/components/DefinitiveActionPlanPreview";
import { generateMonitoringDraft } from "../src/application/monitoring/MonitoringEngine";
import { generateAgendaDraft } from "../src/application/agenda/AgendaEngine";
import type { MonitoringDraft } from "../src/application/monitoring/MonitoringEngine";
import {
  ZAIDIN_AGING_PROPOSAL,
  createZaidinFinalActionPlanDraft,
} from "../src/domain/action-plan-catalog/PlanPreparationDraft";

const emptyDraft = (): MonitoringDraft => ({
  title: "Seguimiento inicial de actuaciones",
  trackedItems: [],
  cautions: [],
  requiresHumanValidation: true,
});

const draftWithFramework = (): MonitoringDraft => ({
  ...emptyDraft(),
  evaluationFramework: {
    evaluationResponsible: "Técnica de Salud Pública",
    evaluationQuestions: ["¿Se redujo la soledad?"],
    evaluationMoments: ["Año 2"],
    baselineNote: "Encuesta 2026",
  },
});

const noop = () => {};

// ── MonitoringPanel ────────────────────────────────────────────────────────

describe("MonitoringPanel — evaluationFramework editor (Pieza 3a)", () => {
  it("no muestra el editor cuando no se pasa onSaveEvaluationFramework", () => {
    const html = renderToStaticMarkup(
      <MonitoringPanel monitoring={emptyDraft()} />
    );
    expect(html).not.toContain("G-PLS-10");
    expect(html).not.toContain("Marco de evaluación");
  });

  it("muestra el editor cuando se pasa onSaveEvaluationFramework", () => {
    const html = renderToStaticMarkup(
      <MonitoringPanel monitoring={emptyDraft()} onSaveEvaluationFramework={noop} />
    );
    expect(html).toContain("G-PLS-10");
    expect(html).toContain("Marco de evaluación");
    expect(html).toContain("Responsable de evaluación");
    expect(html).toContain("Preguntas de evaluación");
    expect(html).toContain("Guardar marco de evaluación");
  });

  it("los campos aparecen vacíos cuando monitoring no tiene evaluationFramework", () => {
    const html = renderToStaticMarkup(
      <MonitoringPanel monitoring={emptyDraft()} onSaveEvaluationFramework={noop} />
    );
    // textarea/input values are empty → no pre-filled text beyond placeholders
    expect(html).toContain('value=""');
  });

  it("pre-rellena los campos cuando monitoring ya tiene evaluationFramework", () => {
    const html = renderToStaticMarkup(
      <MonitoringPanel monitoring={draftWithFramework()} onSaveEvaluationFramework={noop} />
    );
    expect(html).toContain("Técnica de Salud Pública");
    expect(html).toContain("¿Se redujo la soledad?");
    expect(html).toContain("Encuesta 2026");
  });

  it("el editor se muestra después de los tracked items y cautions", () => {
    const agenda = generateAgendaDraft({
      title: "Agenda inicial",
      objectives: [],
      actions: [{ id: "a1", title: "Actuación inicial", description: "", linkedObjectiveId: "obj1", relatedEvidenceIds: [], cautions: [], frameworkAlignments: [] }],
      indicators: [],
      cautions: [],
      pslReference: { pslId: "x", status: "validated", generatedAt: new Date().toISOString(), isStale: false },
      requiresHumanValidation: true,
    });
    const monitoring = generateMonitoringDraft(agenda);
    const html = renderToStaticMarkup(
      <MonitoringPanel monitoring={monitoring} onSaveEvaluationFramework={noop} />
    );
    expect(html).toContain("Actuación inicial");
    expect(html).toContain("Marco de evaluación");
    // El editor viene después de los items
    const itemPos = html.indexOf("Actuación inicial");
    const editorPos = html.indexOf("Marco de evaluación");
    expect(editorPos).toBeGreaterThan(itemPos);
  });

  it("incluye un mensaje sobre PM-8 (responsable nominal obligatorio)", () => {
    const html = renderToStaticMarkup(
      <MonitoringPanel monitoring={emptyDraft()} onSaveEvaluationFramework={noop} />
    );
    expect(html).toContain("PM-8");
  });
});

// ── DefinitiveActionPlanPreview — unaddressedNeeds ────────────────────────

const zaidinDraft = createZaidinFinalActionPlanDraft();

describe("DefinitiveActionPlanPreview — unaddressedNeeds editor (Pieza 3b)", () => {
  it("no muestra el editor cuando no se pasa onDraftChange", () => {
    const html = renderToStaticMarkup(
      <DefinitiveActionPlanPreview
        municipalityId="granada-zaidin"
        modules={[ZAIDIN_AGING_PROPOSAL]}
        drafts={[zaidinDraft]}
      />
    );
    expect(html).not.toContain("G-PLS-7");
    expect(html).not.toContain("Necesidades no priorizadas");
  });

  it("muestra el editor cuando se pasa onDraftChange y hay un draft activo", () => {
    const html = renderToStaticMarkup(
      <DefinitiveActionPlanPreview
        municipalityId="granada-zaidin"
        modules={[ZAIDIN_AGING_PROPOSAL]}
        drafts={[zaidinDraft]}
        onDraftChange={noop}
      />
    );
    expect(html).toContain("G-PLS-7");
    expect(html).toContain("Necesidades no priorizadas");
    expect(html).toContain("Ninguna necesidad quedó fuera");
    expect(html).toContain("Añadir necesidad no priorizada");
  });

  it("muestra estado 'pendiente de documentar' cuando unaddressedNeeds es undefined", () => {
    const draftWithoutNeeds = { ...zaidinDraft, unaddressedNeeds: undefined };
    const html = renderToStaticMarkup(
      <DefinitiveActionPlanPreview
        municipalityId="granada-zaidin"
        modules={[ZAIDIN_AGING_PROPOSAL]}
        drafts={[draftWithoutNeeds]}
        onDraftChange={noop}
      />
    );
    expect(html).toContain("Pendiente de documentar");
  });

  it("muestra 'ninguna quedó fuera' cuando unaddressedNeeds es []", () => {
    const draftNoneLeft = { ...zaidinDraft, unaddressedNeeds: [] };
    const html = renderToStaticMarkup(
      <DefinitiveActionPlanPreview
        municipalityId="granada-zaidin"
        modules={[ZAIDIN_AGING_PROPOSAL]}
        drafts={[draftNoneLeft]}
        onDraftChange={noop}
      />
    );
    expect(html).toContain("ninguna necesidad identificada quedó fuera");
  });

  it("muestra la lista cuando hay necesidades registradas", () => {
    const draftWithNeed = {
      ...zaidinDraft,
      unaddressedNeeds: [{
        id: "n-test",
        title: "Salud mental en jóvenes",
        justification: "Fuera del alcance de este ciclo.",
      }],
    };
    const html = renderToStaticMarkup(
      <DefinitiveActionPlanPreview
        municipalityId="granada-zaidin"
        modules={[ZAIDIN_AGING_PROPOSAL]}
        drafts={[draftWithNeed]}
        onDraftChange={noop}
      />
    );
    expect(html).toContain("Salud mental en jóvenes");
    expect(html).toContain("Fuera del alcance de este ciclo.");
    expect(html).toContain("Eliminar");
  });

  it("no muestra el editor cuando no hay drafts activos", () => {
    const html = renderToStaticMarkup(
      <DefinitiveActionPlanPreview
        municipalityId="granada-zaidin"
        modules={[ZAIDIN_AGING_PROPOSAL]}
        drafts={[]}
        onDraftChange={noop}
      />
    );
    expect(html).not.toContain("G-PLS-7");
  });

  it("los campos del formulario de añadir necesidad aparecen vacíos", () => {
    const html = renderToStaticMarkup(
      <DefinitiveActionPlanPreview
        municipalityId="granada-zaidin"
        modules={[ZAIDIN_AGING_PROPOSAL]}
        drafts={[zaidinDraft]}
        onDraftChange={noop}
      />
    );
    // Input fields should be value=""
    const idLabelPos = html.indexOf("Identificador único");
    expect(idLabelPos).toBeGreaterThan(-1);
    // There should be empty inputs after the label
    expect(html).toContain('value=""');
  });
});
