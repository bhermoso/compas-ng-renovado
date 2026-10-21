import { describe, expect, it } from "vitest";
import { readLocalizaAssets, buildCanonicalReadingUnits, deriveReadingUnits } from "../src/application/localiza-assets";
import {
  addAssetValidation,
  removeAssetValidation,
  type MunicipalDocumentRepository,
} from "../src/domain/repository";

const row = (n: string) => [n, "desc", "Cualquiera", "Toda la población", "Actividad física", "Zagra", "Zagra", ""].join("\t");
const atoms = [
  { id: "a1", kind: "asset" as const, title: "A1", content: row("A1"), documentId: "doc-loc" },
  { id: "a2", kind: "asset" as const, title: "A2", content: row("A2"), documentId: "doc-otro" },
];
const criteria = { title: "Criterios", version: "Versión 9 de junio de 2026" };

describe("activos validados (declaración del equipo técnico)", () => {
  it("sin declaración, todos constan solo como registrados", () => {
    const r = readLocalizaAssets(atoms);
    expect(r.records.every((x) => x.estado === "registrado-en-localiza")).toBe(true);
  });

  it("la declaración sobre un documento valida solo sus activos", () => {
    const r = readLocalizaAssets(atoms, [
      { id: "v1", documentId: "doc-loc", criteria, declaredBy: "Validador", declaredAt: "x" },
    ]);
    expect(r.records.find((x) => x.atomId === "a1")?.estado).toBe("validado");
    expect(r.records.find((x) => x.atomId === "a2")?.estado).toBe("registrado-en-localiza");
    expect(r.records[0].validacion?.criterios).toContain("Versión 9 de junio de 2026");
  });

  it("atomIds restringe la declaración a esos activos", () => {
    const r = readLocalizaAssets(
      [{ ...atoms[1], documentId: "doc-loc" }, { ...atoms[0] }],
      [{ id: "v1", documentId: "doc-loc", atomIds: ["a1"], criteria, declaredBy: "V", declaredAt: "x" }]
    );
    expect(r.records.map((x) => x.estado)).toEqual(["registrado-en-localiza", "validado"]);
  });

  it("el resumen de la sección cita la validación declarada", () => {
    const { records } = readLocalizaAssets(atoms, [
      { id: "v1", documentId: "doc-loc", criteria, declaredBy: "V", declaredAt: "x" },
    ]);
    const s = buildCanonicalReadingUnits(deriveReadingUnits({ assets: records }), 0, 1);
    expect(s?.assetsSummary).toContain("declarado como validado");
    const none = buildCanonicalReadingUnits(deriveReadingUnits({ assets: records }), 0);
    expect(none?.assetsSummary).not.toContain("validado");
  });

  it("añadir y retirar deja el repositorio sin la clave", () => {
    const base: MunicipalDocumentRepository = {
      municipalityId: "zagra", documents: [], createdAt: "x", updatedAt: "x",
    };
    const con = addAssetValidation(base, { id: "v1", documentId: "d", criteria, declaredBy: "V" });
    expect(con.assetValidations).toHaveLength(1);
    expect("assetValidations" in removeAssetValidation(con, "v1")).toBe(false);
  });
});
