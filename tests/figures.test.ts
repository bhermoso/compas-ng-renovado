import { describe, expect, it } from "vitest";
import { groupFigures, parseFigures, validateFigure, type FigureInput } from "../src/application/figures";
import { deriveReadingUnits, type LocalizaAssetRecord } from "../src/application/localiza-assets";
import { addFigures, createMunicipalDocumentRepository, type FigureRecord } from "../src/domain/repository";

const base: FigureInput = {
  id: "f1",
  indicador: "Población de 65 y más años",
  valor: "218,28",
  unidad: "por 1.000",
  anio: "2023",
  territorio: "Zagra",
  escala: "municipio",
  dimension: "envejecimiento y dependencia",
  fuente: { tipo: "ieca-badea", titulo: "BADEA", consulta: "51744" },
  importedBy: "Blas",
};
const rec = (f: FigureInput): FigureRecord => ({ ...f, importedAt: "2026-10-22" });

describe("cifras con procedencia", () => {
  it("admite una cifra literal con año, territorio y fuente", () => {
    expect(validateFigure(base)).toEqual([]);
  });

  it("rechaza valores aproximados", () => {
    for (const v of ["≈ 200", "~200", "aproximadamente 200", "unos 200", "cerca de 200", "c. 200"]) {
      expect(validateFigure({ ...base, valor: v }).join(" ")).toMatch(/aproximado/);
    }
  });

  it("exige año (o «no consta»), territorio, fuente y página si es del Informe", () => {
    expect(validateFigure({ ...base, anio: "" }).join(" ")).toMatch(/año/);
    expect(validateFigure({ ...base, anio: "no consta" })).toEqual([]);
    expect(validateFigure({ ...base, territorio: "" }).join(" ")).toMatch(/territorio/);
    expect(validateFigure({ ...base, fuente: { tipo: "ieca-badea", titulo: "" } }).join(" ")).toMatch(/fuente/);
    expect(validateFigure({ ...base, fuente: { tipo: "informe-de-salud", titulo: "Informe" } }).join(" ")).toMatch(/página/);
    expect(validateFigure({ ...base, fuente: { tipo: "informe-de-salud", titulo: "Informe", pagina: "30" } })).toEqual([]);
  });

  it("rechaza una dimensión que la lectura no detecta", () => {
    expect(validateFigure({ ...base, dimension: "inventada" }).join(" ")).toMatch(/dimensión/);
  });

  it("parseFigures no importa nada si una cifra falla o si hay ids repetidos", () => {
    const ok = parseFigures(JSON.stringify([base]), "Blas");
    expect(ok.problems).toEqual([]);
    expect(ok.figures).toHaveLength(1);
    const bad = parseFigures(JSON.stringify([base, { ...base, id: "f2", valor: "≈ 3" }]), "Blas");
    expect(bad.figures).toEqual([]);
    expect(bad.problems.length).toBeGreaterThan(0);
    expect(parseFigures(JSON.stringify([base, base]), "Blas").problems.join(" ")).toMatch(/repetido/);
    expect(parseFigures("no json", "Blas").problems).toHaveLength(1);
    expect(parseFigures("{}", "Blas").problems).toHaveLength(1);
  });

  it("groupFigures rotula «referencia no local» las escalas distintas del municipio", () => {
    const g = groupFigures([
      rec({ ...base, grupo: "g" }),
      rec({ ...base, id: "f2", grupo: "g", territorio: "Andalucía", escala: "andalucia", valor: "190,10" }),
    ]);
    expect(g).toHaveLength(1);
    expect(g[0]!.texto).toContain("Zagra 218,28 por 1.000 (2023)");
    expect(g[0]!.texto).toContain("Andalucía (referencia no local, Andalucía) 190,10 por 1.000 (2023)");
    expect(g[0]!.fuentes).toEqual(["BADEA, consulta 51744"]);
  });

  it("groupFigures conserva la nota de la fuente (incoherencias incluidas)", () => {
    const g = groupFigures([rec({ ...base, nota: "El Informe da dos valores distintos." })]);
    expect(g[0]!.texto).toContain("Nota de la fuente: El Informe da dos valores distintos.");
  });

  it("addFigures sustituye por id y conserva el resto", () => {
    let r = createMunicipalDocumentRepository({ municipalityId: "zagra" } as never);
    r = addFigures(r, [base, { ...base, id: "f2" }]);
    r = addFigures(r, [{ ...base, id: "f1", valor: "220,00" }]);
    expect(r.figures).toHaveLength(2);
    expect(r.figures!.find((f) => f.id === "f1")!.valor).toBe("220,00");
  });
});

describe("cifras en las unidades de lectura", () => {
  const asset: LocalizaAssetRecord = {
    atomId: "a1", nombre: "Club de marcha", descripcion: "", acceso: "Cualquiera", poblacionDestinataria: [],
    tematicas: ["Actividad física"], municipio: "X", localidad: "X", estado: "registrado-en-localiza",
  };

  it("la cifra va a la unidad cuya correspondencia validada incluye su dimensión", () => {
    const f = rec({ ...base, dimension: "actividad física y sedentarismo" });
    const d = deriveReadingUnits({ assets: [asset], figures: [f] });
    expect(d.units.find((u) => u.topicId === "actividad-fisica")!.cifras.map((c) => c.id)).toEqual(["f1"]);
    expect(d.figuresWithoutUnit).toEqual([]);
  });

  it("una cifra sin unidad correspondiente queda como laguna y no se muestra", () => {
    const d = deriveReadingUnits({ assets: [asset], figures: [rec(base), rec({ ...base, id: "f3", dimension: undefined })] });
    expect(d.units.every((u) => u.cifras.length === 0)).toBe(true);
    expect(d.figuresWithoutUnit).toEqual([
      { dimension: "envejecimiento y dependencia", n: 1 },
      { dimension: "sin dimensión declarada", n: 1 },
    ]);
  });
});

describe("composición del texto de la cifra", () => {
  it("una nota que ya termina en punto no produce doble punto antes de «Fuente»", async () => {
    const { buildCanonicalReadingUnits } = await import("../src/application/localiza-assets");
    const f = rec({ ...base, dimension: "actividad física y sedentarismo", nota: "Nota con punto final." });
    const asset: LocalizaAssetRecord = {
      atomId: "a1", nombre: "Club", descripcion: "", acceso: "Cualquiera", poblacionDestinataria: [],
      tematicas: ["Actividad física"], municipio: "X", localidad: "X", estado: "registrado-en-localiza",
    };
    const c = buildCanonicalReadingUnits(deriveReadingUnits({ assets: [asset], figures: [f] }), 0)!;
    const line = JSON.stringify(c.units);
    expect(line).toContain("Nota de la fuente: Nota con punto final. Fuente:");
    expect(line).not.toContain("..");
  });
});
