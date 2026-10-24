/**
 * tests/psl-c-artifact-viewer.test.tsx
 *
 * Visor institucional de solo lectura del artefacto congelado PSL-C.
 * Renderiza el componente a marcado estático (sin navegador) sobre un
 * artefacto compilado desde el expediente vigente Granada-Zaidín 56/92 y
 * verifica que el documento visible:
 *   - contiene portada, base documental, conclusiones, estado del
 *     conocimiento y cautelas;
 *   - mantiene la frontera institucional con el Plan de Acción;
 *   - no introduce recomendaciones, programas ni causalidad demostrada;
 *   - no inventa datos ausentes (EKC sin perfil → "no disponible").
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
  addInterpretation,
  addHypothesis,
  addOpenQuestion,
  updateSynthesis,
  buildDiagnosticAnswers,
} from "../src/application/health-profile";
import { PSLCArtifactViewer } from "../src/ui/components/PSLCArtifactViewer";
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
  perfil = addInterpretation(perfil, {
    espacio: "determinantes",
    enunciado:
      "La presión del envejecimiento sobre las redes de cuidado condiciona la salud del distrito.",
    certeza: "moderada",
    evidenciaIds: ["localiza-atom-1"],
    autorNombre: "Equipo técnico",
  });
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
    "El distrito combina un patrón contextual de malestar psicosocial con un tejido comunitario denso orientado a mayores."
  );
  return perfil;
}

function pslCompilable(generated: LocalHealthProfile): LocalHealthProfile {
  return {
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
      deliberacionNota:
        "El Grupo Motor deliberó sobre las cuestiones de contraste y documentó el consenso alcanzado.",
    },
  };
}

let ws: MunicipalityWorkspace;
let generated: LocalHealthProfile;
let artifact: LocalHealthProfileArtifact;
let html: string;

beforeAll(() => {
  store.set(
    "compas-ng:workspace:granada-zaidin",
    readFileSync(EXPORT_PATH, "utf8")
  );
  const loaded = loadWorkspaceFromLocalStorage("granada-zaidin");
  if (loaded === null) throw new Error("El export vigente no rehidrata");
  const perfil = perfilConConocimiento();
  ws = { ...loaded, perfilLocalDeSalud: perfil };
  generated = createMunicipalityRuntime({ workspace: ws }).psl;
  const result = compileLocalHealthProfile({
    psl: pslCompilable(generated),
    perfil,
    compiledBy: "Equipo técnico de salud pública",
    municipalityName: ws.municipality.identity.name,
    municipalityProvince: ws.municipality.identity.province ?? "",
    existingArtifactCount: 0,
  });
  if (!result.ok) throw new Error("La compilación del arnés falló");
  artifact = result.artifact;
  html = renderToStaticMarkup(<PSLCArtifactViewer artifact={artifact} />);
}, 60000);

describe("visor PSL-C — documento institucional renderizado", () => {
  it("renderiza portada con municipio, versión y validación; el hash vive en el anexo", () => {
    expect(html).toContain("Perfil de Salud Local de Granada-Zaidín");
    expect(html).toContain("PSL-C/v1");
    expect(html).toContain("Artefacto institucional congelado");
    expect(html).toContain("Equipo técnico de salud pública");
    // La trazabilidad completa está presente, pero en el anexo técnico
    expect(html).toContain(artifact.sourceHash);
    expect(html).toContain("consta en el anexo técnico");
  });

  it("muestra la base documental en el anexo y declara la compilación institucional", () => {
    expect(html).toContain("92 elementos");
    expect(html).toContain("estudios complementarios");
    expect(html).toContain("se preserva íntegro y se referencia sin atomizar");
    expect(html).toContain(
      "compilación institucional del diagnóstico validado"
    );
    expect(html).toContain("no contiene recomendaciones");
  });

  it("abre con la lectura ejecutiva y desarrolla situación, desafíos, capacidades e incertidumbres", () => {
    expect(html).toContain("<h3>Lectura ejecutiva territorial</h3>");
    expect(html).toContain("Situación de salud y bienestar");
    expect(html).toContain("Desafíos diagnósticos del territorio");
    expect(html).toContain("Capacidades y oportunidades comunitarias");
    expect(html).toContain("Incertidumbres críticas");
    expect(html).toContain("Conclusiones para la deliberación");
    expect(html).toContain("El diagnóstico apunta a un distrito");
    expect(html).toContain("Síntesis diagnóstica del equipo técnico.");
    expect(html).toContain("contexto exploratorio");
    expect(html).toContain("Ninguna de estas lecturas constituye causalidad demostrada");
    expect(html).toContain("Cierre interpretativo");
    expect(html).toContain("Anexo técnico");
  });

  it("muestra el conocimiento técnico integrado: hipótesis en desafíos, preguntas en incertidumbres", () => {
    expect(html).toContain("Estado del conocimiento");
    expect(html).toContain("Interpretaciones activas");
    expect(html).toContain("Hipótesis en estudio");
    expect(html).toContain("El malestar emocional detectado se concentra en población cuidadora.");
    expect(html).toContain("plausibilidad moderada, pendiente de");
    expect(html).toContain("distribución interna de renta y vivienda");
    expect(html).toContain("urgencia alta");
    expect(html).toContain("incorporada a la lectura ejecutiva del documento");
    expect(html).toContain("Cautelas metodológicas");
  });

  it("mantiene la frontera institucional con el Plan de Acción", () => {
    expect(html).toContain("Frontera institucional");
    expect(html).toContain(
      "no formula recomendaciones, actuaciones, programas ni objetivos estratégicos"
    );
    expect(html).toContain("Plan de Acción");
    expect(html).toContain("fase posterior del proceso de planificación");
    expect(html).toContain("Consenso del Grupo Motor documentado:");
  });

  it("no introduce recomendaciones, programas ni causalidad demostrada", () => {
    expect(html).not.toMatch(
      /se recomienda|recomendamos|debe implantarse|debe ponerse en marcha|programa de|l[íi]nea estrat[ée]gica|objetivo operativo/i
    );
    expect(html).not.toMatch(
      /demuestra que|queda demostrado|causa directa|relaci[óo]n causal confirmada/i
    );
  });

  it("integra el contenido de los seis capítulos sin numerar un capítulo VII", () => {
    // Contenido de los capítulos I–VI presente en las secciones de lectura
    expect(html).toContain("Indicadores trazadores por bloque"); // Cap. III
    expect(html).toContain("Lectura desde la epidemiología social"); // Cap. IV
    expect(html).toContain("concentraciones de capacidad"); // Cap. V
    expect(html).toContain("prioridades diagnósticas potenciales"); // Cap. VI
    expect(html).not.toContain("VII.");
    // El cierre y la frontera se presentan como bloques con nombre propio.
    expect(html).toContain("Cierre interpretativo");
    expect(html).toContain("Frontera institucional");
  });

  it("expone la estructura de clases que anclan el estilo institucional e imprimible", () => {
    // Ganchos estables del CSS del visor y de la salida imprimible
    // (@media print oculta todo salvo .pslc-viewer): si cambian de nombre,
    // el documento pierde su presentación y su impresión.
    expect(html).toContain('class="pslc-viewer"');
    expect(html).toContain("pslc-viewer__portada");
    expect(html).toContain("pslc-viewer__meta");
    expect(html).toContain("pslc-viewer__capitulo");
    expect(html).toContain("pslc-viewer__frontera");
  });

  it("distingue el cierre de autoría humana con tratamiento propio (vista canónica)", () => {
    // GOV-SALIDA-01 (humanClosing en el visor): en la vista canónica sellada, el
    // cierre de autoría humana (`human-closing`) se rinde CON marca propia
    // (`pslc-viewer__cierre-humano`), distinguiéndolo del cuerpo compilado y del
    // cierre de frontera (voz autoral, Art. 16). Requiere artefacto v2 (con
    // `diagnosticAnswers`) y un cierre con contenido.
    const answers = buildDiagnosticAnswers({
      workspace: ws,
      determinantTitles: [],
      assets: ws.evidenceStore.atoms
        .filter((a) => a.kind === "asset")
        .map((a) => ({ title: a.title, content: a.content })),
    });
    const cierreTexto =
      "El equipo técnico interpreta que sostener las redes de cuidado del distrito es la clave de lectura del diagnóstico.";
    const pslConCierre: LocalHealthProfile = {
      ...pslCompilable(generated),
      cierreInterpretativo: {
        ...generated.cierreInterpretativo,
        content: cierreTexto,
        status: "authored",
      },
    };
    const result = compileLocalHealthProfile({
      psl: pslConCierre,
      perfil: perfilConConocimiento(),
      compiledBy: "Equipo técnico de salud pública",
      municipalityName: ws.municipality.identity.name,
      municipalityProvince: ws.municipality.identity.province ?? "",
      existingArtifactCount: 0,
      diagnosticAnswers: answers,
    });
    if (!result.ok) throw new Error("compilación canónica falló");
    // Artefacto v2: el visor consume la proyección canónica (no la ruta legacy).
    expect(result.artifact.canonicalDocument).toBeDefined();
    const canonicalHtml = renderToStaticMarkup(
      <PSLCArtifactViewer artifact={result.artifact} />
    );
    // El cierre humano se rinde, con su título, su contenido y su marca propia.
    expect(canonicalHtml).toContain("pslc-viewer__cierre-humano");
    expect(canonicalHtml).toContain("Cierre interpretativo");
    expect(canonicalHtml).toContain(cierreTexto);
    // La marca es distinta de la frontera (voz autoral vs institucional).
    expect(canonicalHtml).toContain("pslc-viewer__frontera");
  });

  it("el cierre elegido se sella y se rinde al final, antes de la frontera (Art. 16 ter 8)", () => {
    const base = buildDiagnosticAnswers({
      workspace: ws,
      determinantTitles: [],
      assets: ws.evidenceStore.atoms
        .filter((a) => a.kind === "asset")
        .map((a) => ({ title: a.title, content: a.content })),
    });
    const answers = {
      ...base,
      cierreElegido: {
        conclusions: [
          { etiqueta: "C1", tipo: "interpretacion" as const, texto: "Conclusión elegida de prueba.", evidencia: ["Informe, pág. 30"], elegidaPor: "A", elegidaEl: "2026-10-22" },
        ],
        orientations: [
          { etiqueta: "O1", tipo: "orientacion" as const, texto: "Orientación elegida de prueba.", evidencia: ["C1"], sustento: 1 as const, derivaDe: ["C1"], elegidaPor: "A", elegidaEl: "2026-10-22" },
        ],
      },
    };
    const result = compileLocalHealthProfile({
      psl: pslCompilable(generated),
      perfil: perfilConConocimiento(),
      compiledBy: "Equipo técnico de salud pública",
      municipalityName: ws.municipality.identity.name,
      municipalityProvince: ws.municipality.identity.province ?? "",
      existingArtifactCount: 0,
      diagnosticAnswers: answers,
    });
    if (!result.ok) throw new Error("compilación canónica falló");
    const html = renderToStaticMarkup(<PSLCArtifactViewer artifact={result.artifact} />);
    const iC = html.indexOf("Conclusión elegida de prueba.");
    const iO = html.indexOf("Orientación elegida de prueba.");
    const iF = html.indexOf("Frontera institucional");
    expect(iC).toBeGreaterThan(-1);
    expect(iO).toBeGreaterThan(iC);
    expect(iF).toBeGreaterThan(iO);
    expect(html).toContain("Deriva de: C1.");
    expect(html).toContain("Sustento de grado 1.");
    // Sin cierre elegido no aparece ninguna de las dos secciones.
    const sin = compileLocalHealthProfile({
      psl: pslCompilable(generated),
      perfil: perfilConConocimiento(),
      compiledBy: "Equipo técnico de salud pública",
      municipalityName: ws.municipality.identity.name,
      municipalityProvince: ws.municipality.identity.province ?? "",
      existingArtifactCount: 0,
      diagnosticAnswers: base,
    });
    if (!sin.ok) throw new Error("compilación canónica falló");
    const htmlSin = renderToStaticMarkup(<PSLCArtifactViewer artifact={sin.artifact} />);
    expect(htmlSin).not.toContain("Recomendaciones del Perfil");
  });

  it("rinde y distingue la frontera institucional en la vista canónica", () => {
    // GOV-SALIDA-01 (institutionalBoundary en el visor): en la vista canónica
    // sellada, la frontera se rinde COMPLETA (enunciado + consenso) y se
    // distingue con su marca propia (`pslc-viewer__frontera`), como en la ruta
    // legacy. Invariante ejecutable: el cuerpo compilado no recomienda; las orientaciones entran por el menú elegible (Art. 16 ter).
    const answers = buildDiagnosticAnswers({
      workspace: ws,
      determinantTitles: [],
      assets: ws.evidenceStore.atoms
        .filter((a) => a.kind === "asset")
        .map((a) => ({ title: a.title, content: a.content })),
    });
    const result = compileLocalHealthProfile({
      psl: pslCompilable(generated),
      perfil: perfilConConocimiento(),
      compiledBy: "Equipo técnico de salud pública",
      municipalityName: ws.municipality.identity.name,
      municipalityProvince: ws.municipality.identity.province ?? "",
      existingArtifactCount: 0,
      diagnosticAnswers: answers,
    });
    if (!result.ok) throw new Error("compilación canónica falló");
    // Artefacto v2: el visor consume la proyección canónica (no la ruta legacy).
    expect(result.artifact.canonicalDocument).toBeDefined();
    const canonicalHtml = renderToStaticMarkup(
      <PSLCArtifactViewer artifact={result.artifact} />
    );
    // La frontera se rinde completa: enunciado fijo + consenso.
    expect(canonicalHtml).toContain("Frontera institucional");
    expect(canonicalHtml).toContain(
      "concluye y orienta técnicamente: no fija actuaciones, programas, objetivos estratégicos ni prioridades"
    );


    expect(canonicalHtml).toContain("Plan de Acción");
    expect(canonicalHtml).toContain("fase posterior del proceso de planificación");
    expect(canonicalHtml).toContain("Consenso del Grupo Motor documentado:");
    // Y se distingue con su marca propia (institucional).
    expect(canonicalHtml).toContain("pslc-viewer__frontera");
  });

  it("sin espacio de conocimiento, declara EKC no disponible en lugar de inventarlo", () => {
    const sinPerfil = compileLocalHealthProfile({
      psl: pslCompilable(generated),
      municipalityName: ws.municipality.identity.name,
      municipalityProvince: ws.municipality.identity.province ?? "",
      existingArtifactCount: 0,
    });
    if (!sinPerfil.ok) throw new Error("compilación sin perfil falló");
    const htmlSinPerfil = renderToStaticMarkup(
      <PSLCArtifactViewer artifact={sinPerfil.artifact} />
    );
    // La ausencia de EKC se declara con sobriedad dentro de las
    // incertidumbres críticas, no como bloque vacío del anexo.
    expect(htmlSinPerfil).toContain("EKC no disponible");
    expect(htmlSinPerfil).toContain("No consta espacio interpretativo técnico");
    expect(htmlSinPerfil).not.toContain("<h4>Estado del conocimiento</h4>");
    expect(htmlSinPerfil).not.toContain("Hipótesis del equipo técnico en estudio");
  });
});
