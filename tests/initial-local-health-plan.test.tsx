/**
 * Proyección canónica → modelo documental (GOV-SALIDA-01 · PR-2).
 *
 * Verifica que `buildPSLCDocumentModel` proyecta MECÁNICAMENTE la lectura
 * editorial + el espacio técnico para artefactos v2 (paridad de IDs, orden y
 * contenido; cada elemento una vez), aísla la ruta B histórica para artefactos
 * legacy, y no reconstruye desde `provenance`/`conclusiones.content`.
 *
 * Cobertura: Atarfe y Granada-Zaidín.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildDiagnosticAnswers,
} from "../src/application/health-profile";
import type { DiagnosticAnswers } from "../src/application/health-profile";
import { compileLocalHealthProfile } from "../src/application/health-profile-compiler";
import {
  buildPSLCDocumentModel,
} from "../src/application/psl-c-export";
import { loadWorkspaceFromLocalStorage } from "../src/infrastructure/persistence/local-storage";
import { createMunicipalityRuntime } from "../src/application/runtime";
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

const DIR = dirname(fileURLToPath(import.meta.url));
const exportPath = (muni: string, file: string) =>
  muni === "granada-zaidin"
    ? resolve(DIR, "..", "fixtures", "workspaces", "granada-zaidin-synthetic-test.json")
    : resolve(DIR, "..", "municipalities", muni, "exports", file);

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
      content: base.cierreInterpretativo.content || "Cierre interpretativo del equipo.",
    },
    priorizacionStatus: "complete",
    priorizacion: { ...base.priorizacion, consensoDocumentado: true },
  };
}

interface Caso {
  ws: MunicipalityWorkspace;
  psl: LocalHealthProfile;
  answers: DiagnosticAnswers;
  territory: string;
  province: string;
  v2: LocalHealthProfileArtifact;
  legacy: LocalHealthProfileArtifact;
}

function cargar(muni: string, file: string): Caso {
  store.set(`compas-ng:workspace:${muni}`, readFileSync(exportPath(muni, file), "utf8"));
  const ws = loadWorkspaceFromLocalStorage(muni);
  if (ws === null) throw new Error(`no rehidrata ${muni}`);
  const psl = validatedPSL(createMunicipalityRuntime({ workspace: ws }).psl);
  const answers = buildDiagnosticAnswers({
    workspace: ws,
    determinantTitles: ws.evidenceStore.atoms
      .filter((a) => a.kind === "determinant")
      .map((a) => a.title),
    assets: ws.evidenceStore.atoms
      .filter((a) => a.kind === "asset")
      .map((a) => ({ title: a.title, content: a.content })),
  });
  const territory = ws.municipality.identity.name;
  const province = ws.municipality.identity.province ?? "";
  const base = {
    psl,
    municipalityName: territory,
    municipalityProvince: province,
    existingArtifactCount: 0,
  };
  const v2 = compileLocalHealthProfile({ ...base, diagnosticAnswers: answers });
  const legacy = compileLocalHealthProfile(base);
  if (!v2.ok || !legacy.ok) throw new Error("compilación del arnés falló");
  return { ws, psl, answers, territory, province, v2: v2.artifact, legacy: legacy.artifact };
}

let zaidin: Caso;
let atarfe: Caso;

beforeAll(() => {
  zaidin = cargar("granada-zaidin", "compas-ng-workspace-granada-zaidin.json");
  atarfe = cargar("atarfe", "compas-ng-workspace-atarfe.json");
});


import { compileInitialLocalHealthPlan } from "../src/application/health-plan/compileInitialLocalHealthPlan";
import { buildPSLCDocx, buildPSLCPdf } from "../src/application/psl-c-export";
import { Packer } from "docx";
import { renderToStaticMarkup } from "react-dom/server";
import { InitialLocalHealthPlanPanel } from "../src/ui/components/InitialLocalHealthPlanPanel";
import { DocumentModelViewer } from "../src/ui/components/PSLCArtifactViewer";
import type { PlanDocument } from "../src/domain/action-plan-catalog/PlanDocument";

function workspace(): MunicipalityWorkspace {
 const current: PlanDocument = {
  schemaVersion: 1, municipalityId: "granada-zaidin", status: "validated",
  generatedAt: "2026-09-28T09:00:00Z", validatedBy: "Grupo Motor",
  paragraphs: [{text: "Edadismo", heading: true}, {text: "Reducir las actitudes edadistas entre las personas participantes en intervenciones comunitarias."}],
  traceabilityLinks: [{
   moduleId: "env-2027-2030",
   moduleTitle: "Envejecimiento saludable",
   moduleVersion: "zaidin-plan-accion-final-2026-09-25",
   strategicObjective: "Favorecer el envejecimiento saludable.",
   thematicBlockCode: "ENV-OG1",
   thematicBlock: "Edadismo",
   generalObjective: "ENV-OG1 · Reducir el edadismo",
   objectiveCode: "ENV-OE5.1",
   objectiveTitle: "Reducir las actitudes edadistas.",
   indicatorCode: "ENV-I5.1",
   indicatorTitle: "% de participantes que reducen actitudes edadistas.",
   indicatorRole: "action-plan",
   indicatorWorksheetKey: "granada-zaidin/env-2027-2030/ENV-I5.1",
   indicatorFichaStatus: "linked-actions",
   actionCards: [{
    id: "a1",
    name: "Programa intergeneracional",
    agreement: "Pendiente de acuerdo formal",
    owner: "Centro de salud",
    schedule: "Primer semestre",
    resources: "Sala comunitaria y equipo técnico",
    population: "Alumnado y personas mayores",
    contribution: "Desarrolla sesiones para reducir estereotipos.",
    requestedData: "Participantes y sesiones",
    source: "Registro de actividad",
    deliveryCount: 1,
    activities: [{id: "act-1", name: "Taller inicial", status: "planificado", schedule: "2027", evidence: "Acta"}],
    missingFields: [],
    isUsableFicha: true,
   }],
   consolidationCount: 0,
   pendingSummary: [],
  }]
 };
 return structuredClone({...zaidin.ws, validatedPSL: zaidin.psl, compiledProfiles: [atarfe.v2, zaidin.v2],
  validatedActionPlans: [
   {...current, generatedAt: "2026-09-20T09:00:00Z", paragraphs: [{text: "OBJETIVO ANTIGUO"}]},
   current,
   {...current, status: "draft", generatedAt: "2026-09-29T09:00:00Z", paragraphs: [{text: "SIN VALIDAR"}]},
   {...current, municipalityId: "atarfe", generatedAt: "2026-09-30T09:00:00Z", paragraphs: [{text: "OTRO MUNICIPIO"}]}
  ]});
}

const evalFramework: import("../src/domain/health-plan").PLSEvaluationFramework = {
 evaluationQuestions: ["¿Se redujo la soledad no deseada entre las personas mayores?"],
 evaluationMoments: ["Año 2 del plan"],
 evaluationResponsible: "Técnica de Salud Pública del Distrito Zaidín",
 baselineNote: "Línea base: encuesta de soledad 2026",
};

const unaddressedNeed: import("../src/domain/health-plan").UnaddressedNeed = {
 id: "n-salud-mental",
 title: "Salud mental en jóvenes",
 justification: "Prioridad reconocida pero fuera del alcance de este ciclo por falta de capacidad técnica.",
};

describe("Compilación inicial del Plan Local de Salud", () => {
 it("integra el Perfil completo y solo el último Plan validado del municipio, sin exigir actuaciones", () => {
  const ws = workspace();
  const before = JSON.stringify(ws);
  const result = compileInitialLocalHealthPlan(ws, false, "2026-09-28T10:00:00Z");
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  const profile = buildPSLCDocumentModel(zaidin.v2);
  for (const section of profile.sections) expect(result.document.sections).toContainEqual(section);
  const text = JSON.stringify(result.document);
  expect(text).toContain("intervenciones comunitarias");
  expect(text).not.toMatch(/OBJETIVO ANTIGUO|SIN VALIDAR|OTRO MUNICIPIO/);
  expect(text).toContain("1 fichas de actuación vinculadas");
  expect(text).toContain("Programa intergeneracional");
  expect(text).not.toContain("Pendiente de incorporar y validar las fichas");
  expect(text).toContain("BORRADOR");
  expect(JSON.stringify(ws)).toBe(before);
  ws.validatedActionPlans![1].paragraphs[0].text = "CAMBIO POSTERIOR";
  expect(JSON.stringify(result.document)).not.toContain("CAMBIO POSTERIOR");
 });
 it("bloquea fuentes ausentes, obsoletas, de otra versión o sin documento sellado", () => {
  const ws = workspace();
  expect(compileInitialLocalHealthPlan(ws, true).ok).toBe(false);
  expect(compileInitialLocalHealthPlan({...ws, validatedPSL: undefined}, false).ok).toBe(false);
  expect(compileInitialLocalHealthPlan({...ws, validatedActionPlans: []}, false).ok).toBe(false);
  expect(compileInitialLocalHealthPlan({...ws, compiledProfiles: [atarfe.v2]}, false).ok).toBe(false);
  expect(compileInitialLocalHealthPlan({...ws, compiledProfiles: [{...zaidin.v2, sourcePSLVersion: "anterior"}]}, false).ok).toBe(false);
  expect(compileInitialLocalHealthPlan({...ws, compiledProfiles: [{...zaidin.v2, canonicalDocument: undefined}]}, false).ok).toBe(false);
  ws.validatedPSL!.cierreInterpretativo.content += " Nueva revisión";
  expect(compileInitialLocalHealthPlan(ws, false).ok).toBe(false);
 });
 it("permite un Perfil aprobado después de compilarlo sin alterar el diagnóstico", () => {
  const ws = workspace();
  ws.validatedPSL!.status = "approved";
  expect(compileInitialLocalHealthPlan(ws, false).ok).toBe(true);
 });
 it("proyecta prioridades del Perfil sellado y no la selección viva", () => {
  const ws = workspace();
  ws.compiledProfiles![1].priorizacion.tematicasSeleccionadasLabels = ["PRIORIDAD VALIDADA"];
  const result = compileInitialLocalHealthPlan(ws, false);
  expect(result.ok).toBe(true);
  if (result.ok) expect(JSON.stringify(result.document)).toContain("PRIORIDAD VALIDADA");
 });
 it("ofrece generación solo cuando están disponibles las fuentes", () => {
  const enabled = renderToStaticMarkup(<InitialLocalHealthPlanPanel workspace={workspace()} pslIsStale={false} />);
  expect(enabled).toContain("Generar borrador del Plan Local de Salud");
  expect(enabled).not.toContain('disabled=""');
  const blocked = renderToStaticMarkup(<InitialLocalHealthPlanPanel workspace={workspace()} pslIsStale />);
  expect(blocked).toContain('disabled=""');
  expect(blocked).toContain("sus fuentes han cambiado");
 });
 it("produce vista, Word y PDF desde el mismo modelo completo", async () => {
  const result = compileInitialLocalHealthPlan(workspace(), false);
  if (!result.ok) throw new Error(result.issues.join("; "));
  const html = renderToStaticMarkup(<DocumentModelViewer model={result.document} label="Borrador inicial" />);
  expect(html).toContain("intervenciones comunitarias");
  expect(html).toContain("BORRADOR");
  const word = await Packer.toBuffer(buildPSLCDocx(result.document));
  expect(word.subarray(0,2).toString()).toBe("PK");
  const pdf = buildPSLCPdf(result.document);
  expect(pdf.getNumberOfPages()).toBeGreaterThan(1);
  expect(pdf.output()).toContain("intervenciones comunitarias");
 });

 it("sin marco de evaluación ni necesidades no priorizadas incluye los avisos de pendiente", () => {
  const result = compileInitialLocalHealthPlan(workspace(), false);
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  const text = JSON.stringify(result.document);
  expect(text).toContain("Pendiente de definir el marco de seguimiento y evaluación.");
  expect(text).toContain("Pendiente de documentar las necesidades no priorizadas");
 });

 it("con marco de evaluación incluye el aviso de disponibilidad y omite el de pendiente", () => {
  const ws = workspace();
  ws.validatedActionPlans![1] = { ...ws.validatedActionPlans![1], evaluationFramework: evalFramework };
  const result = compileInitialLocalHealthPlan(ws, false);
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  const text = JSON.stringify(result.document);
  expect(text).toContain("El marco de evaluación disponible");
  expect(text).not.toContain("Pendiente de definir el marco de seguimiento y evaluación.");
 });

 it("con necesidades no priorizadas documentadas omite el aviso de pendiente", () => {
  const ws = workspace();
  ws.validatedActionPlans![1] = { ...ws.validatedActionPlans![1], unaddressedNeeds: [unaddressedNeed] };
  const result = compileInitialLocalHealthPlan(ws, false);
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  const text = JSON.stringify(result.document);
  expect(text).not.toContain("Pendiente de documentar las necesidades no priorizadas");
 });
});
