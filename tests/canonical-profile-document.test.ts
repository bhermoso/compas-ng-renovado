/**
 * Contrato del documento canónico (GOV-SALIDA-01 · PR-1).
 *
 * Verifica el modelo canónico único —lectura editorial + espacio técnico
 * hermano— construido desde el contexto vivo (PSL validado + answers), y el
 * invariante estructural y byte a byte entre el PREVIEW canónico (construible
 * antes de compilar) y la REPRESENTACIÓN SELLADA por la compilación.
 *
 * Cobertura: Atarfe y Granada-Zaidín (integrated) + caso pending coherente.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildDiagnosticAnswers,
  buildCanonicalBuildContext,
  buildCanonicalProfileDocumentFromPSL,
  buildCanonicalEditorialView,
  buildCanonicalTechnicalSpace,
  buildPSLCCanonicalDocument,
  sealCanonicalProfileDocument,
  readSealedCanonicalDocument,
  normalizeSealedCanonicalProfileDocument,
  isLegacyEditorialView,
  PRIORITIZATION_PENDING_DECLARATION,
} from "../src/application/health-profile";
import type { DiagnosticAnswers } from "../src/application/health-profile";
import {
  compileLocalHealthProfile,
  validateCompiledBody,
} from "../src/application/health-profile-compiler";
import { loadWorkspaceFromLocalStorage } from "../src/infrastructure/persistence/local-storage";
import { createMunicipalityRuntime } from './helpers/legacyProfileRuntime';
import type { MunicipalityWorkspace } from "../src/domain/workspace";
import type { LocalHealthProfile } from "../src/domain/health-profile";

// ── localStorage en memoria para rehidratar los workspaces sellados ───────────
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

/** Fuerza el estado validado exigido por la compilación, preservando el contenido. */
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

interface Caso {
  ws: MunicipalityWorkspace;
  psl: LocalHealthProfile;
  answers: DiagnosticAnswers;
  territory: string;
  province: string;
}

function cargarCaso(muni: string, file: string): Caso {
  store.set(`compas-ng:workspace:${muni}`, readFileSync(exportPath(muni, file), "utf8"));
  const ws = loadWorkspaceFromLocalStorage(muni);
  if (ws === null) throw new Error(`El export de ${muni} no rehidrata`);
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
  return {
    ws,
    psl,
    answers,
    territory: ws.municipality.identity.name,
    province: ws.municipality.identity.province,
  };
}

let zaidin: Caso;
let atarfe: Caso;

beforeAll(() => {
  zaidin = cargarCaso("granada-zaidin", "compas-ng-workspace-granada-zaidin.json");
  atarfe = cargarCaso("atarfe", "compas-ng-workspace-atarfe.json");
});

// El preview canónico se construye desde el MISMO estado validado que sella el
// compilador; sin perfil, para reflejar el flujo de estos expedientes.
function previewDoc(caso: Caso) {
  return buildCanonicalProfileDocumentFromPSL({
    psl: caso.psl,
    perfil: undefined,
    answers: caso.answers,
    territory: caso.territory,
  });
}

function compilarSellado(caso: Caso) {
  const r = compileLocalHealthProfile({
    psl: caso.psl,
    municipalityName: caso.territory,
    municipalityProvince: caso.province,
    existingArtifactCount: 0,
    diagnosticAnswers: caso.answers,
  });
  if (!r.ok) throw new Error("la compilación del arnés falló");
  return r.artifact;
}

const CASOS = (): Array<[string, () => Caso]> => [
  ["Granada-Zaidín", () => zaidin],
  ["Atarfe", () => atarfe],
];

describe("Documento canónico — pureza y determinismo", () => {
  it.each(CASOS())("%s: build(ctx) es determinista (misma entrada → toEqual)", (_n, get) => {
    const caso = get();
    expect(previewDoc(caso)).toEqual(previewDoc(caso));
  });

  it.each(CASOS())("%s: sellar el mismo documento dos veces → payload/hash idénticos", (_n, get) => {
    const doc = previewDoc(get());
    const a = sealCanonicalProfileDocument(doc);
    const b = sealCanonicalProfileDocument(doc);
    expect(a.payload).toBe(b.payload);
    expect(a.canonicalHash).toBe(b.canonicalHash);
    expect(a.canonicalHash).toMatch(/^pslc-[0-9a-f]{8}$/);
  });
});

describe("Builders sin dependencia del artefacto compilado", () => {
  it("el módulo canónico no referencia el tipo LocalHealthProfileArtifact", () => {
    const source = readFileSync(
      resolve(DIR, "..", "src", "application", "health-profile", "canonicalProfileDocument.ts"),
      "utf8"
    );
    expect(source).not.toContain("LocalHealthProfileArtifact");
  });

  it.each(CASOS())("%s: lectura y espacio técnico se construyen del contexto vivo (sin artefacto)", (_n, get) => {
    const caso = get();
    const ctx = buildCanonicalBuildContext({
      psl: caso.psl,
      perfil: undefined,
      answers: caso.answers,
      territory: caso.territory,
    });
    const ev = buildCanonicalEditorialView(ctx);
    const ts = buildCanonicalTechnicalSpace(ctx);
    expect(ev.kind).toBe("canonical-editorial-view");
    expect(ts.kind).toBe("canonical-technical-space");
  });
});

describe("Invariante vivo ≡ sellado", () => {
  it.each(CASOS())("%s: preview canónico y sello coinciden ESTRUCTURALMENTE", (_n, get) => {
    const caso = get();
    const preview = previewDoc(caso);
    const artifact = compilarSellado(caso);
    const sealed = readSealedCanonicalDocument(artifact.canonicalDocument!);
    expect(sealed).not.toBeNull();
    expect(preview.editorialView).toEqual(sealed!.editorialView);
    expect(preview.technicalSpace).toEqual(sealed!.technicalSpace);
    expect(preview.provenance).toEqual(sealed!.provenance);
  });

  it.each(CASOS())("%s: preview canónico y sello coinciden BYTE A BYTE", (_n, get) => {
    const caso = get();
    const preview = previewDoc(caso);
    const artifact = compilarSellado(caso);
    // Se sella el MISMO documento ya construido; no se reconstruye con relojes.
    const sealed = sealCanonicalProfileDocument(preview);
    expect(sealed.payload).toBe(artifact.canonicalDocument!.payload);
    expect(sealed.canonicalHash).toBe(artifact.canonicalDocument!.canonicalHash);
  });
});

describe("editorialView es lectura pura; technicalSpace es hermano", () => {
  it.each(CASOS())("%s: editorialView no contiene claves técnicas", (_n, get) => {
    const ev = previewDoc(get()).editorialView;
    const keys = Object.keys(ev);
    for (const forbidden of [
      "technicalAnnex",
      "references",
      "comparativeReferences",
      "cautions",
      "matrix",
      "epistemicMatrix",
      "documentaryBase",
      "knowledgeState",
    ]) {
      expect(keys).not.toContain(forbidden);
    }
  });

  it.each(CASOS())("%s: technicalSpace es hermano e íntegro", (_n, get) => {
    const doc = previewDoc(get());
    expect(doc.technicalSpace.kind).toBe("canonical-technical-space");
    // No anidado en la lectura.
    expect("technicalSpace" in doc.editorialView).toBe(false);
    expect(doc.technicalSpace.comparativeReferences.length).toBeGreaterThan(0);
    expect(doc.technicalSpace.epistemicMatrix.length).toBeGreaterThan(0);
    expect(doc.technicalSpace.cautions.length).toBeGreaterThan(0);
    expect(doc.technicalSpace.documentaryBase.evidenceAtoms).toBeGreaterThanOrEqual(0);
  });
});

describe("Cierre humano una sola vez", () => {
  it.each(CASOS())("%s: humanClosing presente en la lectura y ausente del espacio técnico", (_n, get) => {
    const doc = previewDoc(get());
    expect(doc.editorialView.humanClosing).not.toBeNull();
    expect(doc.editorialView.humanClosing?.kind).toBe("authored-closing");
    expect(doc.editorialView.humanClosing?.provenance.generatedBySystem).toBe(false);
    // No reaparece en el espacio técnico.
    expect(JSON.stringify(doc.technicalSpace)).not.toContain(
      doc.editorialView.humanClosing!.content
    );
  });

  it("humanClosing es null cuando el cierre está vacío", () => {
    const caso = zaidin;
    const doc = buildCanonicalProfileDocumentFromPSL({
      psl: {
        ...caso.psl,
        cierreInterpretativo: { ...caso.psl.cierreInterpretativo, content: "   " },
      },
      perfil: undefined,
      answers: caso.answers,
      territory: caso.territory,
    });
    expect(doc.editorialView.humanClosing).toBeNull();
  });
});

describe("readingStatus coherente — integrated y prioritization-pending", () => {
  it.each(CASOS())("%s: caso integrated → hilos presentes y sin declaración pendiente", (_n, get) => {
    const doc = previewDoc(get());
    expect(doc.editorialView.readingStatus).toBe("integrated");
    expect(doc.editorialView.territorialReadings.length).toBeGreaterThan(0);
    expect(doc.editorialView.pendingDeclaration).toBeNull();
  });

  it("prioritization-pending → 0 hilos y declaración presente (no se fabrica lectura)", () => {
    // Mismos answers de Zaidín pero contexto sin evidencia portadora (0 átomos):
    // la copia canónica declara la pendencia y vacía los hilos.
    const pendingDoc = buildPSLCCanonicalDocument({
      answers: zaidin.answers,
      territory: zaidin.territory,
      status: "validated",
      generatedAtISO: "2026-07-01T09:30:00.000Z",
      pslContext: {
        totalEvidenceAtoms: 0,
        complementaryStudyCount: 0,
        assetCount: 0,
        hasParticipatoryPrioritisation: true,
        prioritizacion: zaidin.psl.priorizacion,
      },
    });
    expect(pendingDoc.editorialView.readingStatus).toBe("prioritization-pending");
    expect(pendingDoc.editorialView.territorialReadings).toHaveLength(0);
    expect(pendingDoc.editorialView.pendingDeclaration).toBe(
      PRIORITIZATION_PENDING_DECLARATION
    );
  });
});

describe("Estado del conocimiento — sin perfil ⇒ null", () => {
  it.each(CASOS())("%s: perfil undefined ⇒ knowledgeState null vivo y sellado", (_n, get) => {
    const caso = get();
    const doc = previewDoc(caso);
    expect(doc.technicalSpace.knowledgeState).toBeNull();
    const artifact = compilarSellado(caso);
    const sealed = readSealedCanonicalDocument(artifact.canonicalDocument!);
    expect(sealed!.technicalSpace.knowledgeState).toBeNull();
  });
});

describe("Inmunidad del sello frente a mutaciones posteriores", () => {
  it("mutar los answers tras construir no altera el documento ni su sello", () => {
    const doc = previewDoc(zaidin);
    const antes = sealCanonicalProfileDocument(doc);
    // Mutación del objeto vivo posterior a la construcción.
    zaidin.answers.senalesPresentes.push("SEÑAL-MUTANTE-PR1");
    const despues = sealCanonicalProfileDocument(doc);
    expect(despues.payload).toBe(antes.payload);
    expect(despues.payload).not.toContain("SEÑAL-MUTANTE-PR1");
    zaidin.answers.senalesPresentes.pop();
  });
});

describe("Normalización y fallback legacy", () => {
  it("un sello v2 completo normaliza a lectura + espacio técnico", () => {
    const sealed = sealCanonicalProfileDocument(previewDoc(zaidin));
    const norm = normalizeSealedCanonicalProfileDocument(sealed);
    expect(norm).not.toBeNull();
    expect(isLegacyEditorialView(norm!)).toBe(false);
  });

  it("un sello v2 sin technicalSpace cae a legacy sin fabricar contenido", () => {
    const sealed = sealCanonicalProfileDocument(previewDoc(zaidin));
    const parsed = JSON.parse(sealed.payload) as Record<string, unknown>;
    delete parsed.technicalSpace;
    const mutilado = { ...sealed, payload: JSON.stringify(parsed) };
    const norm = normalizeSealedCanonicalProfileDocument(mutilado);
    expect(norm).not.toBeNull();
    expect(isLegacyEditorialView(norm!)).toBe(true);
  });
});

describe("G-LHC-9 migrado — lee editorialView.readingStatus", () => {
  it("prioritization-pending con hilos fabricados → viola G-LHC-9", () => {
    const doc = previewDoc(zaidin);
    const incoherente = {
      ...doc,
      editorialView: {
        ...doc.editorialView,
        readingStatus: "prioritization-pending" as const,
        // Mantiene los hilos: incoherencia readingStatus ↔ territorialReadings.
      },
    };
    expect(incoherente.editorialView.territorialReadings.length).toBeGreaterThan(0);
    const v = validateCompiledBody(incoherente, zaidin.psl);
    expect(v.some((x) => x.gate === "G-LHC-9")).toBe(true);
  });

  it("documento canónico coherente → sin violación G-LHC-9", () => {
    const doc = previewDoc(zaidin);
    const v = validateCompiledBody(doc, zaidin.psl);
    expect(v).toHaveLength(0);
  });
});
