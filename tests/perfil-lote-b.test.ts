/**
 * Lote B — coherencia de representación del Perfil (F1, F2, F3, F7).
 *
 *   F1 — La cabecera enumera las tres fuentes reales de Atarfe (Informe, IBSE,
 *        Localiza Salud); las tarjetas «Bienestar escolar»→IBSE y «Capacidades
 *        comunitarias»→Localiza Salud. Granada-Zaidín (IBSE provincial proxy) no
 *        cambia: su IBSE no entra como señal principal y conserva sus 6 fuentes.
 *   F2 — Jerarquía trazador/indicadores con concordancia gramatical («1 indicador
 *        trazador», no «1 indicadores»); etiquetas demo/proxy derivadas de la
 *        condición real de las filas (Atarfe local, Zaidín proxy).
 *   F3 — El contador «Cuestiones para contraste» cuenta la agenda del Grupo Motor
 *        (groupMotorAgenda), no areasDeIntervencion (OIT): 2 para Atarfe.
 *   F7 — El fallback OIT nombra el déficit real (determinantes + participación) y
 *        no aconseja incorporar activos/indicadores ya presentes. Gates intactos.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseWorkspaceJSON } from "../src/infrastructure/persistence/local-storage";
import { buildDiagnosticAnswers } from "../src/application/health-profile/diagnosticAnswers";
import { buildProfileIntegratedEditorialView } from "../src/application/health-profile/profileIntegratedEditorialView";
import { buildIndicatorComparisonReferences } from "../src/application/health-profile/complementaryIndicatorReferences";
import { generateLT1 } from "../src/application/lt1";
import { generateOIT } from "../src/application/oit";
import { validateCompilationPreconditions } from "../src/application/health-profile-compiler";
import { createMunicipalityRuntime } from './helpers/legacyProfileRuntime';
import type { MunicipalityWorkspace } from "../src/domain/workspace";

const _dir = dirname(fileURLToPath(import.meta.url));
function seed(id: string): MunicipalityWorkspace {
  const path = id === "granada-zaidin"
    ? resolve(_dir, "../fixtures/workspaces/granada-zaidin-synthetic-test.json")
    : resolve(_dir, `../public/seeds/compas-ng-workspace-${id}.json`);
  return parseWorkspaceJSON(
    readFileSync(path, "utf8")
  )!;
}
function answersOf(ws: MunicipalityWorkspace) {
  const atoms = ws.evidenceStore.atoms;
  return buildDiagnosticAnswers({
    workspace: ws,
    determinantTitles: atoms.filter((a) => a.kind === "determinant").map((a) => a.title),
    assets: atoms.filter((a) => a.kind === "asset").map((a) => ({ title: a.title, content: a.content })),
    indicatorTitles: atoms.filter((a) => a.kind === "indicator").map((a) => a.title),
  });
}
function viewOf(ws: MunicipalityWorkspace, informe: string) {
  return buildProfileIntegratedEditorialView(answersOf(ws), {
    territory: ws.municipality.identity.id,
    status: "Borrador",
    informeTitulo: informe,
    generatedDate: "x",
  });
}

const atarfe = seed("atarfe");
const zaidin = seed("granada-zaidin");
const ATARFE_INFORME = "Informe de la situación de salud en el municipio de Atarfe";
const ZAIDIN_INFORME = "Informe de salud Granada-Zaidín";

describe("Lote B · F1 — cabecera y atribuciones de fuentes", () => {
  it("F1.1 Atarfe: la cabecera enumera Informe, IBSE y Localiza Salud", () => {
    const view = viewOf(atarfe, ATARFE_INFORME);
    expect(view.header.sources).toContain(ATARFE_INFORME);
    expect(view.header.sources).toContain("IBSE");
    expect(view.header.sources).toContain("Localiza Salud");
  });

  it("F1.2 Atarfe: «Bienestar escolar»→IBSE y «Capacidades comunitarias»→Localiza Salud", () => {
    const view = viewOf(atarfe, ATARFE_INFORME);
    const bienestar = view.overview.find((o) => o.id === "bienestar-escolar");
    const capacidades = view.overview.find((o) => o.id === "capacidades");
    expect(bienestar?.source).toBe("IBSE");
    expect(capacidades?.source).toBe("Localiza Salud");
  });

  it("F1.3 REGRESIÓN Granada-Zaidín: su IBSE provincial NO entra como fuente principal y conserva Localiza", () => {
    const view = viewOf(zaidin, ZAIDIN_INFORME);
    // El IBSE de Zaidín es proxy provincial (Lote A): no figura como fuente suelta.
    expect(view.header.sources).not.toContain("IBSE");
    expect(view.header.sources).toContain("Localiza Salud");
    // La cabecera conserva sus 6 fuentes (no se expulsa ninguna).
    expect(view.header.sources.length).toBe(6);
  });
});

describe("Lote B · F2 — jerarquía trazador/indicadores y etiquetas demo/proxy", () => {
  it("F2.1 Atarfe: concordancia singular «1 indicador trazador», nunca «1 indicadores»", () => {
    const view = viewOf(atarfe, ATARFE_INFORME);
    const flat = JSON.stringify(view);
    expect(flat).toContain("1 indicador trazador");
    expect(flat).not.toContain("1 indicadores trazadores");
    const estudios = view.sourceBlocks.find((b) => b.id === "estudios");
    expect(estudios).toBeDefined();
    expect(estudios!.whatItAdds).toContain("1 estudio y 1 indicador trazador destacado");
  });

  it("F2.2 REGRESIÓN Granada-Zaidín: concordancia plural intacta", () => {
    const view = viewOf(zaidin, ZAIDIN_INFORME);
    const estudios = view.sourceBlocks.find((b) => b.id === "estudios");
    expect(estudios).toBeDefined();
    expect(estudios!.whatItAdds).toContain("13 estudios y 8 indicadores trazadores destacados");
  });

  it("F2.3 Atarfe: indicadores locales sin comparador externo (etiqueta «disponibles», no «comparables»)", () => {
    const refs = buildIndicatorComparisonReferences({ workspace: atarfe }).references;
    expect(refs.length).toBeGreaterThan(0);
    // Ninguna referencia local tiene comparador provincial/autonómico → «disponibles».
    expect(
      refs.some((r) => r.provinceReference !== undefined || r.andalusiaReference !== undefined)
    ).toBe(false);
    // Ninguna fila es demo/proxy → la cabecera de la tabla es «Valor (muestra local)».
    expect(refs.every((r) => r.demoProxy === false)).toBe(true);
  });

  it("F2.4 REGRESIÓN Granada-Zaidín: sí tiene comparador provincial y filas demo/proxy", () => {
    const refs = buildIndicatorComparisonReferences({ workspace: zaidin }).references;
    expect(refs.some((r) => r.provinceReference !== undefined)).toBe(true);
    expect(refs.some((r) => r.demoProxy === true)).toBe(true);
  });
});

describe("Lote B · F3 — contador «Cuestiones para contraste» = agenda Grupo Motor", () => {
  it("F3.1 Atarfe: groupMotorAgenda = 2 y difiere de areasDeIntervencion = 1", () => {
    const view = viewOf(atarfe, ATARFE_INFORME);
    const rt = createMunicipalityRuntime({ workspace: atarfe });
    expect(view.groupMotorAgenda.length).toBe(2);
    expect(rt.psl.areasDeIntervencion.length).toBe(1);
    // El KPI toma groupMotorAgenda.length (2), no areasDeIntervencion.length (1).
  });

  it("F3.2 REGRESIÓN Granada-Zaidín: groupMotorAgenda = 6 (contador y tarjetas del mismo origen)", () => {
    const view = viewOf(zaidin, ZAIDIN_INFORME);
    expect(view.groupMotorAgenda.length).toBe(6);
  });
});

describe("Lote B · F7 — fallback OIT nombra el déficit real, sin gate change", () => {
  it("F7.1 Atarfe: el fallback nombra determinantes y participación, y no aconseja incorporar activos/indicadores", () => {
    const oit = generateOIT(generateLT1(atarfe.evidenceStore));
    const fallback = oit.opportunities.find((o) => o.id === "oit-expand-evidence-base");
    expect(fallback).toBeDefined();
    expect(fallback!.title).toBe("Triangular la base municipal de evidencia");
    expect(fallback!.rationale).toContain("determinantes con evidencia directa");
    expect(fallback!.rationale).toContain("participación");
    // Reconoce lo que YA existe y no aconseja re-incorporarlo (concordancia real, Lote C-1/O3).
    expect(fallback!.rationale).toContain("ya incorpora 5 activos y 5 indicadores");
    expect(fallback!.rationale).not.toContain("incorporar determinantes, activos, indicadores");
  });

  it("F7.2 los gates y la compilación no cambian: G-LHC-8 sigue sin dispararse en Atarfe", () => {
    const rt = createMunicipalityRuntime({ workspace: atarfe });
    const violations = validateCompilationPreconditions(rt.psl);
    expect(violations.some((v) => v.gate === "G-LHC-8")).toBe(false);
  });
});
