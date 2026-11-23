/**
 * Carga del expediente en el navegador sin seeds (retirados el 23/11/2026).
 * Un expediente local válido se usa tal cual; sin entrada local se crea un
 * placeholder vacío; una entrada ilegible se protege. Firebase decide después.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  loadOrCreateMunicipalityWorkspace,
  shouldRestoreIndexedDbWorkspace,
  shouldSkipPersistence,
} from "../src/appWorkspaceHydration";
import { saveWorkspaceToLocalStorage } from "../src/infrastructure/persistence/local-storage";
import { createCompleteMunicipalityWorkspace, isEmptyWorkspaceForPersistenceGuard } from "../src/application/workspace";
import type { MunicipalityWorkspace } from "../src/domain/workspace";

const store = new Map<string, string>();
(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => { store.set(k, v); },
  removeItem: (k: string) => { store.delete(k); },
  clear: () => store.clear(),
  key: (i: number) => [...store.keys()][i] ?? null,
  get length() { return store.size; },
};

const ATARFE_RAW = readFileSync(new URL("../fixtures/seeds/compas-ng-workspace-atarfe.json", import.meta.url), "utf8");
const ATARFE_INPUT = { id: "atarfe", name: "Atarfe", province: "Granada", ineCode: "18022", createdBy: "test" };

beforeEach(() => store.clear());

describe("carga local del expediente", () => {
  it("sin entrada local crea un placeholder vacío que se puede guardar", () => {
    const result = loadOrCreateMunicipalityWorkspace("atarfe", ATARFE_INPUT);
    expect(isEmptyWorkspaceForPersistenceGuard(result.workspace)).toBe(true);
    expect(result.protectExistingStorage).toBe(false);
    expect(shouldSkipPersistence({ workspaceMunicipalityId: "atarfe", protectedEmptyWorkspaceId: null, isEmpty: true })).toBe(false);
  });

  it("un expediente local válido se usa tal cual", () => {
    const local = JSON.parse(ATARFE_RAW) as MunicipalityWorkspace;
    expect(saveWorkspaceToLocalStorage(local)).toBe(true);
    const result = loadOrCreateMunicipalityWorkspace("atarfe", ATARFE_INPUT);
    expect(result.workspace.repository.documents).toHaveLength(local.repository.documents.length);
    expect(result.protectExistingStorage).toBe(false);
  });

  it("una entrada local ilegible se protege: el placeholder no la pisa", () => {
    store.set("compas-ng:workspace:atarfe", "{no es json");
    const result = loadOrCreateMunicipalityWorkspace("atarfe", ATARFE_INPUT);
    expect(result.protectExistingStorage).toBe(true);
    expect(shouldSkipPersistence({ workspaceMunicipalityId: "atarfe", protectedEmptyWorkspaceId: "atarfe", isEmpty: true })).toBe(true);
  });
});

describe("recuperación desde almacenamiento ampliado", () => {
  it("recupera IndexedDB si es más reciente", () => {
    const current = JSON.parse(ATARFE_RAW) as MunicipalityWorkspace;
    const stored = structuredClone(current);
    current.updatedAt = "2026-09-01T00:00:00.000Z";
    stored.updatedAt = "2026-10-05T09:00:00.000Z";
    expect(shouldRestoreIndexedDbWorkspace(current, stored)).toBe(true);
  });

  it("una copia vacía más reciente no sustituye contenido real", () => {
    const current = JSON.parse(ATARFE_RAW) as MunicipalityWorkspace;
    const stored = createCompleteMunicipalityWorkspace(ATARFE_INPUT);
    current.updatedAt = "2026-10-05T09:00:00.000Z";
    stored.updatedAt = "2026-10-08T10:00:00.000Z";
    expect(shouldRestoreIndexedDbWorkspace(current, stored)).toBe(false);
  });

  it("no sustituye una copia local más reciente ni mezcla municipios", () => {
    const current = JSON.parse(ATARFE_RAW) as MunicipalityWorkspace;
    const stored = structuredClone(current);
    current.updatedAt = "2026-10-05T10:00:00.000Z";
    stored.updatedAt = "2026-10-05T09:00:00.000Z";
    expect(shouldRestoreIndexedDbWorkspace(current, stored)).toBe(false);
    stored.municipality.identity.id = "otro-municipio";
    stored.updatedAt = "2026-10-05T11:00:00.000Z";
    expect(shouldRestoreIndexedDbWorkspace(current, stored)).toBe(false);
  });
});
