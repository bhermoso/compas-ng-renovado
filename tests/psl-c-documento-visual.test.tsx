/**
 * tests/psl-c-documento-visual.test.tsx
 *
 * Lectura visual del Perfil en los documentos institucionales PSL-C.
 * El modelo documental (buildPSLCDocumentModel) incorpora las secciones
 * estructuradas del contrato visual: Salud en síntesis al inicio, ranking de
 * señales del Informe (peso textual, nunca prevalencia), tabla central de
 * trazadores con referencias, señales para deliberación, agenda del Grupo Motor
 * y anexo con los 23 indicadores y la matriz epistemológica. DOCX y PDF
 * serializan ese mismo modelo; el visor lo renderiza.
 *
 * FUENTE ÚNICA (paso 2): la lectura visual es propiedad del ARTEFACTO, no de una
 * entrada viva. Un artefacto con documento canónico congelado (esquema 2, se
 * compila con `diagnosticAnswers`) produce la forma rica desde su instantánea
 * sellada; un artefacto legacy (sin él) produce la forma textual clásica. Ya no
 * existe el par (artefacto + answers vivos): mismo artefacto → mismo documento.
 *
 * Invariante clave: el documento NO queda reducido a capítulos textuales.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { loadWorkspaceFromLocalStorage } from "../src/infrastructure/persistence/local-storage";
import { createMunicipalityRuntime } from "../src/application/runtime";
import { compileLocalHealthProfile } from "../src/application/health-profile-compiler";
import {
  createPerfilLocalDeSalud,
  addHypothesis,
  addOpenQuestion,
  updateSynthesis,
  buildDiagnosticAnswers,
} from "../src/application/health-profile";
import type { DiagnosticAnswers } from "../src/application/health-profile";
import {
  buildPSLCDocumentModel,
  buildPSLCPdf,
  exportPSLCArtifactToDocxBuffer,
  exportPSLCArtifactToPdfBuffer,
} from "../src/application/psl-c-export";
import type { PSLCDocumentModel } from "../src/application/psl-c-export";
import { PSLCArtifactViewer } from "../src/ui/components/PSLCArtifactViewer";
import type { LocalHealthProfileArtifact } from "../src/domain/health-profile-artifact";
import type {
  LocalHealthProfile,
  PerfilLocalDeSalud,
} from "../src/domain/health-profile";
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
    enunciado:
      "El malestar emocional detectado se concentra en población cuidadora.",
    plausibilidad: "moderada",
    indicios: ["señales de salud mental y apoyo social"],
    preguntasResolutoras: ["Explotación desagregada de GHQ-12"],
    autorNombre: "Equipo técnico",
  });
  perfil = addOpenQuestion(perfil, {
    espacio: "desigualdades",
    formulacion:
      "No se conoce la distribución interna de renta y vivienda del distrito.",
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

let ws: MunicipalityWorkspace;
// Artefacto canónico (esquema 2): congela la instantánea → forma rica.
let artifactCanonical: LocalHealthProfileArtifact;
// Artefacto legacy (sin canonicalDocument): camino textual clásico.
let artifactLegacy: LocalHealthProfileArtifact;
let answers: DiagnosticAnswers;
let model: PSLCDocumentModel;
let modelSinAnswers: PSLCDocumentModel;
let titulos: string[];

beforeAll(() => {
  store.set(
    "compas-ng:workspace:granada-zaidin",
    readFileSync(EXPORT_PATH, "utf8")
  );
  const loaded = loadWorkspaceFromLocalStorage("granada-zaidin");
  if (loaded === null) throw new Error("El export vigente no rehidrata");
  const perfil = perfilConConocimiento();
  ws = { ...loaded, perfilLocalDeSalud: perfil };
  const generated = createMunicipalityRuntime({ workspace: ws }).psl;
  const compilable: LocalHealthProfile = {
    ...generated,
    status: "validated",
    validatedAt: "2026-07-08T12:00:00.000Z",
    validatedBy: "Equipo técnico de salud pública",
    conclusiones: { ...generated.conclusiones, status: "authored" },
    cierreInterpretativo: {
      ...generated.cierreInterpretativo,
      status: "authored",
    },
    priorizacionStatus: "complete",
    priorizacion: {
      ...generated.priorizacion,
      consensoDocumentado: true,
      deliberacionNota: "El Grupo Motor deliberó y documentó el consenso.",
    },
  };
  answers = buildDiagnosticAnswers({
    workspace: ws,
    determinantTitles: [],
    assets: ws.evidenceStore.atoms
      .filter((a) => a.kind === "asset")
      .map((a) => ({ title: a.title, content: a.content })),
  });
  // Canónico: la instantánea de respuestas se sella en el artefacto.
  const canonical = compileLocalHealthProfile({
    psl: compilable,
    perfil,
    municipalityName: ws.municipality.identity.name,
    municipalityProvince: ws.municipality.identity.province ?? "",
    existingArtifactCount: 0,
    diagnosticAnswers: answers,
  });
  // Legacy: misma compilación sin instantánea → sin documento canónico.
  const legacy = compileLocalHealthProfile({
    psl: compilable,
    perfil,
    municipalityName: ws.municipality.identity.name,
    municipalityProvince: ws.municipality.identity.province ?? "",
    existingArtifactCount: 0,
  });
  if (!canonical.ok || !legacy.ok) throw new Error("compilación del arnés falló");
  artifactCanonical = canonical.artifact;
  artifactLegacy = legacy.artifact;
  model = buildPSLCDocumentModel(artifactCanonical);
  modelSinAnswers = buildPSLCDocumentModel(artifactLegacy);
  titulos = model.sections.map((s) => s.title);
}, 60000);

// ══════════════════════════════════════════════════════════════════════════════
// Salud en síntesis al inicio del documento
// ══════════════════════════════════════════════════════════════════════════════

describe("documento visual — imagen general", () => {
  it("abre el documento con la imagen general en mensajes destacados", () => {
    // GOV-SALIDA-01 (PR-2): el documento v2 proyecta la LECTURA canónica: la
    // apertura es «Imagen general» (la antigua «Salud en síntesis» quedó
    // absorbida por la lectura editorial).
    expect(titulos[0]).toBe("Imagen general");
    expect(titulos.indexOf("Imagen general")).toBeLessThan(
      titulos.indexOf("Lectura integrada del territorio")
    );
    const sintesis = model.sections[0];
    expect(sintesis.kind).toBe("summaryCards");
    const cards = sintesis.cards!;
    expect(cards.length).toBeGreaterThanOrEqual(3);
    // La imagen general abre con mensajes sustantivos, todos destacados.
    expect(cards.filter((c) => c.destacado)).toHaveLength(cards.length);
    expect(cards[0].destacado).toBe(true);
    expect(cards[0].texto).not.toMatch(/^(Este perfil|Este documento|La metodolog)/);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Lectura integrada — aviso de no exhaustividad en el documento sellado
// ══════════════════════════════════════════════════════════════════════════════

describe("documento visual — lectura integrada", () => {
  it("encabeza con el aviso de no exhaustividad (paridad con la pantalla)", () => {
    // GOV-SALIDA-01: el documento sellado (DOCX/PDF/visor) lleva ahora el aviso
    // metodológico de no exhaustividad que la lectura viva ya mostraba, como
    // primer párrafo de «Lectura integrada del territorio» (Art. 17 bis).
    const lectura = model.sections.find(
      (s) => s.title === "Lectura integrada del territorio"
    );
    expect(lectura).toBeDefined();
    expect(lectura!.paragraphs[0]).toContain("No son una reproducción exhaustiva");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Ranking de señales del Informe (la visualización del documento)
// ══════════════════════════════════════════════════════════════════════════════

describe("documento visual — señales del Informe", () => {
  it("existe como ranking con peso textual/menciones, nunca prevalencia", () => {
    const seccion = model.sections.find(
      (s) => s.title === "Señales sanitarias del Informe de salud"
    );
    expect(seccion).toBeDefined();
    expect(seccion!.kind).toBe("barRanking");
    const ranking = seccion!.ranking!;
    expect(ranking.length).toBeGreaterThanOrEqual(4);
    // Orden descendente, con máximo compartido para la proporción de barras
    for (let i = 1; i < ranking.length; i++) {
      expect(ranking[i - 1].valor).toBeGreaterThanOrEqual(ranking[i].valor);
    }
    for (const item of ranking) {
      expect(item.max).toBeGreaterThanOrEqual(item.valor);
    }
    const pie = seccion!.paragraphs.join(" ");
    expect(pie).toContain("peso textual");
    expect(pie).toContain("menciones");
    expect(pie).toContain("no prevalencia");
    expect(JSON.stringify(seccion)).not.toMatch(
      /prevalencia de|prevalencia estimada|%/
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Tabla central de trazadores con referencias legítimas
// ══════════════════════════════════════════════════════════════════════════════

describe("documento visual — tabla de trazadores", () => {
  it("existe con valores, Granada y Andalucía, y remite a los 23 del anexo", () => {
    const seccion = model.sections.find(
      (s) => s.title === "Indicadores trazadores: valores y referencias"
    );
    expect(seccion).toBeDefined();
    expect(seccion!.kind).toBe("table");
    const tabla = seccion!.table!;
    // Cabeceras de la tabla de trazadores tal como las muestra la lectura
    // canónica (mismas que la pantalla). Los 23 indicadores completos viven en
    // «Referencias comparativas» del espacio técnico, no como nota aquí.
    expect(tabla.headers).toEqual([
      "Bloque",
      "Indicador",
      "Valor",
      "Ref. Granada",
      "Ref. Andalucía",
      "Escala",
      "Lectura",
    ]);
    expect(tabla.rows.length).toBeGreaterThanOrEqual(6);
    // Comparaciones legítimas con Andalucía donde existen
    expect(
      tabla.rows.some((r) => r[6].includes("andaluza"))
    ).toBe(true);
  });

  it("los proxies se presentan como contexto, nunca como estimación distrital", () => {
    const seccion = model.sections.find(
      (s) => s.title === "Indicadores trazadores: valores y referencias"
    );
    const escalas = seccion!.table!.rows.map((r) => r[5]);
    expect(escalas.some((e) => e === "proxy contextual")).toBe(true);
    for (const e of escalas) {
      expect(["proxy contextual", "muestra local"]).toContain(e);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Señales para deliberación y agenda del Grupo Motor
// ══════════════════════════════════════════════════════════════════════════════

describe("documento visual — deliberación y Grupo Motor", () => {
  it("las señales para deliberación ya no son sección del documento (contrato v2.0.0, Art. 16 quater)", () => {
    expect(model.sections.find((s) => s.title === "Señales principales para deliberación")).toBeUndefined();
    expect(model.sections.some((s) => s.kind === "compactSignalList")).toBe(false);
  });

  it("la agenda del Grupo Motor ya no es sección del documento (contrato v2.0.0, Art. 16 quater)", () => {
    expect(model.sections.find((s) => s.title === "Qué debe discutir el Grupo Motor")).toBeUndefined();
    expect(model.sections.some((s) => s.kind === "groupMotorAgenda")).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Anexo técnico estructurado: 23 indicadores y matriz epistemológica
// ══════════════════════════════════════════════════════════════════════════════

describe("documento visual — anexo técnico", () => {
  it("los 23 indicadores completos constan en el anexo como tabla", () => {
    const seccion = model.sections.find(
      (s) => s.title === "Referencias comparativas de los indicadores"
    );
    expect(seccion).toBeDefined();
    expect(seccion!.level).toBe(2);
    expect(seccion!.kind).toBe("table");
    expect(seccion!.table!.rows).toHaveLength(23);
    // Dentro del anexo técnico
    expect(
      titulos.indexOf("Referencias comparativas de los indicadores")
    ).toBeGreaterThan(titulos.indexOf("Anexo técnico"));
  });

  it("la matriz epistemológica completa cierra la trazabilidad del anexo", () => {
    const seccion = model.sections.find(
      (s) => s.title === "Matriz epistemológica"
    );
    expect(seccion).toBeDefined();
    expect(seccion!.level).toBe(2);
    expect(seccion!.kind).toBe("table");
    expect(seccion!.table!.headers).toEqual([
      "Señal",
      "Escala",
      "Estatus causal",
      "Pregunta",
    ]);
    expect(seccion!.table!.rows.length).toBeGreaterThanOrEqual(10);
    // Las notas de bloque (desigualdad no evaluable ≠ ausencia) acompañan
    expect(seccion!.paragraphs.length).toBeGreaterThanOrEqual(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// El documento no vuelve al informe textual plano
// ══════════════════════════════════════════════════════════════════════════════

describe("documento visual — identidad no textual", () => {
  it("el documento no queda reducido a capítulos textuales", () => {
    const estructuradas = model.sections.filter(
      (s) => s.kind !== undefined && s.kind !== "text"
    );
    expect(estructuradas.length).toBeGreaterThanOrEqual(6);
    const kinds = new Set(estructuradas.map((s) => s.kind));
    for (const kind of [
      "summaryCards",
      "barRanking",
      "table",
      "compactSignalList",
      "groupMotorAgenda",
    ]) {
      expect(kinds.has(kind as never)).toBe(true);
    }
  });

  it("un artefacto legacy (sin documento canónico) conserva la forma textual clásica", () => {
    expect(artifactLegacy.canonicalDocument).toBeUndefined();
    expect(modelSinAnswers.sections.every((s) => s.kind === undefined)).toBe(
      true
    );
    expect(modelSinAnswers.sections[0].title).toBe(
      "Lectura ejecutiva territorial"
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Serialización: DOCX y PDF llevan la lectura visual
// ══════════════════════════════════════════════════════════════════════════════

describe("documento visual — serialización DOCX y PDF", () => {
  it("el DOCX del artefacto canónico es un ZIP válido y mayor que el legacy", async () => {
    const conVisual = await exportPSLCArtifactToDocxBuffer(artifactCanonical);
    const textual = await exportPSLCArtifactToDocxBuffer(artifactLegacy);
    expect(conVisual[0]).toBe(0x50);
    expect(conVisual[1]).toBe(0x4b);
    expect(conVisual.length).toBeGreaterThan(textual.length);
  });

  it("el PDF del artefacto canónico es válido, con más páginas y al menos una visualización", async () => {
    const conVisual = await exportPSLCArtifactToPdfBuffer(artifactCanonical);
    const textual = await exportPSLCArtifactToPdfBuffer(artifactLegacy);
    // Cabecera %PDF
    expect(String.fromCharCode(...conVisual.slice(0, 5))).toBe("%PDF-");
    expect(conVisual.length).toBeGreaterThan(textual.length);
    const paginasConVisual = buildPSLCPdf(model).getNumberOfPages();
    const paginasTextual = buildPSLCPdf(modelSinAnswers).getNumberOfPages();
    expect(paginasConVisual).toBeGreaterThan(paginasTextual);
    // La visualización del PDF procede del ranking del Informe: rectángulos
    // rellenos proporcionales (operador `re` + relleno `f` en el contenido).
    const contenido = Buffer.from(conVisual).toString("latin1");
    expect(contenido).toMatch(/re\s*\nf/);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Visor institucional: mismo modelo, misma lectura visual
// ══════════════════════════════════════════════════════════════════════════════

describe("documento visual — visor institucional", () => {
  it("renderiza síntesis, ranking, tablas y agenda desde el artefacto canónico", () => {
    const html = renderToStaticMarkup(
      <PSLCArtifactViewer artifact={artifactCanonical} />
    );
    expect(html).toContain("Imagen general");
    expect(html).toContain("pslc-viewer__card--destacado");
    expect(html).toContain("pslc-viewer__ranking");
    expect(html).toContain("pslc-viewer__tabla");
    expect(html).toContain("Quién puede quedar fuera:");
    expect(html).toContain("Matriz epistemológica");
    // La forma clásica sigue disponible en un artefacto legacy
    const clasico = renderToStaticMarkup(
      <PSLCArtifactViewer artifact={artifactLegacy} />
    );
    expect(clasico).not.toContain("pslc-viewer__ranking");
    expect(clasico).toContain("Lectura ejecutiva territorial");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Línea vigente
// ══════════════════════════════════════════════════════════════════════════════

describe("línea vigente", () => {
  it("el expediente 56/92 permanece intacto", () => {
    expect(ws.repository.documents.length).toBe(20);
    expect(ws.evidenceStore.atoms.length).toBe(92);
    expect(
      ws.evidenceStore.atoms.filter(
        (a) => a.provenance.origin === "localiza-salud"
      ).length
    ).toBe(56);
  });
});
