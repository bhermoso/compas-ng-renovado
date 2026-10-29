/**
 * CONV-A — Previsualización documental canónica viva (invariante vivo ≡ sellado).
 *
 * Defecto (D-LIVE): la pantalla construía la lectura con
 * `buildProfileIntegratedEditorialView` directo (forma legacy, sin gate),
 * divergiendo del documento sellado para el caso pendiente (Zagra) y en la
 * estructura (readingStatus / pendencia / señales principales / cierre /
 * frontera) en todos los casos.
 *
 * Corrección: la previsualización proyecta la MISMA `CanonicalEditorialView` que
 * sella la compilación, construida efímeramente desde el mismo snapshot
 * (`buildCanonicalBuildContext` → `buildCanonicalEditorialView`).
 *
 * Este test compara DOS RUTAS PÚBLICAS DISTINTAS sobre el mismo snapshot:
 *   (A) preview efímero        : buildCanonicalEditorialView(buildCanonicalBuildContext(...))
 *   (B) documento sellado/leído: buildCanonicalProfileDocumentFromPSL(...) → seal → read
 * y exige que (A) deep-equals (B).editorialView. No son dos llamadas al mismo
 * helper: (B) atraviesa ensamblado + sellado (wire) + normalización de lectura.
 *
 * Cobertura: Atarfe, Granada-Zaidín, Zagra pendiente.
 */

import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LocalHealthProfileView } from "../src/ui/components/LocalHealthProfileView";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseWorkspaceJSON } from "../src/infrastructure/persistence/local-storage";
import {
  buildDiagnosticAnswers,
  serializeValidatedAnswers,
  parseValidatedAnswersSnapshot,
  selectDocumentPreviewContext,
} from "../src/application/health-profile";
import {
  buildCanonicalBuildContext,
  buildCanonicalEditorialView,
  buildCanonicalProfileDocumentFromPSL,
  sealCanonicalProfileDocument,
  readSealedCanonicalDocument,
} from "../src/application/psl-c-canonical";
import { createMunicipalityRuntime } from './helpers/legacyProfileRuntime';
import { createMunicipalityContext } from "../src/domain/municipality";
import { createEvidenceStore } from "../src/domain/evidence";
import { createMunicipalDocumentRepository } from "../src/domain/repository";
import { createMunicipalityWorkspace } from "../src/domain/workspace";
import { createThematicPrioritisation } from "../src/domain/thematic-prioritisation";
import type { MunicipalityWorkspace } from "../src/domain/workspace";
import type { HealthReportDocument } from "../src/domain/health-report";
import type { LocalHealthProfile } from "../src/domain/health-profile";
import type { DiagnosticAnswers } from "../src/application/health-profile";

const _dir = dirname(fileURLToPath(import.meta.url));

// ── Fixtures ──────────────────────────────────────────────────────────────────
function seed(id: string): MunicipalityWorkspace {
  return parseWorkspaceJSON(
    readFileSync(resolve(_dir, `../public/seeds/compas-ng-workspace-${id}.json`), "utf8")
  )!;
}

const ZAGRA_INFORME_TEXTO =
  "El Informe de Salud de Zagra describe la situación de salud del municipio: " +
  "demografía, mortalidad y morbilidad principales. Se preserva íntegro como " +
  "documento y no se atomiza en el flujo de evidencia.";

function zagraHealthReport(): HealthReportDocument {
  return {
    id: "hr-zagra",
    municipalityId: "zagra",
    linkedDocumentId: "doc-informe-zagra",
    sourceFileName: "informe-salud-zagra.pdf",
    title: "Informe de Salud de Zagra 2025",
    authors: [],
    body: {
      originalText: ZAGRA_INFORME_TEXTO,
      format: "plain",
      charCount: ZAGRA_INFORME_TEXTO.length,
      isAuthoritative: true,
    },
    sections: [
      { key: "demografia", title: "Demografía", bodyText: "Estructura y evolución de la población de Zagra.", sortOrder: 1, isAuthoritative: true },
      { key: "mortalidad", title: "Mortalidad", bodyText: "Principales causas de mortalidad a escala municipal.", sortOrder: 2, isAuthoritative: true },
    ],
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  };
}

/** Workspace Zagra: Informe presente, priorización ciudadana, 0 átomos (pendiente). */
function zagraWorkspace(): MunicipalityWorkspace {
  const municipality = createMunicipalityContext({ id: "zagra", name: "Zagra", province: "Granada" });
  const base = createMunicipalityWorkspace(
    municipality,
    createMunicipalDocumentRepository({ municipalityId: "zagra" }),
    createEvidenceStore("zagra")
  );
  return {
    ...base,
    healthReport: zagraHealthReport(),
    thematicPrioritisation: createThematicPrioritisation("zagra", [
      "bienestar-emocional",
      "envejecimiento-activo",
    ]),
  };
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

// ── Rutas públicas ────────────────────────────────────────────────────────────
/** (A) Preview efímero, EXACTAMENTE como la pantalla (perfil undefined). */
function ephemeralPreviewEditorialView(ws: MunicipalityWorkspace) {
  const psl = createMunicipalityRuntime({ workspace: ws }).psl;
  const answers = answersOf(ws);
  return buildCanonicalEditorialView(
    buildCanonicalBuildContext({
      psl,
      perfil: undefined,
      answers,
      territory: ws.municipality.identity.name,
    })
  );
}

/** (B) Documento construido → sellado (wire) → leído: la lectura del artefacto. */
function sealedAndReadEditorialView(ws: MunicipalityWorkspace) {
  const psl = createMunicipalityRuntime({ workspace: ws }).psl;
  const answers = answersOf(ws);
  const doc = buildCanonicalProfileDocumentFromPSL({
    psl,
    perfil: ws.perfilLocalDeSalud,
    answers,
    territory: ws.municipality.identity.name,
  });
  const wire = sealCanonicalProfileDocument(doc);
  const read = readSealedCanonicalDocument(wire);
  expect(read).not.toBeNull();
  return read!.editorialView;
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. Invariante vivo ≡ sellado (rutas públicas completas)
// ══════════════════════════════════════════════════════════════════════════════
describe("CONV-A · vivo ≡ sellado (preview efímero == editorialView sellada y leída)", () => {
  const casos: Array<[string, () => MunicipalityWorkspace]> = [
    ["Atarfe (integrado)", () => seed("atarfe")],
    ["Granada-Zaidín (integrado)", () => seed("granada-zaidin")],
    ["Zagra (lectura pendiente)", () => zagraWorkspace()],
  ];
  for (const [label, wsF] of casos) {
    it(`${label}: preview efímero deep-equals editorialView sellada`, () => {
      const ws = wsF();
      const ephemeral = ephemeralPreviewEditorialView(ws);
      const sealed = sealedAndReadEditorialView(ws);
      expect(ephemeral).toEqual(sealed);
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. La lectura canónica gobierna readingStatus, pendencia, señales y frontera
// ══════════════════════════════════════════════════════════════════════════════
describe("CONV-A · la previsualización respeta la doctrina canónica", () => {
  it("Zagra pendiente: vacía territorialReadings y declara pendencia (regla N+1)", () => {
    const ev = ephemeralPreviewEditorialView(zagraWorkspace());
    expect(ev.readingStatus).toBe("prioritization-pending");
    expect(ev.territorialReadings.length).toBe(0);
    expect(ev.pendingDeclaration).toBeTruthy();
  });

  it("Atarfe integrado: señales principales, ranking y frontera institucional presentes", () => {
    const ev = ephemeralPreviewEditorialView(seed("atarfe"));
    expect(ev.readingStatus).toBe("integrated");
    expect(ev.territorialReadings.length).toBeGreaterThan(0);
    expect(ev.principalSignals.length).toBeGreaterThan(0);
    expect(ev.pendingDeclaration).toBeNull();
    expect(ev.institutionalBoundary).toBeDefined();
    expect(ev.humanClosing).toBeDefined();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Cableado de la vista: sin reconstrucción legacy ni props paralelas
// ══════════════════════════════════════════════════════════════════════════════
describe("CONV-A · LocalHealthProfileView no usa la ruta legacy ni props paralelas", () => {
  const src = readFileSync(resolve(_dir, "../src/ui/components/LocalHealthProfileView.tsx"), "utf8");

  it("construye la previsualización con buildCanonicalEditorialView", () => {
    expect(src).toContain("buildCanonicalEditorialView(");
    expect(src).toContain("buildCanonicalBuildContext(");
  });

  it("YA NO usa buildProfileIntegratedEditorialView (ruta directa legacy)", () => {
    expect(src).not.toContain("buildProfileIntegratedEditorialView");
  });

  it("NO duplica cierre ni frontera por props paralelas (proceden de la vista canónica)", () => {
    expect(src).not.toContain("buildAuthoredClosing");
    expect(src).not.toContain("buildInstitutionalBoundary");
  });

  it("rotula el borrador no validado como «Borrador vivo sin validar · no institucional»", () => {
    expect(src).toContain("Borrador vivo sin validar · no institucional");
  });

  it("el gate isEmpty se deriva del snapshot de preview (previewPSL), no del runtime", () => {
    expect(src).toContain("previewPSL.totalEvidenceAtoms === 0");
    expect(src).not.toContain("psl.totalEvidenceAtoms === 0");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Snapshot opaco: (de)serialización y validación estructural (capa application)
// ══════════════════════════════════════════════════════════════════════════════
describe("CONV-A · snapshot opaco de answers (payload string)", () => {
  it("round-trip serialize→parse preserva las answers (deep-equal al detach clone)", () => {
    const answers = answersOf(seed("atarfe"));
    const parsed = parseValidatedAnswersSnapshot(serializeValidatedAnswers(answers));
    expect(parsed).not.toBeNull();
    expect(parsed).toEqual(JSON.parse(JSON.stringify(answers)));
  });

  it("payload ausente / ilegible / estructuralmente inválido → null (nunca fallback silencioso)", () => {
    expect(parseValidatedAnswersSnapshot(undefined)).toBeNull();
    expect(parseValidatedAnswersSnapshot("")).toBeNull();
    expect(parseValidatedAnswersSnapshot("{ no es json")).toBeNull();
    expect(parseValidatedAnswersSnapshot(JSON.stringify({ foo: 1 }))).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Selección de contexto: nunca recombina validatedPSL con answers vivos
// ══════════════════════════════════════════════════════════════════════════════
describe("CONV-A · selección del snapshot de preview", () => {
  it("validatedPSL + snapshot válido ⇒ preview validada desde AMBOS snapshots", () => {
    const ws = seed("atarfe");
    const psl = createMunicipalityRuntime({ workspace: ws }).psl;
    const answers = answersOf(ws);
    const ctx = selectDocumentPreviewContext({
      validatedPSL: { ...psl, status: "validated" as const },
      validatedAnswersSnapshot: serializeValidatedAnswers(answers),
      livePSL: psl,
      liveAnswers: answers,
    });
    expect(ctx.isValidatedPreview).toBe(true);
    expect(ctx.previewAnswers).toEqual(JSON.parse(JSON.stringify(answers)));
  });

  it("legacy: validatedPSL presente pero snapshot ausente ⇒ borrador vivo, NO recombina", () => {
    const ws = seed("atarfe");
    const psl = createMunicipalityRuntime({ workspace: ws }).psl;
    const answers = answersOf(ws);
    const ctx = selectDocumentPreviewContext({
      validatedPSL: { ...psl, status: "validated" as const },
      validatedAnswersSnapshot: undefined,
      livePSL: psl,
      liveAnswers: answers,
    });
    expect(ctx.isValidatedPreview).toBe(false);
    expect(ctx.previewPSL).toBe(psl); // el vivo, nunca el validado con answers vivos
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. Invariante TEMPORAL A→B: la preview validada no deriva al mutar el runtime
// ══════════════════════════════════════════════════════════════════════════════
function editorialViewFrom(
  psl: LocalHealthProfile,
  answers: DiagnosticAnswers,
  territory: string
) {
  return buildCanonicalEditorialView(
    buildCanonicalBuildContext({ psl, perfil: undefined, answers, territory })
  );
}
function sealedEditorialViewFrom(
  psl: LocalHealthProfile,
  answers: DiagnosticAnswers,
  territory: string
) {
  const doc = buildCanonicalProfileDocumentFromPSL({
    psl,
    perfil: undefined,
    answers,
    territory,
  });
  const read = readSealedCanonicalDocument(sealCanonicalProfileDocument(doc));
  expect(read).not.toBeNull();
  return read!.editorialView;
}

describe("CONV-A · invariante temporal A→B (no drift al mutar documentos/evidencias/runtime)", () => {
  it("valida A y sella A; muta a B; la pantalla con A validado + B vivo sigue == sello de A", () => {
    // (1) Validar A (Atarfe, con evidencia) y capturar snapshot atómico.
    const wsA = seed("atarfe");
    const answersA = answersOf(wsA);
    const territory = wsA.municipality.identity.name;
    const validatedPSL_A = {
      ...createMunicipalityRuntime({ workspace: wsA }).psl,
      status: "validated" as const,
    };
    const snapshotA = serializeValidatedAnswers(answersA);

    // (2) Sellar desde A (por el mismo snapshot que consumiría la compilación).
    const parsedA = parseValidatedAnswersSnapshot(snapshotA)!;
    const sealedA = sealedEditorialViewFrom(validatedPSL_A, parsedA, territory);

    // (3) Mutar documentos/evidencias/runtime hasta B (Zagra pendiente, 0 átomos).
    const wsB = zagraWorkspace();
    const answersB = answersOf(wsB);
    const pslB = createMunicipalityRuntime({ workspace: wsB }).psl;

    // (4) Render con A VALIDADO y B VIVO.
    const ctx = selectDocumentPreviewContext({
      validatedPSL: validatedPSL_A,
      validatedAnswersSnapshot: snapshotA,
      livePSL: pslB,
      liveAnswers: answersB,
    });
    expect(ctx.isValidatedPreview).toBe(true);
    expect(ctx.previewPSL).toBe(validatedPSL_A);

    // (5) La preview sigue siendo deep-equal a la lectura sellada de A…
    const preview = editorialViewFrom(ctx.previewPSL, ctx.previewAnswers, territory);
    expect(preview).toEqual(sealedA);
    // …y NO adopta la lectura de B…
    const readingB = editorialViewFrom(pslB, answersB, territory);
    expect(preview).not.toEqual(readingB);
    // …conserva el rótulo institucional (isValidatedPreview=true)…
    expect(ctx.isValidatedPreview).toBe(true);
    // …y NO desaparece por un isEmpty de B: el gate lo gobierna A (con evidencia).
    expect(ctx.previewPSL.totalEvidenceAtoms).toBeGreaterThan(0);
    expect(pslB.totalEvidenceAtoms).toBe(0);

    // (6) Invalidar ⇒ adopta B; revalidar sobre B ⇒ snapshot B.
    const invalidated = selectDocumentPreviewContext({
      validatedPSL: undefined,
      validatedAnswersSnapshot: undefined,
      livePSL: pslB,
      liveAnswers: answersB,
    });
    expect(invalidated.isValidatedPreview).toBe(false);
    expect(invalidated.previewPSL).toBe(pslB);

    const revalidatedB = selectDocumentPreviewContext({
      validatedPSL: { ...pslB, status: "validated" as const },
      validatedAnswersSnapshot: serializeValidatedAnswers(answersB),
      livePSL: pslB,
      liveAnswers: answersB,
    });
    expect(revalidatedB.isValidatedPreview).toBe(true);
    expect(revalidatedB.previewAnswers).toEqual(JSON.parse(JSON.stringify(answersB)));
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. Invariante A→B a nivel de PANTALLA (render real de LocalHealthProfileView)
//    Cierra la grieta: no basta el modelo; se renderiza la pantalla con A validado
//    y B vivo, y se comprueba en el HTML (paso 4 de la especificación rectora).
// ══════════════════════════════════════════════════════════════════════════════
/** Render de la pantalla replicando EXACTAMENTE el cableado de App:
 *  psl = runtime vivo (B); previewPSL/diagnosticAnswers/isValidatedPreview = ctx. */
function renderScreen(input: {
  livePSL: LocalHealthProfile;
  liveAnswers: DiagnosticAnswers;
  validatedPSL?: LocalHealthProfile;
  validatedAnswersSnapshot?: string;
  municipalityName: string;
}): string {
  const ctx = selectDocumentPreviewContext({
    validatedPSL: input.validatedPSL,
    validatedAnswersSnapshot: input.validatedAnswersSnapshot,
    livePSL: input.livePSL,
    liveAnswers: input.liveAnswers,
  });
  return renderToStaticMarkup(
    createElement(LocalHealthProfileView, {
      psl: input.livePSL, // runtime VIVO (B)
      previewPSL: ctx.previewPSL,
      isValidatedPreview: ctx.isValidatedPreview,
      pslIsStale: true,
      municipalityName: input.municipalityName,
      diagnosticAnswers: ctx.previewAnswers,
      onValidate: () => {},
      onInvalidate: () => {},
    })
  );
}

describe("CONV-A · invariante A→B en la PANTALLA (render real, paso 4)", () => {
  // A = Atarfe validado (con evidencia); B = MISMO workspace mutado a 0 átomos.
  const wsA = seed("atarfe");
  const answersA = answersOf(wsA);
  const validatedPSL_A = {
    ...createMunicipalityRuntime({ workspace: wsA }).psl,
    status: "validated" as const,
  };
  const snapshotA = serializeValidatedAnswers(answersA);
  const wsB = { ...wsA, evidenceStore: { ...wsA.evidenceStore, atoms: [] } };
  const pslB = createMunicipalityRuntime({ workspace: wsB }).psl; // 0 átomos (vivo)
  const answersB = answersOf(wsB);
  const territory = wsA.municipality.identity.name;

  it("A validado + B vivo: la pantalla muestra A, conserva el rótulo institucional y NO colapsa por isEmpty(B)", () => {
    expect(pslB.totalEvidenceAtoms).toBe(0);
    expect(validatedPSL_A.totalEvidenceAtoms).toBeGreaterThan(0);
    const html = renderScreen({
      livePSL: pslB,
      liveAnswers: answersB,
      validatedPSL: validatedPSL_A,
      validatedAnswersSnapshot: snapshotA,
      municipalityName: territory,
    });
    // Conserva el rótulo institucional (validado): NO borrador.
    expect(html).not.toContain("Borrador vivo sin validar · no institucional");
    // NO desaparece por un isEmpty de B (0 átomos): se rinde la lectura documental…
    expect(html).toContain("Lectura territorial del diagnóstico");
    expect(html).not.toContain("Sin evidencia disponible");
    // …y es la lectura de A (integrada), no la de B (que estaría vacía).
    expect(html).toContain("Cierre de la lectura");
  });

  it("contraste — NO validado con B vivo (0 átomos): la pantalla SÍ adopta B (estado vacío)", () => {
    const html = renderScreen({
      livePSL: pslB,
      liveAnswers: answersB,
      validatedPSL: undefined,
      validatedAnswersSnapshot: undefined,
      municipalityName: territory,
    });
    // Sin snapshot, la preview la gobierna B (vacío): estado vacío, no la lectura de A.
    expect(html).toContain("Sin evidencia disponible");
    expect(html).not.toContain("Cierre de la lectura");
  });

  it("contraste — NO validado con evidencia viva: rinde la lectura viva con el rótulo de borrador", () => {
    const html = renderScreen({
      livePSL: validatedPSL_A, // reutilizamos A como «vivo con evidencia», sin validar
      liveAnswers: answersA,
      validatedPSL: undefined,
      validatedAnswersSnapshot: undefined,
      municipalityName: territory,
    });
    expect(html).toContain("Borrador vivo sin validar · no institucional");
    expect(html).toContain("Lectura territorial del diagnóstico");
  });
});
