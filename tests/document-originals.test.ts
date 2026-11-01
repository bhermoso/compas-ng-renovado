import { describe, it, expect } from "vitest";
import {
  MAX_ORIGINAL_FILE_BYTES, MAX_WORKSPACE_ORIGINALS_BYTES, decideOriginalUpload, decodeDocumentOriginal,
  documentOriginalsBytes, encodeDocumentOriginal, mergeDocumentOriginals, profileOriginalsBytes, pruneDocumentOriginals,
} from "../src/application/document-files/documentOriginals";
import { isEmptyWorkspaceForPersistenceGuard } from "../src/application/workspace/isEmptyWorkspaceForPersistenceGuard";
import { createCompleteMunicipalityWorkspace } from "../src/application/workspace";

const file = (text: string, name = "acta.pdf") => new File([new TextEncoder().encode(text)], name, { type: "application/pdf" });

describe("originales del Diagnóstico en el expediente", () => {
  it("codifica y recupera el archivo exacto, con huella", async () => {
    const o = await encodeDocumentOriginal("doc-1", file("%PDF-1.7 contenido"));
    expect(o).toMatchObject({ id: "doc-1", documentId: "doc-1", name: "acta.pdf", mimeType: "application/pdf", size: 18 });
    expect(o.sha256).toMatch(/^[a-f0-9]{64}$/);
    const back = await decodeDocumentOriginal(o);
    expect(new TextDecoder().decode(await back.arrayBuffer())).toBe("%PDF-1.7 contenido");
    expect(back.name).toBe("acta.pdf");
  });
  it("rechaza un original alterado", async () => {
    const o = await encodeDocumentOriginal("doc-1", file("original"));
    await expect(decodeDocumentOriginal({ ...o, base64: btoa("alterad") + "=" .repeat(0) })).rejects.toThrow();
  });
  it("respeta el límite por archivo y el común con el Perfil", () => {
    expect(decideOriginalUpload(MAX_ORIGINAL_FILE_BYTES + 1, 0)).toBe("too-large");
    expect(decideOriginalUpload(10, MAX_WORKSPACE_ORIGINALS_BYTES - 5)).toBe("over-budget");
    expect(decideOriginalUpload(10, 0)).toBe("fits");
    expect(profileOriginalsBytes({ profiles: [], attachments: [{ id: "a", name: "", mimeType: "", size: 7, sha256: "", base64: "" }] })).toBe(7);
  });
  it("poda originales de documentos eliminados y no duplica al fusionar", async () => {
    const a = await encodeDocumentOriginal("a", file("a"));
    const b = await encodeDocumentOriginal("b", file("b"));
    const docs = [{ id: "a" }] as never;
    expect(pruneDocumentOriginals([a, b], docs).map(o => o.documentId)).toEqual(["a"]);
    const a2 = await encodeDocumentOriginal("a", file("a2"));
    const merged = mergeDocumentOriginals([a, b], [a2]);
    expect(merged.map(o => o.documentId)).toEqual(["b", "a"]);
    expect(documentOriginalsBytes(merged)).toBe(3);
  });
  it("un expediente con originales no se considera vacío", async () => {
    const ws = createCompleteMunicipalityWorkspace({ id: "zagra", name: "Zagra" });
    expect(isEmptyWorkspaceForPersistenceGuard(ws)).toBe(true);
    ws.documentOriginals = [await encodeDocumentOriginal("a", file("a"))];
    expect(isEmptyWorkspaceForPersistenceGuard(ws)).toBe(false);
  });
});

import { serializeWorkspaceForLocalStorage, serializeWorkspaceForStorage } from "../src/infrastructure/persistence/local-storage/LocalStorageWorkspacePersistence";
describe("copia ligera de localStorage", () => {
  it("no incluye los originales del Diagnóstico, que viajan en IndexedDB y Firebase", async () => {
    const ws = createCompleteMunicipalityWorkspace({ id: "zagra", name: "Zagra" });
    ws.documentOriginals = [await encodeDocumentOriginal("a", file("contenido"))];
    const parsed = JSON.parse(serializeWorkspaceForLocalStorage(ws));
    expect(parsed.documentOriginals).toBeUndefined();
    // La copia ampliada (IndexedDB) sí los conserva.
    expect(JSON.parse(serializeWorkspaceForStorage(ws)).documentOriginals).toHaveLength(1);
    expect(ws.documentOriginals).toHaveLength(1);
  });
});

import { shouldRestoreIndexedDbWorkspace, withCarriedDocumentOriginals } from "../src/appWorkspaceHydration";
import { addMunicipalDocument } from "../src/domain/repository";
describe("hidratación sin perder originales", () => {
  const base = async () => {
    const ws = createCompleteMunicipalityWorkspace({ id: "zagra", name: "Zagra" });
    ws.repository = addMunicipalDocument(ws.repository, { id: "a", kind: "territorial-documentation", title: "Acta", tags: [] });
    ws.updatedAt = "2026-11-01T10:00:00.000Z";
    return ws;
  };
  it("a igualdad de fecha prevalece la copia con originales", async () => {
    const light = await base();
    const full = { ...(await base()), documentOriginals: [await encodeDocumentOriginal("a", file("x"))] };
    expect(shouldRestoreIndexedDbWorkspace(light, full)).toBe(true);
    expect(shouldRestoreIndexedDbWorkspace(full, light)).toBe(false);
  });
  it("la copia que se conserva recibe los originales de la descartada, solo para sus documentos", async () => {
    const current = { ...(await base()), updatedAt: "2026-11-01T11:00:00.000Z" };
    const other = { ...(await base()), documentOriginals: [await encodeDocumentOriginal("a", file("x")), await encodeDocumentOriginal("ajeno", file("y"))] };
    const merged = withCarriedDocumentOriginals(current, other);
    expect(merged.documentOriginals?.map(o => o.documentId)).toEqual(["a"]);
    expect(withCarriedDocumentOriginals(merged, other)).toBe(merged);
    expect(withCarriedDocumentOriginals(current, null)).toBe(current);
  });
});
