/**
 * tests/perfil-salud-en-sintesis.test.tsx
 *
 * «Salud en síntesis»: modelo puro que alimenta la vista integrada.
 * Verifica sobre datos reales del vigente 56/92 que la lectura cuenta la
 * salud del territorio antes que la metodología, agrupa señales para
 * deliberar sin volcar la matriz completa en la apertura, y supera el
 * contrato anti-plantilla.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { loadWorkspaceFromLocalStorage } from "../src/infrastructure/persistence/local-storage";
import { createMunicipalityRuntime } from "../src/application/runtime";
import {
  buildDiagnosticAnswers,
  buildProfileSynthesis,
  buildMatrizAnexo,
  checkSynthesisAntiTemplate,
} from "../src/application/health-profile";
import type {
  DiagnosticAnswers,
  ProfileSynthesis,
} from "../src/application/health-profile";
import { LocalHealthProfileView } from "../src/ui/components/LocalHealthProfileView";
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
  "../fixtures/workspaces/granada-zaidin-synthetic-test.json"
);

let ws: MunicipalityWorkspace;
let psl: LocalHealthProfile;
let answers: DiagnosticAnswers;
let sintesis: ProfileSynthesis;
let html: string;

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
  sintesis = buildProfileSynthesis(answers, {
    informeTitulo: "Informe de salud de El Zaidín",
    scopeNoun: "territorio",
  });
  html = renderToStaticMarkup(
    <LocalHealthProfileView
      psl={psl}
      previewPSL={psl}
      isValidatedPreview={true}
      pslIsStale={false}
      municipalityName={ws.municipality.identity.name}
      diagnosticAnswers={answers}
      onValidate={() => {}}
      onInvalidate={() => {}}
    />
  );
}, 60000);

// ══════════════════════════════════════════════════════════════════════════════
// Mensajes de síntesis
// ══════════════════════════════════════════════════════════════════════════════

describe("Salud en síntesis — mensajes sustantivos", () => {
  it("produce entre 4 y 6 mensajes con contenido real, no plantilla", () => {
    expect(sintesis.mensajes.length).toBeGreaterThanOrEqual(4);
    expect(sintesis.mensajes.length).toBeLessThanOrEqual(6);
    const texto = sintesis.mensajes.map((m) => m.texto).join("\n");
    // Valores reales del expediente, no huecos
    expect(texto).toContain("Informe de salud de El Zaidín");
    expect(texto).toContain("32.8 %");
    expect(texto).toContain("49.2/55");
    expect(texto).toContain("76.2/100");
    expect(texto).toContain("56");
  });

  it("abre por la salud (hilo sanitario), no por metodología", () => {
    expect(sintesis.mensajes[0].id).toBe("hilo-sanitario");
    expect(sintesis.mensajes[0].texto).toContain("agenda sanitaria de partida");
    // La única mención metodológica (equidad/desagregación) va al final
    expect(sintesis.mensajes[sintesis.mensajes.length - 1].id).toBe(
      "equidad-abierta"
    );
  });

  it("supera el contrato anti-plantilla", () => {
    expect(checkSynthesisAntiTemplate(sintesis)).toEqual([]);
  });

  it("detecta violaciones cuando el tono es de plantilla", () => {
    const plantilla: ProfileSynthesis = {
      ...sintesis,
      mensajes: [
        { id: "x", texto: "Cautela metodológica: los datos son proxy." },
        ...sintesis.mensajes.slice(1),
      ],
      senalesPrincipales: sintesis.senalesPrincipales.map((r) => ({
        ...r,
        lectura: "pendiente de validación comunitaria",
      })),
    };
    const violations = checkSynthesisAntiTemplate(plantilla);
    const ids = violations.map((v) => v.id);
    expect(ids).toContain("apertura-metodologica");
    expect(ids).toContain("cautela-repetida");
    expect(ids).toContain("lectura-duplicada");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Señales principales
// ══════════════════════════════════════════════════════════════════════════════

describe("Salud en síntesis — señales principales para deliberación", () => {
  it("agrupa en bloques comprensibles sin volcar las señales completas", () => {
    expect(sintesis.senalesPrincipales.length).toBeGreaterThanOrEqual(5);
    expect(sintesis.senalesPrincipales.length).toBeLessThanOrEqual(6);
    const grupos = sintesis.senalesPrincipales.map((r) => r.grupo);
    expect(grupos).toContain("Situación sanitaria (Informe)");
    expect(grupos).toContain("Salud mental, sueño y malestar");
    expect(grupos).toContain("Apoyo social y vínculo");
    expect(grupos).toContain("Actividad física y entorno");
    expect(grupos).toContain("Consumos y alimentación");
    expect(grupos).toContain("Activos y capacidades");
  });

  it("cada fila lleva señal, fuente, escala, lectura breve y pregunta", () => {
    for (const r of sintesis.senalesPrincipales) {
      expect(r.senal.length).toBeGreaterThan(3);
      expect(r.fuente.length).toBeGreaterThan(2);
      expect(r.escala.length).toBeGreaterThan(3);
      expect(r.lectura.length).toBeGreaterThan(10);
      expect(r.pregunta).toMatch(/^¿.+\?$/);
      // La tabla principal no arrastra los campos epistemológicos completos
      expect(r.lectura).not.toContain("estatus causal");
    }
    // La cautela común vive en UNA nota de escala, no fila a fila
    expect(sintesis.notaEscala).toContain("Nota de escala");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Render en pantalla y matriz en anexo
// ══════════════════════════════════════════════════════════════════════════════

describe("pantalla — la síntesis se absorbe en la vista integrada; matriz en anexo", () => {
  it("la sección autónoma «Salud en síntesis» ya no se muestra: su lectura vive en el Perfil canónico", () => {
    // Resolución editorial: la composición canónica es el Perfil de Salud Local.
    expect(html).toContain("Lectura territorial del diagnóstico");
    expect(html).not.toContain("Salud en síntesis");
    // La agenda del Grupo Motor se retiró del cuerpo (contrato v2.0.0, Art. 16 quater).
    expect(html).not.toContain("Qué debe discutir el Grupo Motor");
    // El desarrollo capitular largo ya no es cuerpo de la pantalla.
    expect(html).not.toContain("I · Alcance y fuentes");
    // El modelo puro de síntesis sigue siendo la fuente (alimenta la vista integrada).
    expect(sintesis.mensajes.length).toBeGreaterThanOrEqual(4);
  });

  it("la matriz epistemológica completa queda plegada en el anexo con notas de bloque", () => {
    expect(html).toContain("Matriz epistemológica completa");
    const matriz = buildMatrizAnexo(answers);
    expect(matriz.filas.length).toBeGreaterThanOrEqual(15);
    // La nota de bloque queda para lo que SÍ es común a todas las señales: la
    // validación comunitaria pendiente (Popay).
    expect(matriz.notasBloque.length).toBe(1);
    expect(matriz.notasBloque[0]).toContain("Validación comunitaria");
    expect(matriz.notasBloque[0]).toContain("todas las señales");
    // La desigualdad NO es común: el marco científico exige laguna específica,
    // así que cada fila declara la suya y ninguna repite la fórmula genérica.
    expect(matriz.filas.every((f) => f.desigualdad !== undefined)).toBe(true);
    expect(
      matriz.filas.every((f) => f.desigualdad!.includes("no ausencia de desigualdad"))
    ).toBe(true);
    const lagunas = new Set(matriz.filas.map((f) => f.desigualdad));
    expect(lagunas.size).toBeGreaterThan(1);
    // Y la matriz aparece después de la lectura canónica, nunca como apertura
    expect(html.indexOf("Lectura territorial del diagnóstico")).toBeLessThan(
      html.indexOf("Matriz epistemológica completa")
    );
  });

  it("la composición canónica no introduce recomendaciones ni Plan de Acción", () => {
    const seccion = html.slice(
      html.indexOf("Lectura territorial del diagnóstico"),
      html.indexOf('id="psl-resumen"')
    );
    // La FRONTERA institucional se excluye del chequeo: su enunciado fijo nombra
    // el «Plan de Acción» para demarcar que el Perfil NO lo hace (demarcación
    // institucional, no prosa editorial). Se excise SOLO esa sección; el resto de
    // la lectura sí debe estar libre de lenguaje de decisión.
    const idxFrontera = seccion.indexOf("Frontera institucional");
    const idxAnexo = seccion.indexOf("<details", idxFrontera);
    const sinFrontera =
      idxFrontera >= 0
        ? seccion.slice(0, idxFrontera) +
          (idxAnexo >= 0 ? seccion.slice(idxAnexo) : "")
        : seccion;
    expect(sinFrontera).not.toMatch(
      /se recomienda|recomendamos|debe implantarse|programa de|plan de acci[óo]n|objetivo estrat[ée]gico/i
    );
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
