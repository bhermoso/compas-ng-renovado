import { describe, expect, it } from "vitest";
import {
  buildProcessPresentation, conclusionHeadline, parseSpanishNumber, recommendationLabel,
} from "../src/application/process/processPresentation";
import { isProcessMilestone, sortMilestones, type ProcessMilestone } from "../src/domain/process/ProcessMilestone";
import { readProcessPresentationPackage } from "../src/domain/process/ProcessPresentationPackage";
import { createCompleteMunicipalityWorkspace } from "../src/application/workspace";
import { parseWorkspaceJSON, serializeWorkspaceForStorage } from "../src/infrastructure/persistence/local-storage";
import type { MunicipalityWorkspace } from "../src/domain/workspace";

const result = (over: Record<string, unknown>) => ({ unit: "%", source: "Fuente", page: "", period: "2024", caution: "", scale: "Municipio", ...over });

function workspace(extra: Partial<MunicipalityWorkspace> = {}): MunicipalityWorkspace {
  return {
    municipality: { identity: { id: "villa", name: "Villa", province: "Granada" } },
    createdAt: "2026-01-01",
    externalProfileLibrary: {
      activeId: "p1",
      profiles: [{
        schema: "compas-external-profile/v1", id: "p1", municipalityId: "villa", title: "Perfil de Villa · revisión 1.0",
        period: "", author: "", createdAt: "2026-11-01", status: "validated", validatedAt: "2026-11-24T18:00:00.000Z",
        summary: "", text: "", limitations: [], attachmentIds: [],
        results: [
          result({ id: "asma", title: "Asma", value: "1.508,96", unit: "casos por 10.000 hab.", topic: "Morbilidad crónica" }),
          result({ id: "renta", title: "Renta", value: "11.730", unit: "euros", topic: "Renta" }),
          result({ id: "villa-territorial-18000-age65plusPct2025", title: "Población de 65 o más", value: "13,40", period: "2025", topic: "Territorio", comparisons: [{ label: "Provincia", value: 19.95 }] }),
          result({ id: "villa-territorial-18000-age65plusPct2025-s", title: "Sección", value: "1", scale: "Sección censal 1800001001" }),
          result({ id: "ts-ieca-paro-mujeres", title: "Paro (mujeres)", value: "23,7", period: "2025" }),
          result({ id: "ts-ieca-paro-hombres", title: "Paro (hombres)", value: "13,5", period: "2025" }),
          result({ id: "ts-ieca-seccion-tasa-desempleo-1800001001", title: "Tasa de desempleo registrado", value: "23,0" }),
          result({ id: "ts-ieca-seccion-tasa-desempleo-1800001002", title: "Tasa de desempleo registrado", value: "35,4" }),
        ],
        findings: [
          "C1. Villa es un municipio joven. En 2025 el 17,9 % tiene menos de 15 años [T1]. Lleva a R1.",
          "C2. Conclusión descartada. Texto. Lleva a R2.",
        ],
        areas: [
          { id: "R1", title: "R1. Bienestar emocional. Tratar el bienestar. Permite decidir.", rationale: "Abordar · Deriva de C1, C2" },
          { id: "R2", title: "R2. Otra. Texto.", rationale: "Conocer · Deriva de C2" },
        ],
        choices: [
          { target: "C1", decision: "chosen", by: "T", at: "2026-11-24" },
          { target: "C2", decision: "discarded", by: "T", at: "2026-11-24" },
          { target: "R1", decision: "chosen", by: "T", at: "2026-11-24" },
          { target: "R2", decision: "discarded", by: "T", at: "2026-11-24" },
        ],
      }],
    },
    ...extra,
  } as unknown as MunicipalityWorkspace;
}

describe("presentación del proceso", () => {
  it("proyecta una presentación guardada de la revisión vigente y conserva la elección explícita", () => {
    const ws = workspace();
    const profile = { ...ws.externalProfileLibrary!.profiles[0], status: "review" as const, validatedAt: undefined };
    profile.choices = profile.choices?.filter(choice => choice.target !== "R1");
    const document = {
      schema: "compas-process-presentation/v1", municipalityId: "villa", profileTitle: profile.title,
      pages: [{ kind: "table", title: "Informe de Salud", source: "Informe de ensayo, tabla 3",
        columns: ["Patología", "Villa", "Provincia"], rows: [["Asma", "1.508,96", "1.003,2"]] }],
    };
    const processPresentation = { ...readProcessPresentationPackage(JSON.stringify(document)), profileId: profile.id };
    const complete = createCompleteMunicipalityWorkspace({ id: "villa", name: "Villa" });
    const externalProfileLibrary = { activeId: profile.id, profiles: [profile], attachments: [] };
    const restored = parseWorkspaceJSON(serializeWorkspaceForStorage({ ...complete, externalProfileLibrary, processPresentation }));
    expect(restored?.processPresentation).toEqual(processPresentation);
    const slides = buildProcessPresentation(restored!);
    expect(slides[0]).toMatchObject({ type: "cover", inReview: true });
    expect(slides.find(slide => slide.type === "documentary-page")?.page).toEqual(document.pages[0]);
    expect(slides.some(slide => slide.type === "figures" || slide.type === "recommendations")).toBe(false);
    expect(slides.at(-1)).toMatchObject({ goToPrioritization: true, pendingChoices: 1 });
    expect(buildProcessPresentation({ ...restored!, processPresentation: { ...processPresentation, profileId: "anterior" } })
      .some(slide => slide.type === "documentary-page")).toBe(false);
    expect(buildProcessPresentation({ ...restored!, processPresentation: { ...processPresentation, municipalityId: "otra" } })
      .some(slide => slide.type === "documentary-page")).toBe(false);
  });

  it("rechaza las tablas con filas que no corresponden a sus encabezados", () => {
    const raw = { schema: "compas-process-presentation/v1", municipalityId: "villa", profileTitle: "Perfil",
      pages: [{ kind: "table", title: "Informe", source: "Fuente", columns: ["Indicador", "Villa"], rows: [["Asma"]] }] };
    expect(() => readProcessPresentationPackage(JSON.stringify(raw))).toThrow(/formato de presentación/);
  });

  it("lee números con el formato español de la fuente", () => {
    expect(parseSpanishNumber("1.508,96")).toBe(1508.96);
    expect(parseSpanishNumber("+16,4")).toBe(16.4);
    expect(parseSpanishNumber("*")).toBeUndefined();
  });

  it("toma la primera frase de cada conclusión y el nombre y tipo de cada recomendación", () => {
    expect(conclusionHeadline("C1. Villa es un municipio joven. En 2025 el 17,9 %.")).toEqual({ id: "C1", headline: "Villa es un municipio joven." });
    expect(conclusionHeadline("C4. Las mujeres (C3). En 2025…").headline).toBe("Las mujeres (C3).");
    expect(recommendationLabel({ id: "R1", title: "R1. Bienestar emocional. Tratar…", rationale: "Abordar · Deriva de C3" })).toEqual({ id: "R1", name: "Bienestar emocional", kind: "Abordar" });
  });

  it("solo muestra conclusiones y recomendaciones elegidas, con los valores tal como los publica la fuente", () => {
    const slides = buildProcessPresentation(workspace());
    const conclusions = slides.find((s) => s.type === "conclusions");
    const recs = slides.find((s) => s.type === "recommendations");
    expect(conclusions && conclusions.type === "conclusions" && conclusions.items.map((c) => c.id)).toEqual(["C1"]);
    expect(recs && recs.type === "recommendations" && recs.items.map((r) => r.id)).toEqual(["R1"]);
    const figures = slides.find((s) => s.type === "figures");
    expect(figures && figures.type === "figures" && figures.figures.map((f) => f.value)).toEqual(["1.508,96"]);
    const comparison = slides.find((s) => s.type === "comparison");
    expect(comparison && comparison.type === "comparison" && comparison.rows.map((r) => r.id)).toEqual(["villa-territorial-18000-age65plusPct2025"]);
    const pairs = slides.find((s) => s.type === "pairs");
    expect(pairs && pairs.type === "pairs" && pairs.rows[0].women.value).toBe("23,7");
    const sections = slides.find((s) => s.type === "sections");
    expect(sections && sections.type === "sections" && sections.bars.map((b) => b.section)).toEqual(["01001", "01002"]);
    expect(slides[0].type).toBe("cover");
    expect(slides[slides.length - 1].type).toBe("closing");
  });

  it("ordena los hitos registrados y añade la validación del Perfil", () => {
    const milestones: ProcessMilestone[] = [
      { id: "b", kind: "priorizacion", date: "2026-11-26", title: "Sesión del Grupo Motor", createdAt: "2026-11-25" },
      { id: "a", kind: "impulso", date: "2026-02-27", title: "Taller de impulso", createdAt: "2026-11-25" },
    ];
    const slides = buildProcessPresentation(workspace({ processMilestones: milestones }));
    const timeline = slides.find((s) => s.type === "timeline");
    expect(timeline && timeline.type === "timeline" && timeline.items.map((i) => i.date)).toEqual(["2026-02-27", "2026-11-24", "2026-11-26"]);
  });

  it("sin Perfil vigente ni hitos, solo portada y cierre", () => {
    const slides = buildProcessPresentation({ municipality: { identity: { id: "x", name: "X" } } } as unknown as MunicipalityWorkspace);
    expect(slides.map((s) => s.type)).toEqual(["cover", "closing"]);
  });

  it("valida la forma de un hito", () => {
    const ok = { id: "1", kind: "impulso", date: "2026-02-27", title: "Taller", createdAt: "2026-11-25" };
    expect(isProcessMilestone(ok)).toBe(true);
    expect(isProcessMilestone({ ...ok, date: "27/02/2026" })).toBe(false);
    expect(isProcessMilestone({ ...ok, kind: "fiesta" })).toBe(false);
    expect(sortMilestones([{ ...ok, id: "2", date: "2026-03-01" } as ProcessMilestone, ok as ProcessMilestone]).map((m) => m.id)).toEqual(["1", "2"]);
  });
});

describe("reparto de conclusiones", () => {
  it("reparte nueve conclusiones en tres diapositivas de tres", () => {
    const ws = workspace();
    const profile = ws.externalProfileLibrary!.profiles[0];
    profile.findings = Array.from({ length: 9 }, (_, i) => `C${i + 1}. Conclusión ${i + 1}. Texto.`);
    profile.choices = profile.findings.map((_, i) => ({ target: `C${i + 1}`, decision: "chosen", by: "T", at: "x" })) as typeof profile.choices;
    const sizes = buildProcessPresentation(ws).filter((s) => s.type === "conclusions").map((s) => s.type === "conclusions" ? s.items.length : 0);
    expect(sizes).toEqual([3, 3, 3]);
  });
});
