import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  choicesByTarget, discardedProposals, isProfileChoices, pendingProposals, profileProposals, recordProfileChoices,
} from "../src/application/health-profile/profileChoices";
import { appendExternalProfile, EMPTY_PROFILE_LIBRARY, isExternalProfileLibrary, prepareImportedProfileRevision } from "../src/application/health-profile/externalProfiles";
import { DISCARDED_LABEL, externalProfileDocument } from "../src/application/health-profile/externalProfileDocument";
import { parseProfileStructure } from "../src/application/health-profile/profileStructure";
import type { ExternalHealthProfile } from "../src/domain/health-profile/ExternalHealthProfile";
import { ExternalProfileDashboard } from "../src/ui/components/ExternalProfileDashboard";
import { ProfileChoiceMenu } from "../src/ui/components/ProfileChoiceMenu";
import { ProfileResultsDashboard } from "../src/ui/components/ProfileResultsDashboard";
import { selectExternalProfile } from "../src/application/health-profile/selectExternalProfile";
import type { MunicipalityWorkspace } from "../src/domain/workspace";
import { externalProfileFixture } from "./helpers/externalProfileFixture";

const TEXT = [
  "5. Conclusiones",
  "Una lectura de conjunto",
  "El municipio envejece y la renta es baja.",
  "C1. La población envejece más deprisa que la provincia.",
  "El índice de envejecimiento supera al provincial.",
  "C2. La renta media es inferior a la provincial.",
  "La renta por persona queda por debajo.",
  "6. Recomendaciones",
  "R1. Conocer la soledad no deseada",
  "Conocer. Estimar la soledad no deseada con el Gestor de Encuestas.",
  "Fundamento: C1.",
  "R2. Abordar la brecha de renta",
  "Abordar. Coordinar con servicios sociales.",
  "Fundamento: C2.",
].join("\n\n");

const profile = (over: Partial<ExternalHealthProfile> = {}): ExternalHealthProfile => ({
  ...externalProfileFixture(),
  text: TEXT,
  findings: ["C1. La población envejece más deprisa que la provincia.", "C2. La renta media es inferior a la provincial."],
  areas: [{ id: "R1", title: "R1. Conocer la soledad no deseada", rationale: "Conocer · Deriva de C1" }, { id: "R2", title: "R2. Abordar la brecha de renta", rationale: "Abordar · Deriva de C2" }],
  ...over,
});
const AT = "2026-11-24T10:00:00.000Z";

describe("Menú de elección del Perfil cargado (Art. 16 ter; custodia §7)", () => {
  it("presenta las conclusiones y recomendaciones de la revisión y ninguna nace elegida", () => {
    const p = profile();
    expect(parseProfileStructure(p.text).conclusions.map(c => c.id)).toEqual(["C1", "C2"]);
    expect(profileProposals(p).map(x => `${x.kind}:${x.id}`)).toEqual(["conclusion:C1", "conclusion:C2", "recommendation:R1", "recommendation:R2"]);
    expect(pendingProposals(p)).toEqual(["C1", "C2", "R1", "R2"]);
  });

  it("registra cada decisión con autoría y fecha; el motivo solo acompaña al descarte", () => {
    const p = recordProfileChoices(profile(), [
      { target: "C1", decision: "chosen", reason: "no debe guardarse" },
      { target: "R2", decision: "discarded", reason: "  Fuera del ciclo  " },
    ], "Técnico de salud", AT);
    const m = choicesByTarget(p);
    expect(m.get("C1")).toEqual({ target: "C1", decision: "chosen", by: "Técnico de salud", at: AT });
    expect(m.get("R2")).toEqual({ target: "R2", decision: "discarded", by: "Técnico de salud", at: AT, reason: "Fuera del ciclo" });
    expect(pendingProposals(p)).toEqual(["C2", "R1"]);
    expect([...discardedProposals(p)]).toEqual(["R2"]);
    expect(p.text).toBe(TEXT);
  });

  it("una decisión nueva sustituye a la anterior sobre la misma propuesta", () => {
    const once = recordProfileChoices(profile(), [{ target: "C2", decision: "discarded" }], "A", AT);
    const twice = recordProfileChoices(once, [{ target: "C2", decision: "chosen" }], "B", "2026-11-25T10:00:00.000Z");
    expect(twice.choices).toHaveLength(1);
    expect(choicesByTarget(twice).get("C2")?.by).toBe("B");
  });

  it("no admite propuestas inexistentes, revisiones validadas o archivadas ni decisiones anónimas", () => {
    expect(() => recordProfileChoices(profile(), [{ target: "C9", decision: "chosen" }], "A", AT)).toThrow(/C9/);
    expect(() => recordProfileChoices(profile({ status: "validated", validatedBy: "A", validatedAt: AT }), [{ target: "C1", decision: "chosen" }], "A", AT)).toThrow(/validada/);
    expect(() => recordProfileChoices(profile({ archivedAt: AT }), [{ target: "C1", decision: "chosen" }], "A", AT)).toThrow(/archivada/);
    expect(() => recordProfileChoices(profile(), [{ target: "C1", decision: "chosen" }], "  ", AT)).toThrow(/Identifícate/);
  });

  it("ignora elecciones de propuestas que ya no figuran en el texto", () => {
    const p = profile({ choices: [{ target: "C7", decision: "chosen", by: "A", at: AT }] });
    expect(choicesByTarget(p).size).toBe(0);
    expect(pendingProposals(p)).toHaveLength(4);
  });

  it("si el texto no las estructura, toma las conclusiones y recomendaciones identificadas del paquete", () => {
    const p = profile({ text: "Texto sin apartados." });
    expect(profileProposals(p).map(x => x.id)).toEqual(["C1", "C2", "R1", "R2"]);
    expect(profileProposals(externalProfileFixture())).toEqual([]);
  });

  it("la biblioteca solo acepta elecciones bien formadas y no repetidas", () => {
    const ok = recordProfileChoices(profile(), [{ target: "C1", decision: "chosen" }], "A", AT);
    const lib = appendExternalProfile(EMPTY_PROFILE_LIBRARY, ok, [], ok.municipalityId);
    expect(isExternalProfileLibrary(lib, ok.municipalityId)).toBe(true);
    expect(isProfileChoices([{ target: "C1", decision: "maybe", by: "A", at: AT }])).toBe(false);
    expect(isProfileChoices([{ target: "C1", decision: "chosen", by: "A", at: AT }, { target: "C1", decision: "discarded", by: "A", at: AT }])).toBe(false);
    const bad = { ...lib, profiles: [{ ...ok, choices: [{ target: "X1", decision: "chosen", by: "A", at: AT }] }] };
    expect(isExternalProfileLibrary(bad, ok.municipalityId)).toBe(false);
  });

  it("una revisión cargada no trae elecciones, aunque el archivo las incluya", () => {
    const withChoices = profile({ choices: [{ target: "C1", decision: "chosen", by: "A", at: AT }] });
    expect(prepareImportedProfileRevision(withChoices).choices).toBeUndefined();
    expect(prepareImportedProfileRevision(withChoices, { id: "anterior" }).choices).toBeUndefined();
  });

  it("lo descartado se rotula en la pantalla y en Word, sin suprimir texto", () => {
    const p = recordProfileChoices(profile(), [{ target: "C2", decision: "discarded" }, { target: "R1", decision: "discarded" }], "A", AT);
    const html = renderToStaticMarkup(createElement(ProfileResultsDashboard, { profile: p, municipalityName: "Municipio de pruebas", structure: parseProfileStructure(p.text), discarded: discardedProposals(p) }));
    expect(html.match(/Descartada por el equipo técnico/g)).toHaveLength(2);
    expect(html).toContain("La renta media es inferior a la provincial.");
    const doc = externalProfileDocument(p, "Municipio de pruebas");
    const paragraphs = doc.sections.flatMap(s => s.paragraphs);
    expect(paragraphs).toContain(`${DISCARDED_LABEL} C2. La renta media es inferior a la provincial.`);
    expect(paragraphs).toContain(`${DISCARDED_LABEL} R1. Conocer la soledad no deseada`);
    expect(paragraphs).toContain("C1. La población envejece más deprisa que la provincia.");
  });

  it("el menú muestra el recuento, las decisiones guardadas y se cierra en una revisión validada", () => {
    const p = recordProfileChoices(profile(), [{ target: "C1", decision: "chosen" }, { target: "R2", decision: "discarded", reason: "Fuera del ciclo" }], "Técnico", AT);
    const html = renderToStaticMarkup(createElement(ProfileChoiceMenu, { profile: p, authorName: "Técnico", busy: false, onSave: () => {} }));
    expect(html).toContain("2 de 4 resueltas");
    expect(html).toContain("Elegida por Técnico");
    expect(html).toContain("Descartada por Técnico");
    expect(html).toContain("Fuera del ciclo");
    expect(html).toContain("Guardar la elección en Firebase");
    const closed = renderToStaticMarkup(createElement(ProfileChoiceMenu, { profile: { ...p, status: "validated", validatedBy: "Técnico", validatedAt: AT }, authorName: "Técnico", busy: false, onSave: () => {} }));
    expect(closed).toContain("elección cerrada");
    expect(closed).not.toContain("Guardar la elección en Firebase");
    const empty = renderToStaticMarkup(createElement(ProfileChoiceMenu, { profile: externalProfileFixture(), authorName: "Técnico", busy: false, onSave: () => {} }));
    expect(empty).toContain("No hay nada que elegir");
  });

  it("lo descartado no pasa a la planificación del Perfil vigente", () => {
    const p = recordProfileChoices(profile(), [{ target: "R2", decision: "discarded" }, { target: "C2", decision: "discarded" }], "A", AT);
    const ws = { municipality: { identity: { id: p.municipalityId } }, createdAt: AT, externalProfileLibrary: { profiles: [p], attachments: [], activeId: p.id } } as unknown as MunicipalityWorkspace;
    const psl = selectExternalProfile(ws);
    expect(psl.priorizacion.candidaturasTecnicas.map(c => c.id)).toEqual(["R1"]);
    expect(psl.qualitativeFindingCount).toBe(1);
  });

  it("la pestaña del Perfil ofrece el espacio de elección con su recuento", () => {
    const p = profile();
    const html = renderToStaticMarkup(createElement(ExternalProfileDashboard, { municipalityId: p.municipalityId, municipalityName: "Municipio de pruebas", library: { profiles: [p], attachments: [], activeId: p.id }, authorName: "Pruebas", onSave: async () => {} }));
    expect(html).toContain("Elección del equipo técnico");
  });
});
