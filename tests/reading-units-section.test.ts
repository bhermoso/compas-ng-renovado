import { describe, expect, it } from "vitest";
import { buildCanonicalReadingUnits, deriveReadingUnits, type LocalizaAssetRecord } from "../src/application/localiza-assets";
import { THEMATIC_TOPICS, type ThematicPrioritisationStudy } from "../src/domain/thematic-prioritisation";

const asset = (id: string, nombre: string, tematicas: string[]): LocalizaAssetRecord => ({
  atomId: id, nombre, descripcion: "", acceso: "Cualquiera", poblacionDestinataria: [], tematicas, municipio: "X", localidad: "X", estado: "registrado-en-localiza",
});

function study(votes: Record<string, number>): ThematicPrioritisationStudy {
  const ranking = THEMATIC_TOPICS.map((t) => ({ topicId: t.id, redcapColumn: "", label: t.label, votes: votes[t.id] ?? 0, pct: (votes[t.id] ?? 0) * 10, rank: 0 }))
    .sort((a, b) => b.votes - a.votes).map((r, i) => ({ ...r, rank: i + 1 }));
  return { municipalityId: "t", sourceFileName: "t.csv", importedAt: "2026-10-21", totalRecords: 10, completeRecords: 10, ranking, topFiveTopicIds: ranking.slice(0, 5).map((r) => r.topicId), methodologicalCautions: [] };
}

describe("sección «Lectura por tema»", () => {
  it("sin unidades no hay sección: los documentos de expedientes sin estas fuentes no cambian", () => {
    expect(buildCanonicalReadingUnits(deriveReadingUnits({ assets: [] }), 0)).toBeUndefined();
  });

  it("redacta hechos de cada fuente y declara el cruce, sin valorar ni recomendar", () => {
    const d = deriveReadingUnits({
      assets: [asset("a1", "Club de marcha", ["Actividad física"])],
      study: study({ "actividad-fisica": 6, "sueno-descanso": 3 }),
      informeSignals: [{ dimension: "actividad física y sedentarismo", menciones: 7 }],
    });
    const s = buildCanonicalReadingUnits(d, 0)!;
    const af = s.units.find((u) => u.topicId === "actividad-fisica")!;
    expect(af.lines[0]).toBe("Priorización ciudadana: 6 de 10 papeletas completas (60 %), posición 1 de 10.");
    expect(af.lines[1]).toContain("1 activo con correspondencia validada (Club de marcha)");
    expect(af.lines[2]).toContain("presencia textual (actividad física y sedentarismo: 7 menciones)");
    expect(af.crossingStatement).toContain("Localiza registra activos");
    const sueno = s.units.find((u) => u.topicId === "sueno-descanso")!;
    expect(sueno.crossingStatement).toContain("laguna del mapa de activos, no la ausencia del recurso");
    expect(JSON.stringify(s)).not.toMatch(/se recomienda|debería|prioridad alta|urgente/i);
  });

  it("declara las lagunas: sin priorización, activos sin correspondencia, filas sin estructura", () => {
    const d = deriveReadingUnits({ assets: [asset("a1", "Huerto", ["Alimentación saludable"]), asset("a2", "Peña", ["Cultura y ocio"])] });
    const s = buildCanonicalReadingUnits(d, 2)!;
    expect(s.gaps.join(" ")).toContain("No consta priorización ciudadana temática");
    expect(s.gaps.join(" ")).toContain("1 activo de Localiza sin correspondencia validada");
    expect(s.gaps.join(" ")).toContain("2 activos sin la estructura de una fila de Localiza");
  });

  it("dos expedientes distintos producen secciones distintas", () => {
    const a = buildCanonicalReadingUnits(deriveReadingUnits({ assets: [asset("a", "A", ["Actividad física"])] }), 0)!;
    const b = buildCanonicalReadingUnits(deriveReadingUnits({ assets: [asset("b", "B", ["Alimentación saludable"])] }), 0)!;
    expect(a.units.map((u) => u.topicId)).not.toEqual(b.units.map((u) => u.topicId));
  });
});
