/**
 * tests/granada-zaidin-vigente-56-92.test.ts
 *
 * PROTECCIÓN DE LA LÍNEA VIGENTE Granada-Zaidín: fuentes observadas.
 *
 * Rehidrata el export versionado de trabajo:
 *   municipalities/granada-zaidin/exports/compas-ng-workspace-granada-zaidin.json
 * con los servicios reales de persistencia, y fija:
 *   (a) la composición del expediente (7 docs / 56 activos Localiza Salud /
 *       2 territoriales / 3 marcos / 1 informe / distrito / 0 estudios aplicados);
 *   (b) la integridad del fichero (ASCII, sin mojibake CP850/CP1252);
 *   (c) los invariantes narrativos del Perfil generado sobre la línea real.
 *
 * Los instrumentos metodológicos siguen disponibles, pero ningún fixture puede
 * presentarse como resultado del distrito.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadWorkspaceFromLocalStorage } from "../src/infrastructure/persistence/local-storage";
import { createMunicipalityRuntime } from './helpers/legacyProfileRuntime';
import type { MunicipalityWorkspace } from "../src/domain/workspace";
import type { LocalHealthProfile } from "../src/domain/health-profile";

const store = new Map<string, string>();
(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => {
    store.set(k, v);
  },
  removeItem: (k: string) => {
    store.delete(k);
  },
  clear: () => store.clear(),
  key: (i: number) => [...store.keys()][i] ?? null,
  get length() {
    return store.size;
  },
};

const EXPORT_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../municipalities/granada-zaidin/exports/compas-ng-workspace-granada-zaidin.json"
);

const STUDY_KEYS = [
  "ibseStudy",
  "dukeStudy",
  "predimedStudy",
  "sf12Study",
  "suenoStudy",
  "cageStudy",
  "auditcStudy",
  "ipaqStudy",
  "ghq12Study",
  "phq9Study",
  "psqiStudy",
  "fagerstromStudy",
  "sbqStudy",
] as const;

function isAsciiOnly(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) > 0x7f) return false;
  }
  return true;
}

let raw: string;
let ws: MunicipalityWorkspace;
let psl: LocalHealthProfile;

beforeAll(() => {
  raw = readFileSync(EXPORT_PATH, "utf8");
  store.set("compas-ng:workspace:granada-zaidin", raw);
  const loaded = loadWorkspaceFromLocalStorage("granada-zaidin");
  if (loaded === null) throw new Error("El export vigente no rehidrata");
  ws = loaded;
  psl = createMunicipalityRuntime({ workspace: ws }).psl;
}, 60000);

describe("Línea vigente observada — integridad del fichero exportado", () => {
  it("es 100 % ASCII, sin patrones de corrupción CP850/CP1252", () => {
    expect(isAsciiOnly(raw)).toBe(true);
    for (const mojibake of ["├¡", "Ã­", "ÔÇö", "Ã©", "┬"]) {
      expect(raw.includes(mojibake), mojibake).toBe(false);
    }
  });

  it("el contenido parseado conserva tildes correctas", () => {
    const texto = JSON.stringify(JSON.parse(raw));
    expect(texto).toContain("Granada-Zaidín");
    expect(texto).toContain("Andalucía");
  });
});

describe("Línea vigente observada — composición del expediente", () => {
  it("identidad: granada-zaidin, distrito, sin INE propio", () => {
    expect(ws.municipality.identity.id).toBe("granada-zaidin");
    expect(ws.municipality.identity.territorialType).toBe("distrito");
    expect(ws.municipality.identity.ineCode).toBeUndefined();
  });

  it("8 documentos: 1 informe, 1 histórico archivado, 1 Localiza, 2 territoriales y 3 marcos", () => {
    const docs = ws.repository.documents;
    expect(docs.length).toBe(8);
    expect(docs.filter((d) => d.kind === "health-report").length).toBe(1);
    expect(docs.filter((d) => d.kind === "other" && d.status === "archived").length).toBe(1);
    expect(docs.filter((d) => d.kind === "territorial-documentation").length).toBe(2);
    expect(docs.filter((d) => d.kind === "strategic-framework").length).toBe(3);
    expect(docs.filter((d) => d.kind === "localiza-salud").length).toBe(1);
  });

  it("56 evidencias, todas de Localiza Salud y ninguna de estudios", () => {
    const atoms = ws.evidenceStore.atoms;
    expect(atoms.length).toBe(56);
    const estudios = atoms.filter(
      (a) => a.provenance.origin === "complementary-study" || a.provenance.origin === "ibse"
    );
    expect(estudios.length).toBe(0);
    expect(atoms.filter((a) => a.provenance.origin === "localiza-salud").length).toBe(56);
  });

  it("0/13 estudios con resultados; informe y marcos no generan átomos", () => {
    for (const key of STUDY_KEYS) {
      expect(ws[key], key).toBeUndefined();
    }
    const hr = ws.repository.documents.find((d) => d.kind === "health-report");
    expect(hr!.canGenerateEvidence).toBe(false);
    expect(
      ws.evidenceStore.atoms.some((a) => a.provenance.origin === "health-report")
    ).toBe(false);
    expect(
      ws.evidenceStore.atoms.some((a) => a.provenance.origin === "strategic-framework")
    ).toBe(false);
  });

  it("la rehidratación conserva el export y aplica la migración documental vigente", () => {
    const crudo = JSON.parse(raw);
    expect(crudo.repository.documents.length).toBe(7);
    expect(ws.repository.documents.length).toBeGreaterThanOrEqual(crudo.repository.documents.length);
    const ids = new Set(ws.repository.documents.map((document) => document.id));
    for (const document of crudo.repository.documents) {
      expect(ids.has(document.id), document.id).toBe(true);
    }
    expect(ws.evidenceStore.atoms.length).toBe(crudo.evidenceStore.atoms.length);
  });
});

describe("Línea vigente observada — invariantes narrativos del Perfil", () => {
  it("genera los seis capítulos en orden", () => {
    const texto = psl.conclusiones.content;
    const capitulos = [
      "I. Alcance, fuentes y escala de la evidencia",
      "II. Contexto territorial y sociodemográfico",
      "III. Situación de salud y desigualdades",
      "IV. Determinantes sociales, comunitarios y ambientales",
      "V. Activos, capacidades territoriales e incertidumbres",
      "VI. Conclusiones técnicas para la priorización",
    ];
    let anterior = -1;
    for (const capitulo of capitulos) {
      const posicion = texto.indexOf(capitulo);
      expect(posicion, capitulo).toBeGreaterThan(anterior);
      anterior = posicion;
    }
  });

  it("el capítulo I no domina el documento (sin volcado de cautelas)", () => {
    const texto = psl.conclusiones.content;
    const finCapI = texto.indexOf("II. Contexto territorial");
    expect(finCapI).toBeGreaterThan(0);
    // Intención de producto: Cap. I compacto, nunca mayoritario.
    expect(finCapI / texto.length).toBeLessThan(0.45);
  });

  it("la muestra de activos del capítulo V prioriza los identificables del Zaidín", () => {
    const texto = psl.conclusiones.content;
    const capV = texto.slice(texto.indexOf("V. Activos"), texto.indexOf("VI. Conclusiones"));
    const primerEjemplo = capV.split("entre ellos: ")[1]?.split(";")[0] ?? "";
    expect(primerEjemplo.toLowerCase()).toContain("zaid");
    expect(capV).toContain("se identifican expresamente con el distrito");
    expect(capV).toContain("municipio matriz");
    // La cifra total no se reduce
    expect(capV).toContain("56 activos");
  });

  it("distrito como término preferente; «municipio» solo para el municipio matriz", () => {
    const textos = [
      psl.territorialSummary,
      psl.conclusiones.content,
      psl.conclusiones.authorshipNote,
      psl.cierreInterpretativo.content,
      psl.priorizacion.deliberacionNota,
      psl.longitudinalNote,
    ].join("\n");
    const admisible = textos.split("municipio matriz").join("");
    expect(admisible).not.toMatch(/\bmunicipios?\b/i);
    expect(textos).toContain("distrito");
  });

  it("no atribuye estudios al distrito y mantiene la cautela de Localiza", () => {
    const texto = psl.conclusiones.content;
    expect(texto).not.toContain("Los estudios complementarios amplían");
    expect(texto).not.toMatch(/GHQ-12|PHQ-9|PSQI|Fagerström|AUDIT-C|SBQ/);
    expect(texto).toContain("Localiza Salud");
    expect(psl.cierreInterpretativo.content).toContain("inframunicipal");
  });

  it("marcos estratégicos fuera de las conclusiones diagnósticas", () => {
    const textos = psl.conclusiones.content + "\n" + psl.cierreInterpretativo.content;
    expect(textos).not.toContain("EPVSA");
    expect(textos).not.toContain("ESCA");
    expect(textos).not.toContain("Personas Mayores en Andalucía");
  });

  it("sin recomendaciones, programas, actuaciones ni lenguaje de sistema", () => {
    const textos = psl.conclusiones.content + "\n" + psl.cierreInterpretativo.content;
    expect(textos).not.toMatch(
      /se recomienda|recomendamos|debe implantarse|proponemos|línea estratégica|actuaciones a desarrollar/i
    );
    expect(textos).not.toMatch(/pipeline|dashboard|scaffold|prototipo|inteligencia artificial/i);
    expect(psl.conclusiones.content).toContain("no formula recomendaciones");
    expect(psl.requiresHumanValidation).toBe(true);
  });
});
