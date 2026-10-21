import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { deriveReadingUnits, readLocalizaAssets, type LocalizaAssetRecord } from "../src/application/localiza-assets";
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

const zaidinAssets = readLocalizaAssets(collect(JSON.parse(readFileSync(FIXTURE, "utf8")))).records;

function asset(atomId: string, nombre: string, tematicas: string[]): LocalizaAssetRecord {
  return { atomId, nombre, descripcion: "", acceso: "Cualquiera", poblacionDestinataria: [], tematicas, municipio: "X", localidad: "X", estado: "registrado-en-localiza" };
}

function study(votes: Record<string, number>): ThematicPrioritisationStudy {
  const ranking = THEMATIC_TOPICS.map((t) => ({ topicId: t.id, redcapColumn: "", label: t.label, votes: votes[t.id] ?? 0, pct: 0, rank: 0 }))
    .sort((a, b) => b.votes - a.votes)
    .map((r, i) => ({ ...r, rank: i + 1 }));
  return { municipalityId: "t", sourceFileName: "t.csv", importedAt: "2026-10-21", totalRecords: 10, completeRecords: 10, ranking, topFiveTopicIds: ranking.slice(0, 5).map((r) => r.topicId), methodologicalCautions: [] };
}

describe("derivación de unidades de lectura", () => {
  it("sin activos ni estudio no hay unidades: todos los temas son lagunas", () => {
    const d = deriveReadingUnits({ assets: [] });
    expect(d.units).toHaveLength(0);
    expect(d.topicsWithoutSource).toHaveLength(THEMATIC_TOPICS.length);
    expect(d.voiceSourceAvailable).toBe(false);
  });

  it("una unidad por tema sostenido, con el cruce que permite la evidencia", () => {
    const d = deriveReadingUnits({
      assets: [asset("a1", "Club de marcha", ["Actividad física"])],
      study: study({ "actividad-fisica": 6, "sueno-descanso": 3 }),
    });
    const porTema = new Map(d.units.map((u) => [u.topicId, u]));
    expect(porTema.get("actividad-fisica")?.crossing).toBe("voz-y-activo-registrado");
    expect(porTema.get("sueno-descanso")?.crossing).toBe("voz-sin-activo-registrado");
    expect(d.units.map((u) => u.topicId).sort()).toEqual(["actividad-fisica", "sueno-descanso"]);
    expect(d.units.every((u) => u.documentedNeed === "no-disponible-solo-presencia-textual")).toBe(true);
  });

  it("activo con correspondencia validada y sin voz: unidad «activo registrado sin voz»", () => {
    const d = deriveReadingUnits({ assets: [asset("a1", "Huerto", ["Alimentación saludable"])], study: study({ accidentes: 2 }) });
    expect(d.units.find((u) => u.topicId === "alimentacion")?.crossing).toBe("activo-registrado-sin-voz");
  });

  it("los activos sin correspondencia validada no cuentan en ninguna unidad", () => {
    const d = deriveReadingUnits({ assets: [asset("a1", "Peña cultural", ["Cultura y ocio"]), asset("a2", "Mayores", ["Envejecimiento activo"])] });
    expect(d.units).toHaveLength(0);
    expect(d.assetsWithoutValidatedCorrespondence.map((a) => a.atomId)).toEqual(["a1", "a2"]);
  });

  it("Género/identidad sostiene dos unidades y ninguna de violencia de género", () => {
    const d = deriveReadingUnits({ assets: [asset("a1", "CEJOS", ["Género/identidad"])] });
    expect(d.units.map((u) => u.topicId).sort()).toEqual(["bienestar-emocional", "sexualidad-salud"]);
  });

  it("Zaidín: cada activo con correspondencia aparece en sus temas; el resto queda aparte", () => {
    const d = deriveReadingUnits({ assets: zaidinAssets });
    const conCorrespondencia = zaidinAssets.length - d.assetsWithoutValidatedCorrespondence.length;
    expect(zaidinAssets).toHaveLength(56);
    expect(conCorrespondencia).toBeGreaterThan(0);
    expect(d.units.find((u) => u.topicId === "bienestar-emocional")?.capacity.assets.length).toBeGreaterThan(40);
    expect(d.topicsWithoutSource).toContain("violencia-genero");
  });

  it("singularidad: dos expedientes distintos no producen el mismo conjunto de unidades", () => {
    const a = deriveReadingUnits({ assets: [asset("a", "A", ["Actividad física"])], study: study({ "actividad-fisica": 4 }) });
    const b = deriveReadingUnits({ assets: [asset("b", "B", ["Alimentación saludable"])], study: study({ alimentacion: 4 }) });
    expect(a.units.map((u) => u.topicId)).not.toEqual(b.units.map((u) => u.topicId));
  });

  it("el Informe se añade como plano a una unidad ya sostenida, con su estatuto de presencia textual", () => {
    const d = deriveReadingUnits({
      assets: [asset("a1", "Club de marcha", ["Actividad física"])],
      informeSignals: [{ dimension: "actividad física y sedentarismo", menciones: 7 }],
    });
    const u = d.units.find((x) => x.topicId === "actividad-fisica")!;
    expect(u.informe).toEqual({ dimensions: [{ dimension: "actividad física y sedentarismo", menciones: 7 }], status: "presencia-textual" });
  });

  it("un tema tratado solo por el Informe no crea unidad", () => {
    const d = deriveReadingUnits({
      assets: [],
      informeSignals: [{ dimension: "consumos de tabaco y alcohol", menciones: 3 }],
    });
    expect(d.units).toHaveLength(0);
    expect(d.topicsOnlyInInforme).toEqual(["tabaco-alcohol-drogas"]);
    expect(d.topicsWithoutSource).not.toContain("tabaco-alcohol-drogas");
  });

  it("una dimensión sin correspondencia validada no se asocia a ningún tema", () => {
    const d = deriveReadingUnits({
      assets: [asset("a1", "Club de marcha", ["Actividad física"])],
      informeSignals: [{ dimension: "envejecimiento y dependencia", menciones: 20 }],
    });
    expect(d.units.find((x) => x.topicId === "actividad-fisica")?.informe).toBeNull();
  });
});
