/**
 * Verificación del PASO 1 (aditivo) del artefacto unificado del Perfil:
 * congelación del documento canónico (esquema 2) + hash, sin retirar legacy.
 *
 * Criterio rector (Art. 17 / I-LHPM-6): compilar dos veces desde el mismo PSL
 * produce `canonicalDocument` y hash idénticos, y mutar el workspace después no
 * cambia el artefacto. La forma legacy (sin `diagnosticAnswers`) se preserva.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { compileLocalHealthProfile } from "../src/application/health-profile-compiler";
import type { CompileLocalHealthProfileInput } from "../src/application/health-profile-compiler";
import { buildSealedCanonicalDocument } from "../src/application/psl-c-canonical";
import { buildDiagnosticAnswers } from "../src/application/health-profile";
import type { DiagnosticAnswers } from "../src/application/health-profile";
import { loadWorkspaceFromLocalStorage } from "../src/infrastructure/persistence/local-storage";
import { createMunicipalityRuntime } from './helpers/legacyProfileRuntime';
import type { MunicipalityWorkspace } from "../src/domain/workspace";
import type { LocalHealthProfile } from "../src/domain/health-profile";

// ── localStorage mínimo para rehidratar el workspace ──────────────────────────
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

/** PSL real de Granada-Zaidín, parcheado al mínimo para atravesar los gates de
 *  compilación (G-LHC-1..7) sin fabricar un PSL sintético. */
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
      content:
        base.cierreInterpretativo.content || "Cierre interpretativo del equipo.",
    },
    priorizacionStatus: "complete",
    priorizacion: { ...base.priorizacion, consensoDocumentado: true },
  };
}

function baseInput(): CompileLocalHealthProfileInput {
  return {
    psl: validatedPSL(psl),
    municipalityName: ws.municipality.identity.name,
    municipalityProvince: "Granada",
    existingArtifactCount: 0,
    diagnosticAnswers: answers,
  };
}

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
});

describe("PASO 1 — documento canónico congelado (esquema 2)", () => {
  it("el builder sella un documento determinista (misma entrada → mismo sello)", () => {
    const meta = {
      answers,
      territory: ws.municipality.identity.name,
      status: "validated" as const,
      informeTitulo: psl.healthReportTitle,
      generatedAtISO: psl.generatedAt,
      pslContext: {
        totalEvidenceAtoms: psl.totalEvidenceAtoms,
        complementaryStudyCount: psl.complementaryStudyCount,
        assetCount: psl.assetCount,
        hasParticipatoryPrioritisation:
          psl.thematicPrioritisationPresent ||
          psl.priorizacion.hasParticipatorySelection,
        prioritizacion: psl.priorizacion,
      },
    };
    const a = buildSealedCanonicalDocument(meta);
    const b = buildSealedCanonicalDocument(meta);
    expect(a).toEqual(b);
    expect(a.canonicalHash).toMatch(/^pslc-[0-9a-f]{8}$/);
    expect(a.schemaVersion).toBe(2);
  });

  it("compilar dos veces el mismo PSL produce canonicalDocument y hash idénticos", () => {
    const r1 = compileLocalHealthProfile(baseInput());
    const r2 = compileLocalHealthProfile(baseInput());
    expect(r1.ok).toBe(true);
    expect(r2.ok).toBe(true);
    if (!r1.ok || !r2.ok) return;
    const c1 = r1.artifact.canonicalDocument;
    const c2 = r2.artifact.canonicalDocument;
    expect(c1).toBeDefined();
    expect(c1).toEqual(c2);
    expect(c1!.canonicalHash).toBe(c2!.canonicalHash);
  });

  it("mutar el workspace/answers tras compilar NO cambia el artefacto", () => {
    const r = compileLocalHealthProfile(baseInput());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const sealedAntes = r.artifact.canonicalDocument!.payload;
    const hashAntes = r.artifact.canonicalDocument!.canonicalHash;

    // Mutación in-place del objeto vivo de respuestas.
    answers.senalesPresentes.push("SEÑAL-MUTANTE-POST-COMPILACIÓN");

    expect(r.artifact.canonicalDocument!.payload).toBe(sealedAntes);
    expect(r.artifact.canonicalDocument!.canonicalHash).toBe(hashAntes);
    expect(sealedAntes).not.toContain("SEÑAL-MUTANTE-POST-COMPILACIÓN");

    // Limpieza para no contaminar otros tests del bloque.
    answers.senalesPresentes.pop();
  });

  it("forma legacy: sin diagnosticAnswers no se congela canonicalDocument", () => {
    const { diagnosticAnswers: _omit, ...legacyInput } = baseInput();
    void _omit;
    const r = compileLocalHealthProfile(legacyInput);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.artifact.canonicalDocument).toBeUndefined();
  });
});
