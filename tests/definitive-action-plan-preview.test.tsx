import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  cleanActionPlanProposalText,
  ZAIDIN_AGING_PROPOSAL,
  type PlanPreparationDraft,
} from "../src/domain/action-plan-catalog/PlanPreparationDraft";
import { buildDefinitiveActionPlanProjection } from "../src/domain/action-plan-catalog/DefinitiveActionPlanProjection";
import { DefinitiveActionPlanPreview } from "../src/ui/components/DefinitiveActionPlanPreview";

describe("Plan de Acción resultante", () => {
  const forbidden = [
    ["MANY", "AGES"].join(" "),
    ["ONE", "LIFE"].join(" "),
    ["MAY", "AGES"].join(" "),
    ["ZAIDÍN", "SENIOR", "FEST"].join(" "),
    ["CAMPAÑA", "FESTIVAL"].join("/"),
  ];


  it("no conserva nombres de programas o campañas en la propuesta base del Zaidín", () => {
    const source = JSON.stringify(ZAIDIN_AGING_PROPOSAL);
    for (const phrase of forbidden) {
      expect(source).not.toContain(phrase);
    }
  });

  it("incluye por defecto el indicador asociado a un objetivo incluido salvo exclusión explícita", () => {
    const baseDraft: PlanPreparationDraft = {
      municipalityId: "granada-zaidin",
      moduleId: ZAIDIN_AGING_PROPOSAL.id,
      version: ZAIDIN_AGING_PROPOSAL.version,
      updatedAt: "2026-09-14",
      decisions: {
        [ZAIDIN_AGING_PROPOSAL.id]: {
          status: "included",
          sourceText: ZAIDIN_AGING_PROPOSAL.strategicObjective,
        },
        "ENV-OG1": {
          status: "included",
          sourceText: ZAIDIN_AGING_PROPOSAL.generalObjectives[0].title,
        },
        "ENV-OE5.2": {
          status: "included",
          sourceText: "Incrementar la visibilidad de las personas mayores.",
        },
      },
    };

    const [withDefaultIndicator] = buildDefinitiveActionPlanProjection(
      "granada-zaidin",
      [ZAIDIN_AGING_PROPOSAL],
      [baseDraft]
    );
    expect(withDefaultIndicator.rows).toHaveLength(1);
    expect(withDefaultIndicator.rows[0].specific.code).toBe("ENV-OE5.2");
    expect(withDefaultIndicator.rows[0].indicatorIncluded).toBe(true);

    const [withExcludedIndicator] = buildDefinitiveActionPlanProjection(
      "granada-zaidin",
      [ZAIDIN_AGING_PROPOSAL],
      [{
        ...baseDraft,
        decisions: {
          ...baseDraft.decisions,
          "ENV-I5.2": {
            status: "excluded",
            sourceText: "Indicador de visibilidad comunitaria",
          },
        },
      }]
    );
    expect(withExcludedIndicator.rows[0].indicatorIncluded).toBe(false);
  });

  it("sanea textos antiguos guardados antes de generar el plan", () => {
    const dirty = `Incrementar la visibilidad de las personas mayores (${["CAMPAÑA", "FESTIVAL"].join("/")} ${["ZAIDÍN", "SENIOR", "FEST"].join(" ")}).`;
    const resultDraft: PlanPreparationDraft = {
      municipalityId: "granada-zaidin",
      moduleId: ZAIDIN_AGING_PROPOSAL.id,
      version: ZAIDIN_AGING_PROPOSAL.version,
      updatedAt: "2026-09-12",
      decisions: {
        [ZAIDIN_AGING_PROPOSAL.id]: {
          status: "included",
          sourceText: ZAIDIN_AGING_PROPOSAL.strategicObjective,
        },
        "ENV-OG1": {
          status: "included",
          sourceText: ZAIDIN_AGING_PROPOSAL.generalObjectives[0].title,
        },
        "ENV-OE5.2": {
          status: "modified",
          sourceText: dirty,
          text: dirty,
        },
        "ENV-I5.2": {
          status: "included",
          sourceText: "Indicador de visibilidad comunitaria",
        },
      },
    };

    const projection = buildDefinitiveActionPlanProjection(
      "granada-zaidin",
      [ZAIDIN_AGING_PROPOSAL],
      [resultDraft]
    );
    const generatedText = projection[0].rows[0].objectiveDecision?.text ?? "";
    expect(cleanActionPlanProposalText(generatedText)).toBe("Incrementar la visibilidad de las personas mayores.");
    for (const phrase of forbidden) {
      expect(JSON.stringify(projection)).not.toContain(phrase);
    }
  });
});
