/**
 * tests/psl-c-pdf-export.test.ts
 *
 * Export PDF del artefacto institucional congelado PSL-C.
 * El PDF se serializa desde el MISMO modelo documental puro que el DOCX
 * (buildPSLCDocumentModel): aquí se verifica esa capa común y la firma
 * binaria del PDF, sin tests de maquetación visual.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadWorkspaceFromLocalStorage } from "../src/infrastructure/persistence/local-storage";
import { createMunicipalityRuntime } from './helpers/legacyProfileRuntime';
import { compileLocalHealthProfile } from "../src/application/health-profile-compiler";
import {
  createPerfilLocalDeSalud,
  addHypothesis,
  addOpenQuestion,
  updateSynthesis,
  NARRATIVE_CHAPTER_TITLES,
} from "../src/application/health-profile";
import {
  buildPSLCDocumentModel,
  pslcPdfFileName,
  pslcDocxFileName,
  exportPSLCArtifactToPdfBuffer,
} from "../src/application/psl-c-export";
import type { PSLCDocumentModel } from "../src/application/psl-c-export";
import type { LocalHealthProfileArtifact } from "../src/domain/health-profile-artifact";
import type { LocalHealthProfile, PerfilLocalDeSalud } from "../src/domain/health-profile";
import type { MunicipalityWorkspace } from "../src/domain/workspace";

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

function perfilConConocimiento(): PerfilLocalDeSalud {
  let perfil = createPerfilLocalDeSalud("granada-zaidin");
  perfil = addHypothesis(perfil, {
    espacio: "situacion-salud",
    enunciado: "El malestar emocional detectado se concentra en población cuidadora.",
    plausibilidad: "moderada",
    indicios: ["señales de salud mental y apoyo social"],
    preguntasResolutoras: ["Explotación desagregada de GHQ-12"],
    autorNombre: "Equipo técnico",
  });
  perfil = addOpenQuestion(perfil, {
    espacio: "desigualdades",
    formulacion: "No se conoce la distribución interna de renta y vivienda del distrito.",
    relevancia: "condiciona la lectura de desigualdades en salud.",
    urgencia: "alta",
    viasResolucion: ["Sección censal INE"],
  });
  perfil = updateSynthesis(
    perfil,
    "El distrito combina un patrón contextual de malestar psicosocial con un tejido comunitario denso."
  );
  return perfil;
}

let artifact: LocalHealthProfileArtifact;
let model: PSLCDocumentModel;
let textoModelo: string;

beforeAll(() => {
  store.set(
    "compas-ng:workspace:granada-zaidin",
    readFileSync(EXPORT_PATH, "utf8")
  );
  const loaded = loadWorkspaceFromLocalStorage("granada-zaidin");
  if (loaded === null) throw new Error("El export vigente no rehidrata");
  const perfil = perfilConConocimiento();
  const ws: MunicipalityWorkspace = { ...loaded, perfilLocalDeSalud: perfil };
  const generated = createMunicipalityRuntime({ workspace: ws }).psl;
  const compilable: LocalHealthProfile = {
    ...generated,
    status: "validated",
    validatedAt: "2026-07-08T12:00:00.000Z",
    validatedBy: "Equipo técnico de salud pública",
    conclusiones: { ...generated.conclusiones, status: "authored" },
    cierreInterpretativo: { ...generated.cierreInterpretativo, status: "authored" },
    priorizacionStatus: "complete",
    priorizacion: {
      ...generated.priorizacion,
      consensoDocumentado: true,
      deliberacionNota: "El Grupo Motor deliberó y documentó el consenso.",
    },
  };
  const result = compileLocalHealthProfile({
    psl: compilable,
    perfil,
    municipalityName: ws.municipality.identity.name,
    municipalityProvince: ws.municipality.identity.province ?? "",
    existingArtifactCount: 0,
  });
  if (!result.ok) throw new Error("compilación del arnés falló");
  artifact = result.artifact;
  model = buildPSLCDocumentModel(artifact);
  textoModelo = [
    model.title,
    model.subtitle,
    ...model.portada,
    ...model.sections.flatMap((s) => [s.title, ...s.paragraphs]),
  ].join("\n");
}, 60000);

describe("export PDF — capa común con el DOCX", () => {
  it("el PDF parte del mismo modelo documental que el DOCX", () => {
    // Mismo constructor, mismos nombres base: solo cambia la extensión.
    expect(pslcPdfFileName(artifact)).toBe("psl-c-granada-zaidin-2027-2030.pdf");
    expect(pslcPdfFileName(artifact)).toBe(
      pslcDocxFileName(artifact).replace(/\.docx$/, ".pdf")
    );
  });

  it("el modelo compartido integra los seis capítulos canónicos sin capítulo VII", () => {
    expect(NARRATIVE_CHAPTER_TITLES).toHaveLength(6);
    const titulos = model.sections.map((s) => s.title);
    expect(titulos[0]).toBe("Lectura ejecutiva territorial");
    expect(titulos).toContain("Anexo técnico");
    expect(titulos.some((t) => t.startsWith("VII."))).toBe(false);
    // Contenido de los capítulos integrado en la lectura principal
    expect(textoModelo).toContain("Indicadores trazadores por bloque");
    expect(textoModelo).toContain("Lectura desde la epidemiología social");
    expect(textoModelo).toContain("concentraciones de capacidad");
    expect(textoModelo).toContain("prioridades diagnósticas potenciales");
  });

  it("el modelo compartido incluye hash, cautelas y frontera con el Plan de Acción", () => {
    expect(textoModelo).toContain(artifact.sourceHash);
    expect(textoModelo).toContain("Cautelas metodológicas");
    expect(textoModelo).toContain(
      "no formula recomendaciones, actuaciones, programas ni objetivos estratégicos"
    );
    expect(textoModelo).toContain("Plan de Acción");
    expect(textoModelo).toContain("fase posterior del proceso de planificación");
  });

  it("contratos negativos: sin textos de UI, sin recomendaciones, sin causalidad", () => {
    expect(textoModelo).not.toMatch(
      /Redactar documento|Nueva hipótesis|Documentar deliberación|Revertir a borrador|Descargar|Volver a la ruta|botón|pantalla/i
    );
    expect(textoModelo).not.toMatch(
      /se recomienda|recomendamos|debe implantarse|debe ponerse en marcha|programa de|l[íi]nea estrat[ée]gica/i
    );
    expect(textoModelo).not.toMatch(
      /demuestra que|queda demostrado|causa directa|relaci[óo]n causal confirmada/i
    );
  });
});

describe("export PDF — serialización", () => {
  it("produce un PDF binario válido con firma %PDF", async () => {
    const buffer = await exportPSLCArtifactToPdfBuffer(artifact);
    expect(buffer.length).toBeGreaterThan(2000);
    const firma = String.fromCharCode(buffer[0], buffer[1], buffer[2], buffer[3]);
    expect(firma).toBe("%PDF");
  });
});
