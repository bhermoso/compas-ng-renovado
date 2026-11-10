import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  INCREMENTAL_SEED_MIGRATIONS,
  applySeedDocumentMigration,
  resolveSeedMigration,
} from "../src/appWorkspaceHydration";
import { parseWorkspaceJSON } from "../src/infrastructure/persistence/local-storage";
import { assetEntriesOfDocument } from "../src/application/evidence-pipeline/DocumentToEvidencePipeline";

const seed = parseWorkspaceJSON(readFileSync("public/seeds/compas-ng-workspace-atarfe.json", "utf8"))!;
const migration = INCREMENTAL_SEED_MIGRATIONS.find((m) => m.municipalityId === "atarfe")!;

/** Expediente persistido anterior a v3: IBSE con escalas de REDCap y 5 fichas de Localiza (documento y evidencias). */
function previousWorkspace() {
  const old = structuredClone(seed);
  old.appliedSeedMigrations = ["atarfe-localiza-v1", "atarfe-documentacion-canonica-v2"];
  old.ibseStudy = { ...old.ibseStudy!, aggregates: { n: 909, nValid: 811, meanTotal: 63.2, meanFactorVinculo: 54.3, meanFactorSituacion: 70.2, meanFactorControl: 63.3, meanFactorPersona: 65 } };
  const keepLocaliza = new Set([1, 2, 3, 4, 5].map((i) => `doc-localiza-atarfe-atom-${i}`));
  old.evidenceStore = {
    ...old.evidenceStore,
    atoms: old.evidenceStore.atoms
      .filter((a) => a.provenance.origin !== "localiza-salud" || keepLocaliza.has(a.id))
      .map((a) => (a.id === "ibse:atarfe:meanFactorVinculo" ? { ...a, content: "valor antiguo 54.3" } : a)),
  };
  const lines = old.repository.documents.find((d) => d.id === "doc-localiza-atarfe")!.sourceText!.split("\n").slice(0, 5).join("\n");
  old.repository = {
    ...old.repository,
    documents: old.repository.documents.map((d) => (d.id === "doc-localiza-atarfe" ? { ...d, sourceText: lines } : d)),
  };
  old.updatedAt = "2026-11-10T04:00:00.000Z";
  return old;
}

describe("Atarfe · migración v4 (IBSE por ítems y 20 recursos de Localiza Salud)", () => {
  it("un expediente con la marca v2 o v3 recibe la migración v4", () => {
    expect(migration.marker).toBe("atarfe-documentacion-canonica-v5");
    const v3 = previousWorkspace();
    v3.appliedSeedMigrations = ["atarfe-localiza-v1", "atarfe-documentacion-canonica-v3"];
    expect(resolveSeedMigration(v3).kind).toBe("download-and-merge");
    expect(resolveSeedMigration(previousWorkspace()).kind).toBe("download-and-merge");
  });

  it("sustituye el IBSE canónico y añade las fichas que faltan sin perder nada", () => {
    const migrated = applySeedDocumentMigration(previousWorkspace(), seed, migration);
    expect(migrated.ibseStudy!.aggregates).toEqual(seed.ibseStudy!.aggregates);
    expect(migrated.evidenceStore.atoms).toHaveLength(26);
    const vinculo = migrated.evidenceStore.atoms.find((a) => a.id === "ibse:atarfe:meanFactorVinculo")!;
    expect(vinculo.content).not.toContain("valor antiguo");
    expect(migrated.appliedSeedMigrations).toContain("atarfe-documentacion-canonica-v5");
  });

  it("no toca un IBSE importado por la persona usuaria", () => {
    const own = previousWorkspace();
    own.ibseStudy = { ...own.ibseStudy!, id: "ibse-importado-por-usuario" };
    const migrated = applySeedDocumentMigration(own, seed, migration);
    expect(migrated.ibseStudy!.id).toBe("ibse-importado-por-usuario");
    expect(migrated.ibseStudy!.aggregates.meanFactorVinculo).toBe(54.3);
  });

  it("actualiza el documento de Localiza Salud, del que sale el recuento de activos", () => {
    const migrated = applySeedDocumentMigration(previousWorkspace(), seed, migration);
    const doc = migrated.repository.documents.find((d) => d.id === "doc-localiza-atarfe")!;
    expect(assetEntriesOfDocument(doc)).toHaveLength(20);
  });

  it("no actualiza el documento si la persona usuaria le añadió líneas propias", () => {
    const own = previousWorkspace();
    own.repository = { ...own.repository, documents: own.repository.documents.map((d) => d.id === "doc-localiza-atarfe" ? { ...d, sourceText: d.sourceText + "\nRecurso propio | añadido a mano | | | | Granada | Atarfe | |" } : d) };
    const migrated = applySeedDocumentMigration(own, seed, migration);
    const doc = migrated.repository.documents.find((d) => d.id === "doc-localiza-atarfe")!;
    expect(doc.sourceText).toContain("Recurso propio");
    expect(assetEntriesOfDocument(doc)).toHaveLength(6);
  });

  it("no retrocede la fecha del expediente y admite una fecha explícita", () => {
    const old = previousWorkspace();
    expect(applySeedDocumentMigration(old, seed, migration).updatedAt).toBe(old.updatedAt);
    const stamp = "2026-11-10T06:00:00.000Z";
    expect(applySeedDocumentMigration(previousWorkspace(), seed, migration, { stamp }).updatedAt).toBe(stamp);
  });
});
