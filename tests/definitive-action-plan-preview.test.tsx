import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  cleanActionPlanProposalText,
  AGING_FOUR_BLOCKS_BASE,
  type PlanPreparationDraft,
} from "../src/domain/action-plan-catalog/PlanPreparationDraft";
import { buildDefinitiveActionPlanProjection } from "../src/domain/action-plan-catalog/DefinitiveActionPlanProjection";
import { DefinitiveActionPlanPreview } from "../src/ui/components/DefinitiveActionPlanPreview";

describe("Plan de Acción resultante", () => {
  const forbidden = [
    ["MANY", "AGES"].join(" "),
    ["ONE", "LIFE"].join(" "),
    ["MAY", "AGES"].join(" "),
    ["CENTRO", "SENIOR", "FEST"].join(" "),
    ["CAMPAÑA", "FESTIVAL"].join("/"),
  ];


  it("no conserva nombres de programas o campañas en la propuesta base del Centro", () => {
    const source = JSON.stringify(AGING_FOUR_BLOCKS_BASE);
    for (const phrase of forbidden) {
      expect(source).not.toContain(phrase);
    }
  });

  it("incluye por defecto el indicador asociado a un objetivo incluido salvo exclusión explícita", () => {
    const baseDraft: PlanPreparationDraft = {
      municipalityId: "municipio-ensayo",
      moduleId: AGING_FOUR_BLOCKS_BASE.id,
      version: AGING_FOUR_BLOCKS_BASE.version,
      updatedAt: "2026-09-14",
      decisions: {
        [AGING_FOUR_BLOCKS_BASE.id]: {
          status: "included",
          sourceText: AGING_FOUR_BLOCKS_BASE.strategicObjective,
        },
        "ENV-OG1": {
          status: "included",
          sourceText: AGING_FOUR_BLOCKS_BASE.generalObjectives[0].title,
        },
        "ENV-OE5.2": {
          status: "included",
          sourceText: "Incrementar la visibilidad de las personas mayores.",
        },
      },
    };

    const [withDefaultIndicator] = buildDefinitiveActionPlanProjection(
      "municipio-ensayo",
      [AGING_FOUR_BLOCKS_BASE],
      [baseDraft]
    );
    expect(withDefaultIndicator.rows).toHaveLength(1);
    expect(withDefaultIndicator.rows[0].specific.code).toBe("ENV-OE5.2");
    expect(withDefaultIndicator.rows[0].indicatorIncluded).toBe(true);

    const [withExcludedIndicator] = buildDefinitiveActionPlanProjection(
      "municipio-ensayo",
      [AGING_FOUR_BLOCKS_BASE],
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
    const dirty = `Incrementar la visibilidad de las personas mayores (${["CAMPAÑA", "FESTIVAL"].join("/")} ${["CENTRO", "SENIOR", "FEST"].join(" ")}).`;
    const resultDraft: PlanPreparationDraft = {
      municipalityId: "municipio-ensayo",
      moduleId: AGING_FOUR_BLOCKS_BASE.id,
      version: AGING_FOUR_BLOCKS_BASE.version,
      updatedAt: "2026-09-12",
      decisions: {
        [AGING_FOUR_BLOCKS_BASE.id]: {
          status: "included",
          sourceText: AGING_FOUR_BLOCKS_BASE.strategicObjective,
        },
        "ENV-OG1": {
          status: "included",
          sourceText: AGING_FOUR_BLOCKS_BASE.generalObjectives[0].title,
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
      "municipio-ensayo",
      [AGING_FOUR_BLOCKS_BASE],
      [resultDraft]
    );
    const generatedText = projection[0].rows[0].objectiveDecision?.text ?? "";
    expect(cleanActionPlanProposalText(generatedText)).toBe("Incrementar la visibilidad de las personas mayores.");
    for (const phrase of forbidden) {
      expect(JSON.stringify(projection)).not.toContain(phrase);
    }
  });
});
