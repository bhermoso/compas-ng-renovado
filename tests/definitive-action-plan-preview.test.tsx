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

  it("muestra El Zaidín con redacciones modificadas sin reactivar el texto histórico", () => {
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
          status: "modified",
          sourceText: ZAIDIN_AGING_PROPOSAL.generalObjectives[0].title,
          text: "Reducir el edadismo y reforzar el reconocimiento social de las personas mayores.",
        },
        "ENV-OE5.1": {
          status: "excluded",
          sourceText: "Reducir actitudes edadistas",
        },
        "ENV-OE5.2": {
          status: "modified",
          sourceText: "Incrementar la visibilidad de las personas mayores.",
          text: "Incrementar la visibilidad de las personas mayores como personas capaces, diversas y socialmente activas en las iniciativas comunitarias del Zaidín.",
        },
        "ENV-I5.2": {
          status: "included",
          sourceText: "Indicador de visibilidad comunitaria",
        },
        "ENV-OE1.2": {
          status: "included",
          sourceText: "Bienestar emocional",
        },
        "ENV-I1.2": {
          status: "included",
          sourceText: "Indicador de bienestar emocional",
        },
        "ENV-OE7.1": {
          status: "included",
          sourceText: "Coordinación comunitaria",
        },
        "ENV-I7.1": {
          status: "included",
          sourceText: "Indicador de coordinación comunitaria",
        },
      },
    };

    const projection = buildDefinitiveActionPlanProjection(
      "granada-zaidin",
      [ZAIDIN_AGING_PROPOSAL],
      [resultDraft]
    );
    expect(projection[0].rows.map(row => row.specific.code)).toEqual([
      "ENV-OE5.2",
      "ENV-OE1.2",
      "ENV-OE7.1",
    ]);

    const html = renderToStaticMarkup(
      <DefinitiveActionPlanPreview
        municipalityId="granada-zaidin"
        modules={[ZAIDIN_AGING_PROPOSAL]}
        drafts={[resultDraft]}
      />
    );

    expect(html).toContain("Plan de Acción resultante · El Zaidín");
    expect(html).toContain("Generar Plan de Acción");
    expect(html).toContain("Selección preparada");
    expect(projection[0].rows[0].objectiveDecision?.status).toBe("modified");
    expect(projection[0].rows[0].objectiveDecision?.text).toBe(
      "Incrementar la visibilidad de las personas mayores como personas capaces, diversas y socialmente activas en las iniciativas comunitarias del Zaidín."
    );
    expect(projection[0].rows.some(row => row.specific.code === "ENV-OE5.1")).toBe(false);
    expect(resultDraft.decisions["ENV-OE5.2"].status).toBe("modified");
  });

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
