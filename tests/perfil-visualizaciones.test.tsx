/**
 * tests/perfil-visualizaciones.test.tsx
 *
 * Visualizaciones diagnósticas seguras del Perfil (contrato visual):
 * gráficos con Fuente · Escala · Cautela, tabla diagnóstica central de
 * trazadores con badges de escala, gramática de color semántico por tipo de
 * evidencia y bloque sociológico «Qué debe discutir el Grupo Motor»
 * (señal → mecanismo → pregunta). Sin prevalencia falsa, sin proxies como
 * estimación distrital, sin recomendaciones.
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
  buildDiagnosticVisuals,
} from "../src/application/health-profile";
import type {
  DiagnosticAnswers,
  DiagnosticVisuals,
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
let visuales: DiagnosticVisuals;
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
  visuales = buildDiagnosticVisuals(answers, {
    informeTitulo: "Informe de salud de El Zaidín",
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
// Gráficos seguros
// ══════════════════════════════════════════════════════════════════════════════

describe("gráficos diagnósticos seguros — contrato visual", () => {
  it("los gráficos del modelo llevan Fuente · Escala · Cautela y alimentan la vista integrada", () => {
    const graficos = [
      visuales.informeChart,
      visuales.bloquesChart,
      visuales.activosChart,
    ].filter((g) => g !== undefined);
    expect(graficos.length).toBeGreaterThanOrEqual(2);
    for (const g of graficos) {
      expect(g!.caption).toContain("Fuente:");
      expect(g!.caption).toContain("Escala:");
      expect(g!.caption).toContain("Cautela:");
    }
    // La lectura visual en pantalla es el Perfil de Salud Local (una sola
    // composición): imagen general y señales por fuente sustituyen la antigua
    // rejilla de barras de «Salud en síntesis».
    expect(html).toContain("Lectura territorial del diagnóstico");
    expect(html).toContain("Imagen general");
    expect(html).toContain("Señales principales por fuente");
  });

  it("el gráfico del Informe usa peso textual/menciones, nunca prevalencia", () => {
    const g = visuales.informeChart!;
    expect(g.unidad).toContain("peso textual");
    expect(g.unidad).toContain("no prevalencia");
    expect(g.unidad).toContain("menciones");
    expect(JSON.stringify(g)).not.toMatch(/prevalencia de|%|epidemiológica real/);
    // Orden descendente por peso
    for (let i = 1; i < g.items.length; i++) {
      expect(g.items[i - 1].valor).toBeGreaterThanOrEqual(g.items[i].valor);
    }
    // Variante semántica del Informe
    expect(g.items.every((i) => i.variant === "informe")).toBe(true);
  });

  it("los indicadores por bloque cubren los cinco bloques y suman 23", () => {
    const g = visuales.bloquesChart!;
    expect(g.items).toHaveLength(5);
    const suma = g.items.reduce((n, i) => n + i.valor, 0);
    expect(suma).toBe(23);
    const etiquetas = g.items.map((i) => i.etiqueta).join(" | ");
    for (const bloque of [
      "salud mental",
      "apoyo social",
      "actividad física",
      "consumos",
      "socioemocional escolar",
    ]) {
      expect(etiquetas).toContain(bloque);
    }
  });

  it("los activos se grafican como capacidades potenciales, no cobertura", () => {
    const g = visuales.activosChart!;
    expect(g.unidad).toContain("capacidades potenciales");
    expect(g.caption).toContain("no acreditan cobertura, uso ni resultado");
    const total = g.items.reduce((n, i) => n + i.valor, 0);
    expect(total).toBeGreaterThan(0);
    expect(total).toBeLessThanOrEqual(56);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Tabla diagnóstica central
// ══════════════════════════════════════════════════════════════════════════════

describe("tabla diagnóstica central — trazadores con referencias", () => {
  it("existe en la vista integrada (no solo en anexo) con valores y referencias", () => {
    expect(html).toContain("Indicadores trazadores: valores y referencias");
    // Aparece dentro de la Vista editorial integrada, antes del anexo técnico.
    expect(html.indexOf("Indicadores trazadores: valores y referencias")).toBeLessThan(
      html.indexOf("Trazabilidad técnica del diagnóstico")
    );
    expect(visuales.tablaTrazadores.length).toBeGreaterThanOrEqual(6);
    for (const f of visuales.tablaTrazadores) {
      expect(f.valor.length).toBeGreaterThan(0);
      expect(f.refGranada.length).toBeGreaterThan(0);
      expect(f.refAndalucia.length).toBeGreaterThan(0);
      expect(f.lectura.length).toBeGreaterThan(10);
    }
    // Con referencias reales de Andalucía donde existen
    expect(visuales.tablaTrazadores.some((f) => f.refAndalucia !== "no disponible")).toBe(true);
  });

  it("la columna lectura es sustantiva (comparación real), no cautela duplicada", () => {
    const lecturas = visuales.tablaTrazadores.map((f) => f.lectura);
    // Donde hay Andalucía real, la lectura compara de verdad
    expect(
      lecturas.some((l) => l.includes("referencia andaluza") || l.includes("andaluza"))
    ).toBe(true);
    // Ninguna lectura es la vieja cautela repetida
    for (const l of lecturas) {
      expect(l).not.toContain("comportamiento demo");
      expect(l).not.toContain("no constituye");
    }
    // Los 23 indicadores completos siguen en la trazabilidad del anexo técnico.
    expect(html).toContain("Trazabilidad técnica del diagnóstico");
  });

  it("los proxies se presentan como contexto, nunca como estimación distrital", () => {
    const proxies = visuales.tablaTrazadores.filter((f) => f.esProxy);
    expect(proxies.length).toBeGreaterThan(0);
    for (const f of visuales.tablaTrazadores) {
      expect(["proxy contextual", "muestra local"]).toContain(f.escala);
    }
    // La vista integrada renderiza la escala como contexto declarado.
    expect(html).toContain("proxy contextual");
    expect(html).toContain("muestra local");
    // Y nunca como estimación específica del distrito.
    expect(html).not.toMatch(/estimaci[óo]n distrital real|estimaci[óo]n espec[íi]fica del distrito/i);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Gramática visual y bloque sociológico
// ══════════════════════════════════════════════════════════════════════════════

describe("gramática visual semántica y Grupo Motor", () => {
  it("existen variantes de color por tipo de evidencia (pie-variant--*)", () => {
    // La vista integrada expresa la gramática de evidencia con pie-variant--*.
    for (const variant of ["pie-variant--informe", "pie-variant--estudio", "pie-variant--activo"]) {
      expect(html).toContain(variant);
    }
  });

  it("la imagen general presenta tres mensajes principales con dato y fuente", () => {
    expect(html).toContain("Imagen general");
    const items = html.match(/pie-overview__item/g) ?? [];
    expect(items.length).toBe(3);
  });

  it("las tarjetas del Grupo Motor conectan señal, mecanismo y pregunta (datos; el bloque se retiró del cuerpo)", () => {
    expect(html).not.toContain("Qué debe discutir el Grupo Motor");
    expect(visuales.grupoMotorCards.length).toBeGreaterThanOrEqual(4);
    expect(visuales.grupoMotorCards.length).toBeLessThanOrEqual(6);
    for (const c of visuales.grupoMotorCards) {
      expect(c.senal.length).toBeGreaterThan(15);
      expect(c.mecanismo.length).toBeGreaterThan(15);
      // Conversación territorial: quién puede quedar fuera de los datos
      expect(c.oculto.length).toBeGreaterThan(15);
      expect(c.pregunta).toMatch(/^¿.+\?$/);
    }
    const temas = visuales.grupoMotorCards.map((c) => c.tema).join(" | ");
    expect(temas).toContain("Desigualdad");
    expect(temas).toContain("Soledad, envejecimiento");
    expect(temas).toContain("Sueño");
    expect(temas).toContain("activos");
    // Los mecanismos proceden de las hipótesis reales (trazables)
    expect(
      visuales.grupoMotorCards.some((c) =>
        c.mecanismo.includes("condiciones psicosociales")
      )
    ).toBe(true);
  });

  it("sin recomendaciones, objetivos, programas ni Plan de Acción", () => {
    const textoVisuales = JSON.stringify(visuales);
    expect(textoVisuales).not.toMatch(
      /se recomienda|recomendamos|debe implantarse|programa de|objetivo estrat[ée]gico|plan de acci[óo]n/i
    );
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
      /se recomienda|recomendamos|debe implantarse|programa de|plan de acci[óo]n/i
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Conformidad con la paleta COMPÁS (docs/visual/VISUAL-CONTRACT.md)
// ══════════════════════════════════════════════════════════════════════════════

describe("gramática visual pv-* — paleta COMPÁS", () => {
  const css = readFileSync(
    resolve(dirname(fileURLToPath(import.meta.url)), "../src/App.css"),
    "utf8"
  );
  // Solo las reglas cuyo selector pertenece a la gramática visual nueva del
  // Perfil (pv-*): las ocurrencias antiguas fuera de este bloque no cuentan.
  const sinComentarios = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const reglasPv = [...sinComentarios.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([, selector]) => selector.includes(".pv-"))
    .map(([, selector, cuerpo]) => selector.trim() + " { " + cuerpo.trim() + " }");

  it("las reglas pv-* existen y no usan colores fuera del contrato visual", () => {
    expect(reglasPv.length).toBeGreaterThanOrEqual(10);
    const bloque = reglasPv.join("\n");
    for (const prohibido of ["#1d4ed8", "#b45309", "#15803d", "#7e22ce"]) {
      expect(bloque).not.toContain(prohibido);
    }
  });

  it("la semántica diagnóstica mapea a los tokens COMPÁS", () => {
    const bloque = reglasPv.join("\n").toLowerCase();
    const tokens: Array<[string, string]> = [
      ["informe", "#0074c8"],
      ["estudio", "#00acd9"],
      ["proxy", "#ffb61b"],
      ["activo", "#94d40b"],
      ["equidad", "#dc143c"],
    ];
    for (const [variante, token] of tokens) {
      const regla = reglasPv.find(
        (r) => r.startsWith(`.pv--${variante}`) && r.includes(token)
      );
      expect(regla, `token ${token} para pv--${variante}`).toBeDefined();
    }
    // La pregunta del Grupo Motor acentúa en azul institucional; lo oculto,
    // en el rojo de equidad/criticidad.
    expect(bloque).toContain(".pv-card__pregunta { font-size: 0.85rem; font-weight: 600; color: #0074c8;");
    expect(reglasPv.some((r) => r.startsWith(".pv-card__oculto") && r.includes("#dc143c"))).toBe(true);
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
