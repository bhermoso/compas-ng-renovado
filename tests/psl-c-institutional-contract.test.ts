/**
 * tests/psl-c-institutional-contract.test.ts
 *
 * CONTRATO INSTITUCIONAL del PSL-C compilado, verificado sobre la narrativa
 * real del expediente vigente Granada-Zaidín 56/92.
 *
 * El contrato asegura que el artefacto congelado:
 *   1. puede contener conclusiones interpretativas sustantivas;
 *   2. no contiene recomendaciones, programas, actuaciones ni plan de acción;
 *   3. no declara causalidad demostrada cuando solo hay interpretación/hipótesis;
 *   4. preserva las cautelas proxy/demo y de escala;
 *   5. incorpora estado del conocimiento (EKC), hipótesis, preguntas abiertas
 *      y síntesis sin convertirlas en recomendaciones;
 *   6. mantiene la frontera con el Plan de Acción;
 *   7. y que un Perfil sin autoría validada NO es compilable (gates G-LHC).
 */

import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadWorkspaceFromLocalStorage } from "../src/infrastructure/persistence/local-storage";
import { createMunicipalityRuntime } from './helpers/legacyProfileRuntime';
import {
  compileLocalHealthProfile,
  validateCompilationPreconditions,
} from "../src/application/health-profile-compiler";
import {
  createPerfilLocalDeSalud,
  addInterpretation,
  addHypothesis,
  addOpenQuestion,
  updateSynthesis,
  parseNarrativeChapters,
  NARRATIVE_CHAPTER_TITLES,
} from "../src/application/health-profile";
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

/** Espacio de conocimiento del técnico, como en el flujo real. */
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
    indicios: ["señales de salud mental y apoyo social en la evidencia contextual"],
    preguntasResolutoras: ["Explotación desagregada de GHQ-12 por rol de cuidado"],
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

/**
 * Lleva el PSL generado al estado compilable del flujo real: el equipo
 * técnico asume la autoría del borrador sustantivo, valida el documento y
 * el Grupo Motor documenta el consenso de la priorización.
 */
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
  if (!result.ok) {
    throw new Error(
      "La compilación de contrato falló: " +
        result.violations.map((v) => `${v.gate}: ${v.message}`).join(" | ")
    );
  }
  artifact = result.artifact;
}, 60000);

/** Texto institucional agregado del artefacto (lo que un lector recibe). */
function textoInstitucional(a: LocalHealthProfileArtifact): string {
  return [
    a.conclusiones.content,
    a.cierreInterpretativo.content,
    a.priorizacion.deliberacionNota,
    a.lecturaTerritorial.territorialSummary,
    ...a.lecturaTerritorial.areasDeIntervencion.map((x) => `${x.title} ${x.rationale}`),
    ...a.priorizacion.candidaturasTecnicas.map((c) => `${c.title} ${c.rationale}`),
    ...a.hipotesisActivas.map((h) => h.enunciado),
    ...a.preguntasAbiertas.map((q) => q.formulacion),
    a.cautelasMetodologicas.nota,
  ].join("\n");
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. Conclusiones interpretativas permitidas y sustantivas
// ══════════════════════════════════════════════════════════════════════════════

describe("contrato PSL-C — conclusiones interpretativas", () => {
  it("el artefacto contiene conclusiones interpretativas sustantivas", () => {
    const c = artifact.conclusiones.content;
    expect(c.length).toBeGreaterThan(1000);
    expect(c).toContain("El diagnóstico apunta a un distrito");
    expect(c).toContain("Síntesis diagnóstica del equipo técnico.");
    expect(c).toContain("Lectura desde la epidemiología social");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. Sin recomendaciones, programas, actuaciones ni plan de acción
// ══════════════════════════════════════════════════════════════════════════════

describe("contrato PSL-C — frontera de contenido", () => {
  it("no contiene recomendaciones, programas ni plan de acción", () => {
    const texto = textoInstitucional(artifact);
    expect(texto).not.toMatch(
      /se recomienda|recomendamos|debe implantarse|debe ponerse en marcha|programa de|plan de acci[óo]n|l[íi]nea estrat[ée]gica|objetivo operativo/i
    );
  });

  it("mantiene explícita la frontera con el Plan de Acción", () => {
    const c = artifact.conclusiones.content;
    expect(c).toContain(
      "no formula recomendaciones, actuaciones ni programas"
    );
    expect(c).toContain("fases posteriores del proceso de planificación");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Sin causalidad demostrada cuando solo hay interpretación/hipótesis
// ══════════════════════════════════════════════════════════════════════════════

describe("contrato PSL-C — prudencia causal", () => {
  it("las lecturas se presentan como hipótesis, nunca como causalidad demostrada", () => {
    const texto = textoInstitucional(artifact);
    expect(texto).not.toMatch(
      /demuestra que|queda demostrado|causa directa|relaci[óo]n causal confirmada/i
    );
    expect(artifact.conclusiones.content).toContain(
      "Ninguna de estas lecturas constituye causalidad demostrada"
    );
    expect(artifact.conclusiones.content).toContain("pendiente de confirmación");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Cautelas proxy/demo preservadas
// ══════════════════════════════════════════════════════════════════════════════

describe("contrato PSL-C — cautelas de escala", () => {
  it("preserva las cautelas proxy/demo y de escala del diagnóstico", () => {
    const c = artifact.conclusiones.content;
    expect(c).toContain("contexto exploratorio");
    expect(c).toMatch(/no constituyen? (una )?estimación específica del distrito/);
    expect(c).toContain("demo/proxy");
    expect(artifact.cautelasMetodologicas.nota.length).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Puente del conocimiento sin convertirlo en recomendaciones
// ══════════════════════════════════════════════════════════════════════════════

describe("contrato PSL-C — estado del conocimiento", () => {
  it("incorpora EKC, hipótesis, preguntas abiertas y síntesis", () => {
    expect(artifact.ekcSnapshot).not.toBeNull();
    expect(artifact.ekcSnapshot!.interpretacionesActivas).toBe(1);
    expect(artifact.ekcSnapshot!.hipotesisActivas).toBe(1);
    expect(artifact.ekcSnapshot!.preguntasAbiertas).toBe(1);
    expect(artifact.ekcSnapshot!.tieneSintesis).toBe(true);
    expect(artifact.hipotesisActivas).toHaveLength(1);
    expect(artifact.hipotesisActivas[0].plausibilidad).toBe("moderada");
    expect(artifact.preguntasAbiertas).toHaveLength(1);
    expect(artifact.generatedFromPerfilId).not.toBeNull();
    // La síntesis del técnico llega al documento (Cap. VI), no se pierde.
    expect(artifact.conclusiones.content).toContain(
      "tejido comunitario denso orientado a mayores"
    );
  });

  it("las hipótesis proyectadas conservan lenguaje hipotético", () => {
    for (const h of artifact.hipotesisActivas) {
      expect(h.enunciado).not.toMatch(/se recomienda|debe implantarse/i);
    }
    expect(artifact.conclusiones.content).toContain("Hipótesis diagnóstica del equipo");
  });

  it("sin PerfilLocalDeSalud el puente queda declarado vacío, no fingido", () => {
    const result = compileLocalHealthProfile({
      psl: pslCompilable(generated),
      compiledBy: "Equipo técnico",
      municipalityName: ws.municipality.identity.name,
      municipalityProvince: ws.municipality.identity.province ?? "",
      existingArtifactCount: 0,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.artifact.ekcSnapshot).toBeNull();
      expect(result.artifact.hipotesisActivas).toHaveLength(0);
      expect(result.artifact.generatedFromPerfilId).toBeNull();
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. Estructura institucional: seis capítulos + bloques no capitulares
// ══════════════════════════════════════════════════════════════════════════════

describe("contrato PSL-C — estructura institucional del documento", () => {
  it("el documento narrativo tiene exactamente los seis capítulos canónicos", () => {
    const capitulos = parseNarrativeChapters(artifact.conclusiones.content);
    expect(capitulos.map((c) => c.title)).toEqual([...NARRATIVE_CHAPTER_TITLES]);
    expect(capitulos.map((c) => c.numeral)).toEqual([
      "I",
      "II",
      "III",
      "IV",
      "V",
      "VI",
    ]);
  });

  it("no existe un séptimo capítulo: cierre, priorización y EKC son bloques no capitulares", () => {
    // El documento narrativo no numera un capítulo VII…
    expect(artifact.conclusiones.content).not.toMatch(/(^|\n)VII\.\s/);
    // …y los elementos institucionales adicionales viven como bloques propios
    // del artefacto, separados del documento y sin numeración capitular.
    expect(artifact.cierreInterpretativo.content.trim().length).toBeGreaterThan(0);
    expect(artifact.cierreInterpretativo.content).not.toMatch(/(^|\n)[IVX]+\.\s/);
    expect(artifact.priorizacion.deliberacionNota.length).toBeGreaterThan(0);
    expect(artifact.ekcSnapshot).not.toBeNull();
    expect(artifact.cautelasMetodologicas.nota.length).toBeGreaterThan(0);
    expect(artifact.sourceHash.length).toBeGreaterThan(0);
  });

  it("los gates hablan de bloques institucionales, sin numeración capitular contractual", () => {
    const violations = validateCompilationPreconditions(generated);
    const mensajes = violations.map((v) => v.message).join("\n");
    expect(mensajes).not.toMatch(/Cap\. V|Cap\. VI|Cap\. VII/);
    // Paso 4: el gate de autoría sobre `conclusiones` (G-LHC-2, "documento del
    // Perfil (seis capítulos narrativos)") se retiró; la autoría humana se
    // verifica sobre el cierre interpretativo (bloque institucional no capitular).
    expect(mensajes).toContain("bloque institucional no capitular");
    expect(mensajes).toContain("bloque de preparación deliberativa");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. Gates: un Perfil sin autoría validada no es compilable
// ══════════════════════════════════════════════════════════════════════════════

describe("contrato PSL-C — gates de compilación", () => {
  it("el PSL generado (borrador sin validar) viola los gates G-LHC", () => {
    const violations = validateCompilationPreconditions(generated);
    const gates = violations.map((v) => v.gate);
    expect(gates).toContain("G-LHC-1"); // no está validado
    expect(gates).not.toContain("G-LHC-2"); // Paso 4: retirado (cuerpo compilado, no autoría de conclusiones)
    expect(gates).toContain("G-LHC-4"); // priorización sin completar
    expect(gates).toContain("G-LHC-5"); // consenso sin documentar
    const result = compileLocalHealthProfile({
      psl: generated,
      municipalityName: ws.municipality.identity.name,
      municipalityProvince: ws.municipality.identity.province ?? "",
      existingArtifactCount: 0,
    });
    expect(result.ok).toBe(false);
  });
});
