/**
 * Verificación del PASO 3 — pantalla y export leen la misma editorialView
 * congelada; paridad de cabecera; export inmune a mutación del workspace.
 *
 * A. La pantalla del artefacto congelado renderiza `ProfileIntegratedEditorialPreview`
 *    alimentado por la editorialView SELLADA (no recalculada).
 * B. Paridad de cabecera: el título del Informe sellado es el INSTITUCIONAL, el
 *    mismo que usan pantalla viva y export.
 * C. Cautela: mutar el workspace tras compilar no altera el export (document
 *    model) ni la editorialView sellada. Un artefacto legacy no tiene sello.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { compileLocalHealthProfile } from "../src/application/health-profile-compiler";
import { readSealedCanonicalDocument } from "../src/application/psl-c-canonical";
import { buildPSLCDocumentModel } from "../src/application/psl-c-export";
import {
  buildDiagnosticAnswers,
  institutionalHealthReportTitle,
} from "../src/application/health-profile";
import type { DiagnosticAnswers } from "../src/application/health-profile";
import { ProfileIntegratedEditorialPreview } from "../src/ui/components/ProfileIntegratedEditorialPreview";
import { loadWorkspaceFromLocalStorage } from "../src/infrastructure/persistence/local-storage";
import { createMunicipalityRuntime } from './helpers/legacyProfileRuntime';
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

const EXPORT_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../fixtures/workspaces/granada-zaidin-synthetic-test.json"
);

let ws: MunicipalityWorkspace;
let psl: LocalHealthProfile;
let answers: DiagnosticAnswers;
let artifactCanonical: LocalHealthProfileArtifact;
let artifactLegacy: LocalHealthProfileArtifact;
let institutional: string;

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
      content:
        base.cierreInterpretativo.content || "Cierre interpretativo del equipo.",
    },
    priorizacionStatus: "complete",
    priorizacion: { ...base.priorizacion, consensoDocumentado: true },
  };
}

function compilar(withAnswers: boolean): LocalHealthProfileArtifact {
  const r = compileLocalHealthProfile({
    psl: validatedPSL(psl),
    municipalityName: ws.municipality.identity.name,
    municipalityProvince: "Granada",
    existingArtifactCount: 0,
    ...(withAnswers ? { diagnosticAnswers: answers } : {}),
  });
  if (!r.ok) throw new Error("compilación del arnés falló");
  return r.artifact;
}

function textoModelo(artifact: LocalHealthProfileArtifact): string {
  const m = buildPSLCDocumentModel(artifact);
  return [
    m.title,
    m.subtitle,
    ...m.portada,
    ...m.sections.flatMap((s) => [s.title, ...s.paragraphs]),
  ].join("\n");
}

beforeAll(() => {
  store.set(
    "compas-ng:workspace:granada-zaidin",
    readFileSync(EXPORT_PATH, "utf8")
  );
  const loaded = loadWorkspaceFromLocalStorage("granada-zaidin");
  if (loaded === null) throw new Error("El export vigente no rehidrata");
  ws = loaded;
  psl = createMunicipalityRuntime({ workspace: ws }).psl;
  answers = buildDiagnosticAnswers({
    workspace: ws,
    determinantTitles: [],
    assets: ws.evidenceStore.atoms
      .filter((a) => a.kind === "asset")
      .map((a) => ({ title: a.title, content: a.content })),
  });
  artifactCanonical = compilar(true);
  artifactLegacy = compilar(false);
  institutional = institutionalHealthReportTitle(
    psl.municipalityId,
    psl.healthReportTitle!
  );
});

describe("PASO 3 — B. paridad de cabecera (título institucional en el sello)", () => {
  it("la editorialView sellada usa el título institucional del Informe", () => {
    const doc = readSealedCanonicalDocument(artifactCanonical.canonicalDocument!);
    expect(doc).not.toBeNull();
    // El título del Informe es la primera fuente de la cabecera.
    expect(doc!.editorialView.header.sources[0]).toBe(institutional);
  });

  it("pantalla (sello) y export comparten el mismo título institucional", () => {
    // El export (document model) cita el título institucional en la base
    // documental; el sello lo lleva en la cabecera. Deben ser el mismo string.
    expect(textoModelo(artifactCanonical)).toContain(institutional);
    const doc = readSealedCanonicalDocument(artifactCanonical.canonicalDocument!);
    expect(doc!.editorialView.header.sources).toContain(institutional);
  });
});

describe("PASO 3 — C. el export es inmune a la mutación del workspace", () => {
  it("mutar answers tras compilar no altera el document model ni el sello", () => {
    const modeloAntes = buildPSLCDocumentModel(artifactCanonical);
    const selloAntes = readSealedCanonicalDocument(
      artifactCanonical.canonicalDocument!
    )!.editorialView;

    // Mutación real del objeto vivo posterior a la compilación.
    answers.senalesPresentes.push("SEÑAL-MUTANTE-PASO3");
    expect(answers.senalesPresentes).toContain("SEÑAL-MUTANTE-PASO3");

    const modeloDespues = buildPSLCDocumentModel(artifactCanonical);
    const selloDespues = readSealedCanonicalDocument(
      artifactCanonical.canonicalDocument!
    )!.editorialView;

    expect(modeloDespues).toEqual(modeloAntes);
    expect(selloDespues).toEqual(selloAntes);
    expect(JSON.stringify(modeloDespues)).not.toContain("SEÑAL-MUTANTE-PASO3");

    answers.senalesPresentes.pop();
  });
});

describe("PASO 3 — A. la pantalla del artefacto lee el sello", () => {
  it("ProfileIntegratedEditorialPreview renderiza la editorialView sellada", () => {
    const doc = readSealedCanonicalDocument(artifactCanonical.canonicalDocument!);
    const html = renderToStaticMarkup(
      <ProfileIntegratedEditorialPreview view={doc!.editorialView} />
    );
    // La lectura canónica del artefacto sale del sello: territorio, título del
    // Perfil e Informe institucional en la cabecera.
    expect(html).toContain(ws.municipality.identity.name);
    expect(html).toContain("Perfil de Salud Local");
    expect(html).toContain(institutional);
  });

  it("un artefacto legacy no tiene editorialView sellada (fallback al document model)", () => {
    expect(artifactLegacy.canonicalDocument).toBeUndefined();
  });
});

describe("PASO 3 (GOV-SALIDA-01) — lectura y espacio técnico hermanos", () => {
  it("el sello separa editorialView (lectura pura) y technicalSpace (hermano)", () => {
    const doc = readSealedCanonicalDocument(artifactCanonical.canonicalDocument!);
    expect(doc).not.toBeNull();
    // readingStatus vive en la lectura, no en la raíz del documento.
    expect(doc!.editorialView.readingStatus).toBeDefined();
    // La lectura editorial no contiene material técnico anidado.
    expect("technicalAnnex" in doc!.editorialView).toBe(false);
    // El espacio técnico es hermano de la lectura, no hijo, e íntegro.
    expect(doc!.technicalSpace.kind).toBe("canonical-technical-space");
    expect(doc!.technicalSpace.comparativeReferences.length).toBeGreaterThan(0);
    expect(doc!.technicalSpace.epistemicMatrix.length).toBeGreaterThan(0);
    // El cierre humano y la frontera institucional viven en la lectura.
    expect(doc!.editorialView.institutionalBoundary.kind).toBe(
      "institutional-boundary"
    );
  });
});
