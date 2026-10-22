/**
 * Prueba de singularidad (F18, prueba de aceptación 6): expedientes distintos no dan
 * el mismo conjunto de unidades ni las mismas propuestas, y Granada-Zaidín no cambia
 * sin justificación.
 *
 * Alcance: Granada-Zaidín entra con el fixture sintético del repositorio. Los expedientes
 * reales de Zagra y Atarfe no están en el repositorio y no se copian a él (fixtures/workspaces/README.md):
 * aquí se representan con dos expedientes de la misma forma (Zagra: Informe + priorización
 * ciudadana, sin activos; Atarfe: Informe + activos, sin priorización). La comprobación sobre
 * los expedientes reales se hace en la aplicación, no en esta prueba.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  buildCanonicalReadingUnits,
  deriveReadingUnits,
  readLocalizaAssets,
  type LocalizaAssetRecord,
} from "../src/application/localiza-assets";
import { buildReadingUnitProposals } from "../src/application/proposals";
import { THEMATIC_TOPICS, type ThematicPrioritisationStudy } from "../src/domain/thematic-prioritisation";

const FIXTURE = resolve(dirname(fileURLToPath(import.meta.url)), "../fixtures/workspaces/granada-zaidin-synthetic-test.json");

function collect(node: unknown, out: Array<{ id: string; kind: string; title: string; content: string }> = []) {
  if (Array.isArray(node)) node.forEach((n) => collect(n, out));
  else if (node && typeof node === "object") {
    const o = node as Record<string, unknown>;
    if (o.kind === "asset" && typeof o.content === "string" && typeof o.id === "string")
      out.push({ id: o.id, kind: "asset", title: String(o.title ?? ""), content: o.content });
    Object.values(o).forEach((v) => collect(v, out));
  }
  return out;
}

const asset = (atomId: string, tematicas: string[]): LocalizaAssetRecord => ({
  atomId, nombre: atomId, descripcion: "", acceso: "Cualquiera", poblacionDestinataria: [], tematicas,
  municipio: "X", localidad: "X", estado: "registrado-en-localiza",
});

function study(votes: Record<string, number>): ThematicPrioritisationStudy {
  const ranking = THEMATIC_TOPICS.map((t) => ({ topicId: t.id, redcapColumn: "", label: t.label, votes: votes[t.id] ?? 0, pct: 0, rank: 0 }))
    .sort((a, b) => b.votes - a.votes)
    .map((r, i) => ({ ...r, rank: i + 1 }));
  return { municipalityId: "t", sourceFileName: "t.csv", importedAt: "2026-10-21", totalRecords: 40, completeRecords: 40, ranking, topFiveTopicIds: ranking.slice(0, 5).map((r) => r.topicId), methodologicalCautions: [] };
}

const zaidinAssets = readLocalizaAssets(collect(JSON.parse(readFileSync(FIXTURE, "utf8")))).records;

const cases = {
  zaidin: deriveReadingUnits({ assets: zaidinAssets, informeSignals: [{ dimension: "actividad física y sedentarismo", menciones: 4 }] }),
  zagraForma: deriveReadingUnits({
    assets: [],
    study: study({ "actividad-fisica": 12, "sueno-descanso": 9, accidentes: 6 }),
    informeSignals: [{ dimension: "actividad física y sedentarismo", menciones: 2 }],
  }),
  atarfeForma: deriveReadingUnits({
    assets: [asset("a1", ["Alimentación saludable"]), asset("a2", ["Actividad física"])],
    informeSignals: [{ dimension: "alimentación, sobrepeso y obesidad", menciones: 5 }],
  }),
};

const shape = (d: ReturnType<typeof deriveReadingUnits>) => d.units.map((u) => `${u.topicId}:${u.crossing}`).sort();
const proposalIds = (d: ReturnType<typeof deriveReadingUnits>) =>
  buildReadingUnitProposals(buildCanonicalReadingUnits(d, 0)).map((p) => p.id).sort();

describe("singularidad de los expedientes", () => {
  it("los tres expedientes dan conjuntos de unidades distintos", () => {
    const [a, b, c] = [shape(cases.zaidin), shape(cases.zagraForma), shape(cases.atarfeForma)];
    expect(a).not.toEqual(b);
    expect(a).not.toEqual(c);
    expect(b).not.toEqual(c);
  });

  it("y propuestas distintas: ninguna decisión sobre un expediente se aplica a otro por coincidir el texto", () => {
    const [a, b, c] = [proposalIds(cases.zaidin), proposalIds(cases.zagraForma), proposalIds(cases.atarfeForma)];
    // Pueden coincidir en un patrón (misma unidad y mismo cruce), pero nunca ser el mismo conjunto.
    expect(a).not.toEqual(b);
    expect(a).not.toEqual(c);
    expect(b).not.toEqual(c);
  });

  it("la derivación no depende del nombre del municipio: mismo expediente, mismas unidades", () => {
    const again = deriveReadingUnits({ assets: [], study: { ...study({ "actividad-fisica": 12, "sueno-descanso": 9, accidentes: 6 }), municipalityId: "otro-nombre" }, informeSignals: [{ dimension: "actividad física y sedentarismo", menciones: 2 }] });
    expect(shape(again)).toEqual(shape(cases.zagraForma));
  });

  it("Granada-Zaidín (referencia): sus unidades y sus lagunas no cambian sin justificación", () => {
    expect(zaidinAssets).toHaveLength(56);
    expect(cases.zaidin.units.length).toBe(shape(cases.zaidin).length);
    expect(shape(cases.zaidin)).toMatchInlineSnapshot(`
      [
        "actividad-fisica:activo-registrado-sin-voz",
        "alimentacion:activo-registrado-sin-voz",
        "bienestar-emocional:activo-registrado-sin-voz",
        "medioambiente:activo-registrado-sin-voz",
        "sexualidad-salud:activo-registrado-sin-voz",
      ]
    `);
    expect(cases.zaidin.topicsWithoutSource).toMatchInlineSnapshot(`
      [
        "pantallas-redes",
        "sueno-descanso",
        "tabaco-alcohol-drogas",
        "violencia-genero",
        "accidentes",
      ]
    `);
  });
});
