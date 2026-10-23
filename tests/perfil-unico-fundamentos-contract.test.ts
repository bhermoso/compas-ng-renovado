/**
 * Conformidad documental — Fundamentos del Perfil único (Intervención 2026-07-17).
 *
 * Verifica que los contratos fijan las decisiones doctrinales del Perfil único:
 * producto único, arquitectura adaptativa (sin recuento obligatorio de capítulos),
 * equivalencia semántica entre salidas y clases de conocimiento. Solo lee los
 * `.md`; no valida comportamiento de código (eso vive en los tests del Perfil).
 *
 * Las frases se comprueban sobre una versión con los espacios en blanco colapsados
 * (`flat`) para no depender del ajuste de línea del markdown.
 */

import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const DOCS = resolve(dirname(fileURLToPath(import.meta.url)), "..", "docs");
const readRaw = (rel: string) => readFileSync(resolve(DOCS, rel), "utf8");
// Normaliza a prosa: elimina el marcador de blockquote (`> `) al inicio de línea y
// colapsa los espacios, para que las frases no dependan del ajuste de línea ni del
// formato markdown.
const flatten = (s: string) => s.replace(/^>\s?/gm, "").replace(/\s+/g, " ");

describe("Fundamentos del Perfil único — CONTRACT-INDEX", () => {
  const raw = readRaw("contracts/CONTRACT-INDEX.md");
  const idx = flatten(raw);

  it("declara el producto único institucional", () => {
    expect(idx).toContain("Fundamentos del Perfil único");
    expect(idx).toContain("El único producto institucional del Perfil es el **Perfil");
    expect(idx).toContain("deja de definirse como producto autónomo");
    expect(idx).toContain("segunda fuente de verdad");
  });

  it("declara la arquitectura adaptativa sin recuento obligatorio de capítulos", () => {
    expect(idx).toContain("única lectura institucional canónica");
    expect(idx).toContain("dependen de la riqueza y la solidez del expediente");
    expect(idx).toContain("abrirse, comprimirse o no aparecer");
    expect(idx).toContain("mera presencia textual no obliga");
    expect(idx).toContain("No puede coexistir una «lectura larga» alternativa");
    expect(idx).toContain("derogada toda rigidez numérica");
  });

  it("declara la equivalencia SEMÁNTICA (no de apariencia) entre salidas", () => {
    expect(idx).toContain("mismo modelo semántico canónico");
    expect(idx).toContain("no se exige identidad de píxeles, CSS");
  });

  it("declara las clases de conocimiento sin umbral numérico de menciones", () => {
    expect(idx).toContain("síntesis automática derivada");
    expect(idx).toContain("no eleva por sí sola una presencia textual a evidencia");
  });

  it("registra las deudas resueltas por doctrina y las migraciones pendientes", () => {
    expect(idx).toContain("GOV-SALIDA-01");
    expect(idx).toContain("rigidez numérica derogada");
    expect(idx).toContain("se retira el 2026-10-23");
  });
});

describe("Retirada del PSL-NHS (2026-10-23)", () => {
  const SRC = resolve(DOCS, "..");

  it("el contrato NHS y su certificación ya no existen", () => {
    expect(existsSync(resolve(DOCS, "contracts/CONTRACT-NHS-HEALTH-PROFILE.md"))).toBe(false);
    expect(existsSync(resolve(DOCS, "certification/PRODUCT-4-NHS-HEALTH-PROFILE-CERTIFICATION.md"))).toBe(false);
  });

  it("el código del NHS ya no existe", () => {
    expect(existsSync(resolve(SRC, "src/ui/components/NHSHealthProfileView.tsx"))).toBe(false);
    expect(existsSync(resolve(SRC, "src/application/health-profile/nhsDerivedProjection.ts"))).toBe(false);
  });

  it("el índice registra la retirada y no mantiene el contrato como vigente", () => {
    const idx = flatten(readRaw("contracts/CONTRACT-INDEX.md"));
    expect(idx).toContain("PSL-NHS — retirado");
    expect(idx).toContain("queda **retirado** el 2026-10-23");
    expect(idx).not.toContain("### CONTRACT-NHS-HEALTH-PROFILE");
  });
});

describe("Fundamentos del Perfil único — arquitectura adaptativa y salida canónica", () => {
  it("CONTRACT-MIT-PSL deroga la rigidez de capítulos y fija clases de conocimiento", () => {
    const raw = readRaw("contracts/CONTRACT-MIT-PSL.md");
    const mit = flatten(raw);
    expect(mit).toContain("Arquitectura adaptativa de la lectura canónica");
    expect(mit).toContain("derogada toda rigidez numérica");
    expect(mit).toContain("Clases de conocimiento");
    expect(mit).toContain("no eleva por sí sola una presencia textual a evidencia territorial");
    expect(mit).toContain("Cobertura conceptual");
    // Se retira el encabezado que fijaba el recuento obligatorio.
    expect(raw).not.toContain("### 6.2 Estructura: siete capítulos");
  });

  it("CONTRACT-PSL-COMPAS deroga la estructura congelada de siete capítulos", () => {
    const raw = readRaw("contracts/CONTRACT-PSL-COMPAS.md");
    expect(raw).not.toContain("La estructura de siete capítulos está implementada y congelada");
    expect(raw).not.toMatch(/siete cap[ií]tulos/);
    expect(flatten(raw)).toContain("No hay recuento obligatorio de capítulos");
  });

  it("PROFILE-VISUAL-CONTRACT fija salida canónica única y espacio técnico separado", () => {
    const vis = flatten(readRaw("architecture/PROFILE-VISUAL-CONTRACT.md"));
    expect(vis).toContain("Salida canónica única");
    expect(vis).toContain("mismo modelo semántico");
    expect(vis).toContain("Sin lectura larga alternativa");
    expect(vis).toContain("Espacio técnico después del documento");
    expect(vis).toContain("no se exige identidad de píxeles");
    expect(vis).toContain("Una sola salida");
    expect(vis).not.toContain("salida comparativa breve");
  });
});

// ── Reconciliación de navegación y catálogo (Commit 3) ───────────────────────
// Se comprueba el ESTATUTO SEMÁNTICO de las secciones vigentes, sin prohibir
// globalmente la cadena "PSL-NHS" (puede aparecer en notas históricas/migración).

describe("Reconciliación — CONTRACT-NAVIGATION: un único Perfil", () => {
  const raw = readRaw("contracts/CONTRACT-NAVIGATION.md");
  const nav = flatten(raw);

  it("declara que no existe pestaña ni producto NHS independiente en el estado objetivo", () => {
    expect(nav).toContain(
      "No existe, en el estado objetivo, una pestaña ni un producto independiente «Perfil de Salud tipo NHS»"
    );
    expect(nav).toContain("El PSL-C es la **compilación institucional del mismo Perfil**");
    expect(nav).toContain("migración técnica ejecutada");
    expect(nav).not.toContain("migración pendiente");
  });

  it("retira la fila «Producto 4 | Perfil de Salud tipo NHS» de la tabla de denominaciones", () => {
    expect(raw).not.toMatch(/\|\s*Producto 4\s*\|\s*Perfil de Salud tipo NHS\s*\|/);
  });

  it("no mantiene el mandato de 7 capítulos; declara estructura adaptativa", () => {
    expect(raw).not.toContain("los 7 capítulos del PSL son el contenido técnico");
    expect(nav).toContain("no fija seis ni siete capítulos obligatorios");
  });
});

describe("Reconciliación — CONTRACT-INDEX: sin «Producto 4» vigente", () => {
  const raw = readRaw("contracts/CONTRACT-INDEX.md");
  const idx = flatten(raw);

  it("no mantiene el NHS como «Producto 4» ni como representación derivada", () => {
    expect(raw).not.toContain("## Producto 4 — Perfil de Salud Local tipo NHS (PSL-NHS)");
    expect(idx).not.toContain("Pasa a ser una **representación derivada dentro del Perfil");
    // Elimina la afirmación vigente de estatuto propio del registro.
    expect(raw).not.toContain("con estatuto de producto institucional propio por razón de su audiencia y formato");
  });

  it("registra la retirada NHS (GOV-P4-01) y mantiene la cobertura adaptativa", () => {
    expect(idx).toContain("GOV-P4-01");
    expect(idx).toContain("Retirado");
    expect(raw).not.toContain("los 7 capítulos del PSL");
    expect(raw).not.toContain("estructura canónica de 7 capítulos");
  });

  it("ya no declara productor NHS ni compilador autónomo", () => {
    expect(idx).not.toContain("**Productores:** `projectNHSDerived`");
    // El registro vigente no puede seguir declarando el compilador retirado.
    expect(raw).not.toContain("`NHSHealthProfileCompiler` (implementado en `src/application/nhs-health-profile-compiler/`)");
  });
});

describe("Reconciliación — INSTITUTIONAL-PRODUCTS-ARCHITECTURE: catálogo sin PSL-NHS", () => {
  const raw = readRaw("architecture/INSTITUTIONAL-PRODUCTS-ARCHITECTURE.md");
  const ipa = flatten(raw);

  it("cuenta siete productos y retira PSL-NHS del catálogo y del grafo", () => {
    expect(raw).toContain("Reconciliación con los Fundamentos del Perfil único");
    expect(raw).toContain("**siete** productos institucionales distinguibles");
    expect(raw).not.toContain("ocho productos institucionales distinguibles");
    // Fila de catálogo del PSL-NHS retirada.
    expect(raw).not.toMatch(/\|\s*\*\*PSL-NHS\*\*\s*\|/);
  });

  it("no recomienda ya paneles/compiladores NHS separados (recomendación superada)", () => {
    expect(ipa).toContain("procede un panel ni un compilador NHS separados como producto propio");
    expect(ipa).toContain("No procede un compilador NHS separado como producto propio");
  });

  it("no mantiene 7 capítulos obligatorios; registra migración ejecutada", () => {
    expect(raw).not.toContain("7 capítulos estructurados, exportable");
    expect(raw).not.toContain("7 capítulos perfectamente definidos");
    expect(ipa).toContain("migración técnica ejecutada");
  });
});

describe("Reconciliación — otras fuentes vigentes corregidas", () => {
  it("BLUEPRINT-PRODUCTION marca superado el «Producto 4» y los 7 capítulos", () => {
    const bp = flatten(readRaw("architecture/BLUEPRINT-PRODUCTION.md"));
    expect(bp).toContain("deja de ser un producto institucional independiente");
    expect(bp).toContain("lectura única y adaptativa");
  });

  it("CONTRACT-LOCAL-HEALTH-PROFILE-METHODOLOGY (rector) fija una sola salida", () => {
    const rector = flatten(readRaw("contracts/CONTRACT-LOCAL-HEALTH-PROFILE-METHODOLOGY.md"));
    expect(rector).toContain("### Art. 17 ter. Una sola salida");
    expect(rector).toContain("**I-LHPM-10 — Una sola salida**");
    expect(rector).not.toContain("**I-LHPM-10 — Dos salidas, una fuente de verdad**");
    expect(rector).not.toContain("CONTRACT-NHS-HEALTH-PROFILE §0");
  });
});
