/**
 * tests/psl-legado-saneado.test.tsx
 *
 * PSLs validados y artefactos PSL-C compilados ANTES de la denominación
 * institucional del Informe («Informe de salud de El Zaidín») no deben
 * filtrar nombres técnicos («estilo Atarfe», «Abril2023», «.docx») en el
 * producto visible: pantalla, visor institucional, DOCX y PDF.
 *
 * Decisión protegida: el dato bruto persistido/congelado NO se modifica
 * (el artefacto conserva su contenido histórico exacto); el saneado es de
 * presentación/exportación. Y el aviso «Narrativa anterior» acompaña a los
 * PSL validados con generador antiguo.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { loadWorkspaceFromLocalStorage } from "../src/infrastructure/persistence/local-storage";
import { createMunicipalityRuntime } from './helpers/legacyProfileRuntime';
import { compileLocalHealthProfile } from "../src/application/health-profile-compiler";
import { buildPSLCDocumentModel } from "../src/application/psl-c-export";
import { exportPSLCArtifactToDocxBuffer, exportPSLCArtifactToPdfBuffer } from "../src/application/psl-c-export";
import { LocalHealthProfileView } from "../src/ui/components/LocalHealthProfileView";
import { PSLCArtifactViewer } from "../src/ui/components/PSLCArtifactViewer";
import type { LocalHealthProfileArtifact } from "../src/domain/health-profile-artifact";
import type { LocalHealthProfile } from "../src/domain/health-profile";
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

const TITULO_LEGADO = "Informe Salud Granada Abril2023 estilo Atarfe";

let ws: MunicipalityWorkspace;
let pslLegado: LocalHealthProfile;
let artifactLegado: LocalHealthProfileArtifact;

beforeAll(() => {
  store.set(
    "compas-ng:workspace:granada-zaidin",
    readFileSync(EXPORT_PATH, "utf8")
  );
  const loaded = loadWorkspaceFromLocalStorage("granada-zaidin");
  if (loaded === null) throw new Error("El export vigente no rehidrata");
  ws = loaded;
  const generado = createMunicipalityRuntime({ workspace: ws }).psl;

  // PSL legado: validado antes de la denominación institucional y de la
  // versión narrativa — el título técnico vive en el campo Y dentro del texto.
  pslLegado = {
    ...generado,
    status: "validated",
    validatedAt: "2026-07-07T10:00:00.000Z",
    validatedBy: "Equipo técnico de salud pública",
    narrativeGeneratorVersion: undefined,
    healthReportTitle: TITULO_LEGADO,
    conclusiones: {
      ...generado.conclusiones,
      content: generado.conclusiones.content
        .split("Informe de salud de El Zaidín")
        .join(TITULO_LEGADO),
    },
  };

  const compilable: LocalHealthProfile = {
    ...pslLegado,
    conclusiones: { ...pslLegado.conclusiones, status: "authored" },
    cierreInterpretativo: { ...pslLegado.cierreInterpretativo, status: "authored" },
    priorizacionStatus: "complete",
    priorizacion: {
      ...pslLegado.priorizacion,
      consensoDocumentado: true,
      deliberacionNota: "Consenso documentado.",
    },
  };
  const result = compileLocalHealthProfile({
    psl: compilable,
    municipalityName: ws.municipality.identity.name,
    municipalityProvince: ws.municipality.identity.province ?? "",
    existingArtifactCount: 0,
  });
  if (!result.ok) throw new Error("compilación del arnés legado falló");
  artifactLegado = result.artifact;
}, 60000);

function renderPantalla(): string {
  return renderToStaticMarkup(
    <LocalHealthProfileView
      psl={pslLegado}
      previewPSL={pslLegado}
      isValidatedPreview={true}
      pslIsStale={false}
      municipalityName={ws.municipality.identity.name}
      compiledProfiles={[artifactLegado]}
      onValidate={() => {}}
      onInvalidate={() => {}}
      onCompile={() => {}}
    />
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Tarea 4 — Pantalla con PSL legado
// ══════════════════════════════════════════════════════════════════════════════

describe("PSL legado — pantalla saneada", () => {
  it("muestra la denominación institucional y nunca el título técnico", () => {
    const html = renderPantalla();
    expect(html).toContain("Informe de salud de El Zaidín");
    expect(html).not.toContain("estilo Atarfe");
    expect(html).not.toContain("Abril2023");
  });

  it("muestra el aviso «Narrativa anterior» con las instrucciones", () => {
    const html = renderPantalla();
    expect(html).toContain("Narrativa anterior");
    expect(html).toContain("conserva la narrativa anterior");
    expect(html).toContain("revierte a borrador");
    expect(html).toContain("compilar un nuevo PSL-C");
  });

  it("no sobrescribe el dato persistido ni el artefacto congelado", () => {
    renderPantalla();
    // El PSL legado conserva su título y texto brutos (el saneado es visual)
    expect(pslLegado.healthReportTitle).toBe(TITULO_LEGADO);
    expect(pslLegado.conclusiones.content).toContain("estilo Atarfe");
    // El artefacto congelado conserva su contenido histórico exacto
    expect(artifactLegado.informeSalud.title).toBe(TITULO_LEGADO);
    expect(artifactLegado.conclusiones.content).toContain("estilo Atarfe");
    // Y sigue listado en pantalla como documento congelado
    expect(renderPantalla()).toContain("Documento congelado");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Tarea 5 — Visor institucional y exports con artefacto legado
// ══════════════════════════════════════════════════════════════════════════════

describe("PSL-C legado — visor y exports saneados", () => {
  it("el visor institucional no filtra el título técnico", () => {
    const html = renderToStaticMarkup(
      <PSLCArtifactViewer artifact={artifactLegado} />
    );
    expect(html).not.toContain("estilo Atarfe");
    expect(html).not.toContain("Abril2023");
    expect(html).toContain("Informe de salud de El Zaidín");
  });

  it("el modelo documental (fuente única de DOCX y PDF) queda saneado", () => {
    const model = buildPSLCDocumentModel(artifactLegado);
    const texto = [
      model.title,
      ...model.portada,
      ...model.sections.flatMap((s) => [s.title, ...s.paragraphs]),
    ].join("\n");
    expect(texto).not.toContain("estilo Atarfe");
    expect(texto).not.toContain("Abril2023");
    expect(texto).toContain("Informe de salud de El Zaidín");
  });

  it("DOCX y PDF legados se generan válidos desde el modelo saneado", async () => {
    const docx = await exportPSLCArtifactToDocxBuffer(artifactLegado);
    expect(docx.length).toBeGreaterThan(1000);
    expect(docx[0]).toBe(0x50); // PK
    const pdf = await exportPSLCArtifactToPdfBuffer(artifactLegado);
    expect(pdf.length).toBeGreaterThan(2000);
    expect(String.fromCharCode(pdf[0], pdf[1], pdf[2], pdf[3])).toBe("%PDF");
  });
});
