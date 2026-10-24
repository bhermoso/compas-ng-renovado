/**
 * Proyección canónica → modelo documental (GOV-SALIDA-01 · PR-2).
 *
 * Verifica que `buildPSLCDocumentModel` proyecta MECÁNICAMENTE la lectura
 * editorial + el espacio técnico para artefactos v2 (paridad de IDs, orden y
 * contenido; cada elemento una vez), aísla la ruta B histórica para artefactos
 * legacy, y no reconstruye desde `provenance`/`conclusiones.content`.
 *
 * Cobertura: Atarfe y Granada-Zaidín.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildDiagnosticAnswers,
  readSealedCanonicalDocument,
  CANONICAL_READING_ORDER,
  CANONICAL_TECHNICAL_ORDER,
} from "../src/application/health-profile";
import type { DiagnosticAnswers } from "../src/application/health-profile";
import { compileLocalHealthProfile } from "../src/application/health-profile-compiler";
import {
  buildPSLCDocumentModel,
  projectCanonicalToDocumentModel,
  buildPSLCDocumentMetadata,
} from "../src/application/psl-c-export";
import { loadWorkspaceFromLocalStorage } from "../src/infrastructure/persistence/local-storage";
import { createMunicipalityRuntime } from "../src/application/runtime";
import type { MunicipalityWorkspace } from "../src/domain/workspace";
import type { LocalHealthProfile } from "../src/domain/health-profile";
import type { LocalHealthProfileArtifact } from "../src/domain/health-profile-artifact";

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

const DIR = dirname(fileURLToPath(import.meta.url));
const exportPath = (muni: string, file: string) =>
  muni === "granada-zaidin"
    ? resolve(DIR, "..", "fixtures", "workspaces", "granada-zaidin-synthetic-test.json")
    : resolve(DIR, "..", "municipalities", muni, "exports", file);

function validatedPSL(base: LocalHealthProfile): LocalHealthProfile {
  return {
    ...base,
    status: "validated",
    conclusiones: {
      ...base.conclusiones,
      status: "authored",
      content: base.conclusiones.content || "Conclusiones del equipo técnico.",
    },
    cierreInterpretativo: {
      ...base.cierreInterpretativo,
      status: "authored",
      content: base.cierreInterpretativo.content || "Cierre interpretativo del equipo.",
    },
    priorizacionStatus: "complete",
    priorizacion: { ...base.priorizacion, consensoDocumentado: true },
  };
}

interface Caso {
  ws: MunicipalityWorkspace;
  psl: LocalHealthProfile;
  answers: DiagnosticAnswers;
  territory: string;
  province: string;
  v2: LocalHealthProfileArtifact;
  legacy: LocalHealthProfileArtifact;
}

function cargar(muni: string, file: string): Caso {
  store.set(`compas-ng:workspace:${muni}`, readFileSync(exportPath(muni, file), "utf8"));
  const ws = loadWorkspaceFromLocalStorage(muni);
  if (ws === null) throw new Error(`no rehidrata ${muni}`);
  const psl = validatedPSL(createMunicipalityRuntime({ workspace: ws }).psl);
  const answers = buildDiagnosticAnswers({
    workspace: ws,
    determinantTitles: ws.evidenceStore.atoms
      .filter((a) => a.kind === "determinant")
      .map((a) => a.title),
    assets: ws.evidenceStore.atoms
      .filter((a) => a.kind === "asset")
      .map((a) => ({ title: a.title, content: a.content })),
  });
  const territory = ws.municipality.identity.name;
  const province = ws.municipality.identity.province ?? "";
  const base = {
    psl,
    municipalityName: territory,
    municipalityProvince: province,
    existingArtifactCount: 0,
  };
  const v2 = compileLocalHealthProfile({ ...base, diagnosticAnswers: answers });
  const legacy = compileLocalHealthProfile(base);
  if (!v2.ok || !legacy.ok) throw new Error("compilación del arnés falló");
  return { ws, psl, answers, territory, province, v2: v2.artifact, legacy: legacy.artifact };
}

let zaidin: Caso;
let atarfe: Caso;

beforeAll(() => {
  zaidin = cargar("granada-zaidin", "compas-ng-workspace-granada-zaidin.json");
  atarfe = cargar("atarfe", "compas-ng-workspace-atarfe.json");
});

const CASOS = (): Array<[string, () => Caso]> => [
  ["Granada-Zaidín", () => zaidin],
  ["Atarfe", () => atarfe],
];

const CANONICAL_ORDER = [...CANONICAL_READING_ORDER, ...CANONICAL_TECHNICAL_ORDER];

describe("proyección — IDs y orden estables", () => {
  it.each(CASOS())("%s: los sectionId siguen el orden canónico, sin saltos", (_n, get) => {
    const model = buildPSLCDocumentModel(get().v2);
    const ids = model.sections
      .map((s) => s.sectionId)
      .filter((id): id is NonNullable<typeof id> => id !== undefined);
    // Subsecuencia estricta del orden canónico (lectura + técnico).
    const posiciones = ids.map((id) => CANONICAL_ORDER.indexOf(id));
    expect(posiciones.every((p) => p >= 0)).toBe(true);
    for (let i = 1; i < posiciones.length; i++) {
      expect(posiciones[i]).toBeGreaterThan(posiciones[i - 1]);
    }
  });
});

describe("proyección — paridad de contenido con la vista canónica", () => {
  it.each(CASOS())("%s: cada sección proyecta el contenido de su campo canónico", (_n, get) => {
    const caso = get();
    const norm = readSealedCanonicalDocument(caso.v2.canonicalDocument!);
    expect(norm).not.toBeNull();
    const model = buildPSLCDocumentModel(caso.v2);
    const byId = new Map(model.sections.filter((s) => s.sectionId).map((s) => [s.sectionId!, s]));

    // Trazadores: tantas filas como la tabla canónica.
    expect(byId.get("tracer-table")!.table!.rows.length).toBe(
      norm!.editorialView.tracerTable.length
    );
    // Referencias comparativas completas.
    expect(byId.get("comparative-references")!.table!.rows.length).toBe(
      norm!.technicalSpace.comparativeReferences.length
    );
    // Matriz epistemológica completa.
    expect(byId.get("epistemic-matrix")!.table!.rows.length).toBe(
      norm!.technicalSpace.epistemicMatrix.length
    );
    // Señales principales para deliberación: retiradas del cuerpo (contrato v2.0.0).
    expect(byId.has("principal-signals")).toBe(false);
    // Ranking del Informe presente sii la lectura lo lleva.
    expect(byId.has("informe-ranking")).toBe(
      norm!.editorialView.informeSignalRanking !== null
    );
    if (norm!.editorialView.diagnosticSynthesis !== null) {
      const section = byId.get("diagnostic-synthesis");
      expect(section).toBeDefined();
      expect(section!.paragraphs).toContain(
        norm!.editorialView.diagnosticSynthesis.thesis
      );
      expect(section!.paragraphs.join("\n")).toContain("Pregunta de contraste:");
    }
    // Trazabilidad: el hash del artefacto aparece en su sección.
    expect(byId.get("traceability")!.paragraphs.join(" ")).toContain(caso.v2.sourceHash);
  });
});

describe("proyección — cada elemento una vez", () => {
  it.each(CASOS())("%s: el cierre humano aparece una sola vez, en la lectura", (_n, get) => {
    const caso = get();
    const norm = readSealedCanonicalDocument(caso.v2.canonicalDocument!)!;
    const humano = norm.editorialView.humanClosing;
    if (humano === null) return;
    const model = buildPSLCDocumentModel(caso.v2);
    const conCierre = model.sections.filter((s) =>
      s.paragraphs.join("\n").includes(humano.content.trim().slice(0, 40))
    );
    expect(conCierre).toHaveLength(1);
    expect(conCierre[0].sectionId).toBe("human-closing");
  });
});

describe("proyección — aislamiento del contrato (estático)", () => {
  it("el proyector no reconstruye desde provenance/conclusiones/parseNarrativeChapters", () => {
    const source = readFileSync(
      resolve(DIR, "..", "src", "application", "psl-c-export", "pslcCanonicalProjector.ts"),
      "utf8"
    );
    expect(source).not.toContain("parseNarrativeChapters");
    expect(source).not.toContain("diagnosticAnswersSnapshot");
    expect(source).not.toContain("conclusiones");
  });
});

describe("proyección — despacho v2 frente a fallback legacy", () => {
  it.each(CASOS())("%s: el artefacto v2 se proyecta; el legacy usa la ruta B", (_n, get) => {
    const caso = get();
    const v2 = buildPSLCDocumentModel(caso.v2);
    const legacy = buildPSLCDocumentModel(caso.legacy);
    // v2: secciones con identidad canónica y apertura de lectura.
    expect(v2.sections.some((s) => s.sectionId === "overview")).toBe(true);
    // Contrato v2.0.0 (Art. 16 quater): el cuerpo abre con el punto de partida.
    expect(v2.sections[0].title).toBe("Punto de partida");
    expect(v2.sections[1].title).toBe("Imagen general");
    // legacy: sin canonicalDocument, sin sectionId, forma textual clásica.
    expect(caso.legacy.canonicalDocument).toBeUndefined();
    expect(legacy.sections.every((s) => s.sectionId === undefined)).toBe(true);
    expect(legacy.sections[0].title).toBe("Lectura ejecutiva territorial");
  });

  it.each(CASOS())("%s: los renderers consumen la proyección para v2", (_n, get) => {
    const caso = get();
    const norm = readSealedCanonicalDocument(caso.v2.canonicalDocument!)!;
    const directa = projectCanonicalToDocumentModel(
      norm.editorialView,
      norm.technicalSpace,
      buildPSLCDocumentMetadata(caso.v2)
    );
    // buildPSLCDocumentModel (que alimenta visor/DOCX/PDF) == proyección directa.
    expect(buildPSLCDocumentModel(caso.v2)).toEqual(directa);
  });
});
