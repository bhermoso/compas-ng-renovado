import { describe, expect, it } from "vitest";
import {
  KNOWN_INFORME_DIMENSIONS,
  buildCanonicalReadingUnits,
  currentAxes,
  deriveReadingUnits,
  validateAxisDeclaration,
  type LocalizaAssetRecord,
} from "../src/application/localiza-assets";
import {
  addReadingAxisDeclaration,
  type MunicipalDocumentRepository,
  type ReadingAxisDeclaration,
} from "../src/domain/repository";

const base = { municipalityId: "m", documents: [], createdAt: "x", updatedAt: "x" } as unknown as MunicipalDocumentRepository;
const draft = (over: Partial<Omit<ReadingAxisDeclaration, "version" | "declaredAt">> = {}) => ({
  id: "envejecimiento",
  label: "Envejecimiento y dependencia",
  definition: "Agrupa lo que el Informe trata sobre envejecimiento y dependencia.",
  informeDimensions: ["envejecimiento y dependencia"],
  localizaTematicas: ["Envejecimiento activo"],
  declaredBy: "Blas",
  ...over,
});
const asset = (atomId: string, nombre: string, tematicas: string[]): LocalizaAssetRecord => ({
  atomId, nombre, descripcion: "", acceso: "Cualquiera", poblacionDestinataria: [], tematicas, municipio: "X", localidad: "X", estado: "validado",
});
const axisFrom = (over = {}) => {
  const r = addReadingAxisDeclaration(base, draft(over));
  return currentAxes(r.readingAxes);
};

describe("ejes de lectura (Art. 4 ter)", () => {
  it("la dimensión existe en el vocabulario del Informe", () => {
    expect(KNOWN_INFORME_DIMENSIONS).toContain("envejecimiento y dependencia");
  });

  it("valida: exige definición, autoría, una dimensión del Informe y nombres conocidos", () => {
    expect(validateAxisDeclaration(draft())).toEqual([]);
    expect(validateAxisDeclaration(draft({ informeDimensions: [] })).join()).toContain("al menos una dimensión");
    expect(validateAxisDeclaration(draft({ informeDimensions: ["inventada"] })).join()).toContain("no es una dimensión");
    expect(validateAxisDeclaration(draft({ localizaTematicas: ["Inventada"] })).join()).toContain("no es una temática");
    expect(validateAxisDeclaration(draft({ definition: " " })).join()).toContain("definición");
  });

  it("cada cambio es una versión nueva y la última es la vigente", () => {
    const r1 = addReadingAxisDeclaration(base, draft());
    const r2 = addReadingAxisDeclaration(r1, draft({ label: "Envejecimiento" }));
    expect(r2.readingAxes!.map((a) => a.version)).toEqual([1, 2]);
    expect(currentAxes(r2.readingAxes)[0]).toMatchObject({ version: 2, label: "Envejecimiento" });
  });

  it("sin eje declarado, el envejecimiento no genera unidad", () => {
    const d = deriveReadingUnits({ assets: [], informeSignals: [{ dimension: "envejecimiento y dependencia", menciones: 4 }] });
    expect(d.units).toHaveLength(0);
  });

  it("un eje declarado con Informe y activo conectado genera unidad, con su declaración", () => {
    const d = deriveReadingUnits({
      assets: [asset("a1", "Complejo deportivo", ["Envejecimiento activo"])],
      informeSignals: [{ dimension: "envejecimiento y dependencia", menciones: 4 }],
      axes: axisFrom(),
    });
    const u = d.units.find((x) => x.topicId === "eje:envejecimiento")!;
    expect(u.crossing).toBe("eje-con-activo-registrado");
    expect(u.voice).toBeNull();
    expect(u.informe?.dimensions).toEqual([{ dimension: "envejecimiento y dependencia", menciones: 4 }]);
    const canon = buildCanonicalReadingUnits(d, 0, 1)!;
    const cu = canon.units.find((x) => x.topicId === "eje:envejecimiento")!;
    expect(cu.lines[0]).toContain("Eje de lectura declarado por Blas");
    expect(cu.crossingStatement).toContain("La priorización ciudadana no recoge este eje");
  });

  it("un eje con Informe y sin activos conectados declara la laguna del mapa", () => {
    const d = deriveReadingUnits({
      assets: [],
      informeSignals: [{ dimension: "envejecimiento y dependencia", menciones: 4 }],
      axes: axisFrom(),
    });
    expect(d.units[0]!.crossing).toBe("eje-sin-activo-registrado");
    const cu = buildCanonicalReadingUnits(d, 0)!.units[0]!;
    expect(cu.crossingStatement).toContain("laguna del mapa de Localiza, no la ausencia del recurso");
  });

  it("un eje sin ninguna fuente no genera unidad y consta como laguna", () => {
    const d = deriveReadingUnits({ assets: [], informeSignals: [], axes: axisFrom() });
    expect(d.units).toHaveLength(0);
    expect(d.axesWithoutSource).toEqual(["Envejecimiento y dependencia"]);
  });

  it("los activos de un eje siguen contando en sus unidades de tema", () => {
    const d = deriveReadingUnits({
      assets: [asset("a1", "ZAHRA", ["Actividad física", "Envejecimiento activo"])],
      axes: axisFrom(),
    });
    expect(d.units.map((u) => u.topicId).sort()).toEqual(["actividad-fisica", "eje:envejecimiento"]);
  });
});
