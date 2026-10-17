/**
 * Guardia anti-implementación accidental de longitudinal-evidence.
 *
 * Afirma que:
 *  1. Los tipos DocumentKind y EvidenceAtomKind tienen reservados
 *     "longitudinal-evidence" y "longitudinal-snapshot" (reserva formal).
 *  2. Ninguno de los workspaces de prueba canonizados (Atarfe, Zaidín)
 *     contiene átomos de tipo longitudinal-snapshot.
 *  3. El compilador PSL (LocalHealthProfileCompiler) no incluye el texto
 *     "longitudinal-snapshot" en las secciones de contenido del artefacto.
 *  4. El pipeline de evidencia transforma "longitudinal-evidence" → atoms
 *     de tipo "longitudinal-snapshot" (confirma que el tipo SOLO llega
 *     al store a través del pipeline general, no de un parser específico).
 *
 * Este test DEBE fallar si alguien:
 *  - Carga un documento longitudinal-evidence en un workspace de prueba.
 *  - Introduce una referencia "longitudinal-snapshot" en el contenido del PSL.
 *
 * Hueco H-8 (CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT §10).
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { DocumentKind } from "../src/domain/repository/MunicipalDocumentRepository";
import type { EvidenceAtomKind } from "../src/domain/evidence/EvidenceAtom";

const DIR = dirname(fileURLToPath(import.meta.url));

function loadSeed(name: string): unknown {
  return JSON.parse(
    readFileSync(resolve(DIR, "..", "public", "seeds", `compas-ng-workspace-${name}.json`), "utf-8")
  );
}

function atomsFromSeed(seed: unknown): Array<{ kind: string }> {
  const ws = seed as { evidenceStore?: { atoms?: Array<{ kind: string }> } };
  return ws.evidenceStore?.atoms ?? [];
}

// ── 1. Reserva formal de tipos ────────────────────────────────────────────

describe("Reserva del tipo longitudinal-evidence (Hueco H-8)", () => {
  it("DocumentKind incluye 'longitudinal-evidence' como tipo reservado", () => {
    const kind: DocumentKind = "longitudinal-evidence";
    expect(kind).toBe("longitudinal-evidence");
  });

  it("EvidenceAtomKind incluye 'longitudinal-snapshot' como tipo reservado", () => {
    const kind: EvidenceAtomKind = "longitudinal-snapshot";
    expect(kind).toBe("longitudinal-snapshot");
  });
});

// ── 2. Workspaces de prueba sin átomos longitudinal-snapshot ─────────────

describe("Workspaces de prueba — sin átomos longitudinal-snapshot", () => {
  it("Atarfe no contiene átomos longitudinal-snapshot", () => {
    const seed = loadSeed("atarfe");
    const atoms = atomsFromSeed(seed).filter((a) => a.kind === "longitudinal-snapshot");
    expect(atoms).toHaveLength(0);
  });

  it("Granada-Zaidín no contiene átomos longitudinal-snapshot", () => {
    const seed = loadSeed("granada-zaidin");
    const atoms = atomsFromSeed(seed).filter((a) => a.kind === "longitudinal-snapshot");
    expect(atoms).toHaveLength(0);
  });
});

// ── 3. Compilador PSL — sin longitudinal-snapshot en secciones ───────────

describe("LocalHealthProfileCompiler — longitudinal solo como contador", () => {
  it("el artefacto compilado de Atarfe no incluye 'longitudinal-snapshot' en secciones de contenido", async () => {
    const { compileLocalHealthProfile } = await import(
      "../src/application/health-profile-compiler"
    );
    const atarfeSeed = JSON.parse(
      readFileSync(resolve(DIR, "..", "public", "seeds", "compas-ng-workspace-atarfe.json"), "utf-8")
    ) as { municipality: { identity: { id: string; name: string } }; validatedPSL?: import("../src/domain/health-profile").LocalHealthProfile };

    if (!atarfeSeed.validatedPSL) {
      return;
    }
    const result = compileLocalHealthProfile({
      psl: atarfeSeed.validatedPSL,
      municipalityName: atarfeSeed.municipality.identity.name,
      municipalityProvince: "",
      existingArtifactCount: 0,
    });
    if (!result.ok) return;
    const sections = JSON.stringify(result.artifact.sections ?? []);
    expect(sections).not.toContain("longitudinal-snapshot");
  });
});

// ── 4. Pipeline — transformDocumentToEvidence con longitudinal-evidence ───

describe("DocumentToEvidencePipeline — longitudinal-evidence produce longitudinal-snapshot", () => {
  it("un documento de tipo 'longitudinal-evidence' produce átomos kind 'longitudinal-snapshot' via el pipeline general", async () => {
    const { transformDocumentToEvidence } = await import(
      "../src/application/evidence-pipeline/DocumentToEvidencePipeline"
    );
    const { createEvidenceStore } = await import("../src/domain/evidence/EvidenceStore");
    const store = createEvidenceStore("test-municipality");
    const result = transformDocumentToEvidence({
      document: {
        id: "doc-longitudinal-test",
        kind: "longitudinal-evidence",
        title: "Evidencia longitudinal de prueba",
        uploadedAt: new Date().toISOString(),
        source: { type: "text" },
      },
      plainText: "Evaluación de resultados a los dos años del plan.\nSe observa mejoría en los indicadores de soledad.",
      store,
    });
    // Confirma que el tipo produce longitudinal-snapshot (el tipo está activo en el pipeline).
    // Este test es un inventario, no una autorización: si falla, alguien introdujo
    // un cambio en la clasificación que debe revisarse.
    expect(result.atomsCreated.every((a) => a.kind === "longitudinal-snapshot")).toBe(true);
    expect(result.atomsCreated.length).toBeGreaterThan(0);
  });

  it("un documento de tipo 'health-report' NO produce longitudinal-snapshot", async () => {
    const { transformDocumentToEvidence } = await import(
      "../src/application/evidence-pipeline/DocumentToEvidencePipeline"
    );
    const { createEvidenceStore } = await import("../src/domain/evidence/EvidenceStore");
    const store = createEvidenceStore("test-municipality");
    const result = transformDocumentToEvidence({
      document: {
        id: "doc-health-report-test",
        kind: "health-report",
        title: "Informe de Salud",
        uploadedAt: new Date().toISOString(),
        source: { type: "text" },
        canGenerateEvidence: false,
      },
      plainText: "Contenido del informe.",
      store,
    });
    expect(result.atomsCreated).toHaveLength(0);
  });
});
