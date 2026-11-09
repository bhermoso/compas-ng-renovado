/**
 * scripts/demo/rebuild-atarfe.gen.ts
 *
 * Generador del EXPEDIENTE CANÓNICO de Atarfe. Se ejecuta con:
 *   npm run rebuild:atarfe
 * (config dedicada vitest.rebuild.config.ts — NO forma parte de `npm test`).
 *
 * Escribe, byte a byte idénticos y en la misma ejecución:
 *   - municipalities/atarfe/exports/compas-ng-workspace-atarfe.json  (export canónico)
 *   - public/seeds/compas-ng-workspace-atarfe.json                    (seed desplegable)
 *
 * La serialización se obtiene con el servicio real saveWorkspaceToLocalStorage
 * sobre una simulación de localStorage, de modo que el fichero es byte a byte lo
 * que la aplicación escribiría. El texto se escapa a 100 % ASCII (\uXXXX) para
 * sobrevivir a cualquier canal de copia (incidente de mojibake 2026-07-07).
 */

import { describe, it, expect } from "vitest";
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Simulación de localStorage ANTES de usar la capa de persistencia real.
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

import {
  saveWorkspaceToLocalStorage,
  loadWorkspaceFromLocalStorage,
  buildWorkspaceStorageKey,
} from "../../src/infrastructure/persistence/local-storage";
import { buildAtarfeWorkspace, ATARFE_ID, ATARFE_INE } from "./buildAtarfeWorkspace";
import { toAsciiSafeJson } from "./asciiSafeJson";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const EXPORT_DIR = resolve(repoRoot, "municipalities/atarfe/exports");
const EXPORT_FILE = resolve(EXPORT_DIR, "compas-ng-workspace-atarfe.json");
const SEED_DIR = resolve(repoRoot, "public/seeds");
const SEED_FILE = resolve(SEED_DIR, "compas-ng-workspace-atarfe.json");

describe("Generador — expediente canónico de Atarfe", () => {
  it("construye, verifica y exporta el expediente (export == seed byte a byte)", async () => {
    const { workspace, counts } = await buildAtarfeWorkspace();

    // Identidad y esquema honestos.
    expect(workspace.municipality.identity.id).toBe(ATARFE_ID);
    expect(workspace.municipality.identity.ineCode).toBe(ATARFE_INE);
    expect(workspace.schemaVersion).toBe("1.0.0");
    // Recuentos deterministas: Informe (sin átomos) + IBSE (6 átomos) +
    // Localiza Salud (17 fichas) = 3 documentos y 23 evidencias.
    expect(counts.documents).toBe(3);
    expect(counts.studyAtoms).toBe(6);
    expect(counts.localizaAssets).toBe(17);
    expect(counts.totalAtoms).toBe(23);
    expect(counts.healthReportAtoms).toBe(0);

    // Guardado con el servicio real → serialización idéntica a la de la app.
    expect(saveWorkspaceToLocalStorage(workspace)).toBe(true);
    const key = buildWorkspaceStorageKey(ATARFE_ID);
    const value = store.get(key)!;

    // El valor debe recargarse con el servicio real sin pérdida.
    const reloaded = loadWorkspaceFromLocalStorage(ATARFE_ID);
    expect(reloaded).not.toBeNull();
    expect(reloaded!.evidenceStore.atoms.length).toBe(counts.totalAtoms);
    expect(reloaded!.healthReport).toBeDefined();
    expect(reloaded!.ibseStudy).toBeDefined();

    // 100 % ASCII; JSON.parse reconstruye las cadenas exactas.
    const asciiValue = toAsciiSafeJson(value);
    const allAscii = [...asciiValue].every((ch) => ch.charCodeAt(0) < 0x80);
    expect(allAscii).toBe(true);
    expect(JSON.stringify(JSON.parse(asciiValue))).toBe(JSON.stringify(JSON.parse(value)));

    // Escritura del export canónico y del seed desplegable — MISMO string.
    mkdirSync(EXPORT_DIR, { recursive: true });
    mkdirSync(SEED_DIR, { recursive: true });
    writeFileSync(EXPORT_FILE, asciiValue, "utf8");
    writeFileSync(SEED_FILE, asciiValue, "utf8");

    // Igualdad byte a byte export == seed sobre lo escrito en disco.
    const exportBytes = readFileSync(EXPORT_FILE);
    const seedBytes = readFileSync(SEED_FILE);
    expect(exportBytes.equals(seedBytes)).toBe(true);

    process.stdout.write(
      [
        "",
        "════ Expediente canónico de Atarfe generado ════",
        `Clave localStorage : ${key}`,
        `Tamaño del valor   : ${value.length} caracteres`,
        `Documentos         : ${counts.documents} (Informe + IBSE + Localiza Salud)`,
        `Estudios           : ${counts.studies} (IBSE municipal)`,
        `Activos Localiza   : ${counts.localizaAssets} (activos para la salud, +1)`,
        `Evidencias totales : ${counts.totalAtoms}`,
        `Átomos del Informe : ${counts.healthReportAtoms} (D-HR-01)`,
        `Export             : ${EXPORT_FILE}`,
        `Seed               : ${SEED_FILE}`,
        "",
      ].join("\n")
    );
  }, 180000);
});
