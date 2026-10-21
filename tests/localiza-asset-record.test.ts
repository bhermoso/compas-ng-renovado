import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  TOPIC_CORRESPONDENCE,
  countAssetsByTematica,
  papeletaTopicsWithoutLocalizaTematica,
  parseLocalizaAssetAtom,
  readLocalizaAssets,
  validatedCorrespondence,
} from "../src/application/localiza-assets";
import { THEMATIC_TOPICS } from "../src/domain/thematic-prioritisation";

const FIXTURE = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../fixtures/workspaces/granada-zaidin-synthetic-test.json"
);

function collectAssetAtoms(node: unknown, out: Array<{ id: string; kind: string; title: string; content: string }> = []) {
  if (Array.isArray(node)) node.forEach((n) => collectAssetAtoms(n, out));
  else if (node && typeof node === "object") {
    const o = node as Record<string, unknown>;
    if (o.kind === "asset" && typeof o.content === "string" && typeof o.id === "string") {
      out.push({ id: o.id, kind: "asset", title: String(o.title ?? ""), content: o.content });
    }
    Object.values(o).forEach((v) => collectAssetAtoms(v, out));
  }
  return out;
}

const atoms = collectAssetAtoms(JSON.parse(readFileSync(FIXTURE, "utf8")));

describe("activo estructurado de Localiza Salud", () => {
  it("lee los 56 activos de Granada-Zaidín sin dejar ninguno fuera", () => {
    const lectura = readLocalizaAssets(atoms);
    expect(atoms).toHaveLength(56);
    expect(lectura.records).toHaveLength(56);
    expect(lectura.unstructured).toHaveLength(0);
  });

  it("conserva las temáticas y la población tal como constan", () => {
    const [primero] = readLocalizaAssets(atoms).records;
    expect(primero.nombre).toBe("ASOCIACIÓN ALFA (ALMANJÁYAR EN FAMILIA)");
    expect(primero.tematicas.slice(0, 2)).toEqual(["Participación y acción comunitaria", "Cultura y ocio"]);
    expect(primero.tematicas.length).toBeGreaterThan(2);
    expect(primero.poblacionDestinataria).toContain("Mayores de 64 años");
    expect(primero.estado).toBe("registrado-en-localiza");
  });

  it("no adivina: una fila con otra forma queda como no estructurada, con su motivo", () => {
    const r = parseLocalizaAssetAtom({ id: "x", title: "Recurso libre", content: "Recurso libre\tsolo dos campos" });
    expect("motivo" in r).toBe(true);
    expect(r).toMatchObject({ atomId: "x", motivo: expect.stringContaining("2 campos") });
  });

  it("cuenta por temática declarada, no por palabras del texto", () => {
    const cuentas = new Map(countAssetsByTematica(readLocalizaAssets(atoms).records).map((c) => [c.tematica, c.count]));
    expect(cuentas.size).toBe(15);
    expect(cuentas.get("Bienestar emocional")).toBe(47);
    expect(cuentas.get("Prevención del suicidio")).toBe(2);
  });
});

describe("tabla de correspondencia de temas", () => {
  const observadas = countAssetsByTematica(readLocalizaAssets(atoms).records).map((c) => c.tematica);

  it("cubre todas las temáticas observadas y no repite ninguna", () => {
    const tabla = TOPIC_CORRESPONDENCE.map((e) => e.localizaTematica);
    expect(new Set(tabla).size).toBe(tabla.length);
    for (const t of observadas) expect(tabla).toContain(t);
  });

  it("solo apunta a temas existentes de la papeleta", () => {
    const ids = new Set(THEMATIC_TOPICS.map((t) => t.id));
    for (const e of TOPIC_CORRESPONDENCE) if (e.topicId !== null) expect(ids.has(e.topicId)).toBe(true);
  });

  it("nace sin validar: ninguna entrada es utilizable hasta que una persona la valide", () => {
    for (const e of TOPIC_CORRESPONDENCE) {
      expect(e.status).toBe("propuesta");
      expect(e.validatedBy).toBeNull();
    }
    expect(validatedCorrespondence()).toHaveLength(0);
  });

  it("señala los temas de la papeleta sin temática de Localiza", () => {
    expect(papeletaTopicsWithoutLocalizaTematica()).toEqual([
      "pantallas-redes",
      "sueno-descanso",
      "tabaco-alcohol-drogas",
      "violencia-genero",
      "accidentes",
    ]);
  });
});
