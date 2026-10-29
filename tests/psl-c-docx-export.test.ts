/**
 * tests/psl-c-docx-export.test.ts
 *
 * Export DOCX del artefacto institucional congelado PSL-C.
 * Se testea la capa intermedia estructurada (buildPSLCDocumentModel, pura)
 * y la serialización como humo (el binario es un ZIP válido no vacío).
 *
 * Estructura protegida: seis capítulos canónicos I–VI + bloques
 * institucionales no capitulares; sin capítulo VII; sin espacios de trabajo
 * internos ni textos de la UI; con hash, cautelas y frontera con el Plan
 * de Acción.
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
  pslcDocxFileName,
  exportPSLCArtifactToDocxBuffer,
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
let textoCompleto: string;

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
  textoCompleto = [
    model.title,
    model.subtitle,
    ...model.portada,
    ...model.sections.flatMap((s) => [s.title, ...s.paragraphs]),
  ].join("\n");
}, 60000);

describe("export DOCX — estructura del modelo documental", () => {
  it("integra el contenido de los seis capítulos canónicos sin crear capítulo VII", () => {
    // Los capítulos I–VI siguen intactos en el artefacto (contrato); el
    // modelo documental integra su contenido en la lectura principal.
    expect(NARRATIVE_CHAPTER_TITLES).toHaveLength(6);
    expect(textoCompleto).toContain("Indicadores trazadores por bloque"); // Cap. III
    expect(textoCompleto).toContain("Lectura desde la epidemiología social"); // Cap. IV
    expect(textoCompleto).toContain("concentraciones de capacidad"); // Cap. V
    expect(textoCompleto).toContain("prioridades diagnósticas potenciales"); // Cap. VI
    expect(textoCompleto).toContain("contexto exploratorio"); // Cap. I (anexo)
    const titulos = model.sections.map((s) => s.title);
    expect(titulos.some((t) => t.startsWith("VII."))).toBe(false);
    expect(textoCompleto).not.toMatch(/(^|\n)VII\.\s/);
  });

  it("el documento principal abre con la lectura territorial y el anexo técnico cierra", () => {
    const titulos = model.sections.map((s) => s.title);
    expect(titulos[0]).toBe("Lectura ejecutiva territorial");
    const principal = [
      "Lectura ejecutiva territorial",
      "Situación de salud y bienestar",
      "Desafíos diagnósticos del territorio",
      "Capacidades y oportunidades comunitarias",
      "Incertidumbres críticas",
      "Conclusiones para la deliberación",
    ];
    expect(titulos.slice(0, 6)).toEqual(principal);
    // El anexo técnico agrupa el expediente al final
    const anexoIdx = titulos.indexOf("Anexo técnico");
    expect(anexoIdx).toBeGreaterThan(titulos.indexOf("Frontera institucional"));
    for (const sub of [
      "Alcance, fuentes y escala de la evidencia",
      "Base documental",
      "Cautelas metodológicas",
      "Estado del conocimiento",
      "Trazabilidad",
    ]) {
      expect(titulos.indexOf(sub)).toBeGreaterThan(anexoIdx);
    }
  });

  it("la lectura ejecutiva reúne situación, desafíos, capacidades e incertidumbres", () => {
    const lectura = model.sections.find(
      (s) => s.title === "Lectura ejecutiva territorial"
    );
    const texto = lectura!.paragraphs.join("\n");
    expect(texto).toContain("se ordena en torno a"); // señales de salud
    expect(texto).toContain("hipótesis"); // desafíos diagnósticos
    expect(texto).toContain("capacidades territoriales se concentran"); // oportunidades
    expect(texto).toContain("tensión interpretativa"); // incertidumbre crítica
    expect(texto).toContain("Síntesis diagnóstica del equipo técnico.");
  });

  it("la trazabilidad y el hash viven en el anexo, no en la portada", () => {
    expect(model.portada.join("\n")).not.toContain(artifact.sourceHash);
    const trazabilidad = model.sections.find((s) => s.title === "Trazabilidad");
    expect(trazabilidad!.paragraphs.join("\n")).toContain(artifact.sourceHash);
  });

  it("las incertidumbres críticas y las capacidades tienen sección propia y prudente", () => {
    const incert = model.sections.find((s) => s.title === "Incertidumbres críticas");
    expect(incert!.paragraphs.join("\n")).toContain("Incertidumbres del diagnóstico.");
    expect(incert!.paragraphs.join("\n")).toContain("Pregunta abierta (urgencia alta)");
    const capacidades = model.sections.find(
      (s) => s.title === "Capacidades y oportunidades comunitarias"
    );
    const textoCap = capacidades!.paragraphs.join("\n");
    expect(textoCap).toContain("56 activos");
    expect(textoCap).toContain("no prueban cobertura ni resultado");
    expect(textoCap).toContain("requieren validación territorial");
  });

  it("no exporta espacios de trabajo internos ni textos de la UI", () => {
    expect(textoCompleto).not.toMatch(
      /Redactar documento|Nueva hipótesis|Documentar deliberación|Revertir a borrador|Guardar|Espacio de trabajo del equipo técnico|botón|pantalla/i
    );
  });

  it("incluye hash y trazabilidad", () => {
    expect(textoCompleto).toContain(artifact.sourceHash);
    expect(textoCompleto).toContain("Trazabilidad");
    expect(textoCompleto).toContain(artifact.sourcePSLId);
  });

  it("incluye cautelas y frontera con el Plan de Acción", () => {
    expect(textoCompleto).toContain("Cautelas metodológicas");
    expect(textoCompleto).toContain(
      "no formula recomendaciones, actuaciones, programas ni objetivos estratégicos"
    );
    expect(textoCompleto).toContain("Plan de Acción");
    expect(textoCompleto).toContain("fase posterior del proceso de planificación");
    expect(textoCompleto).toContain("contexto exploratorio");
  });

  it("no incluye recomendaciones, programas ni causalidad demostrada", () => {
    expect(textoCompleto).not.toMatch(
      /se recomienda|recomendamos|debe implantarse|debe ponerse en marcha|programa de|l[íi]nea estrat[ée]gica|objetivo operativo/i
    );
    expect(textoCompleto).not.toMatch(
      /demuestra que|queda demostrado|causa directa|relaci[óo]n causal confirmada/i
    );
  });

  it("el nombre de archivo es estable y seguro", () => {
    expect(pslcDocxFileName(artifact)).toBe("psl-c-granada-zaidin-2027-2030.docx");
    expect(model.fileName).toBe("psl-c-granada-zaidin-2027-2030.docx");
  });
});

describe("export DOCX — serialización", () => {
  it("produce un DOCX binario válido (ZIP no vacío)", async () => {
    const buffer = await exportPSLCArtifactToDocxBuffer(artifact);
    expect(buffer.length).toBeGreaterThan(1000);
    // Firma ZIP: PK
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4b);
  });
});
