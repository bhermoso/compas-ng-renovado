import { importProfileFile } from '../src/application/health-profile/externalProfiles';
import { externalProfileFixture } from './helpers/externalProfileFixture';
import { beforeEach, describe, expect, it, vi } from "vitest";

// Firestore en memoria: rutas como clave. Solo las operaciones que usa RemoteWorkspace.
const store = new Map<string, Record<string, unknown>>();
let holdNextBatch: Promise<void> | undefined;
let batchWaiting = false;
let holdNextDeleteBatch: Promise<void> | undefined;
let deleteBatchWaiting = false;
const ref = (path: string[]) => ({ path: path.join("/"), __ref: true });
vi.mock("firebase/firestore", () => ({
  doc: (_db: unknown, ...path: string[]) => ref(path),
  collection: (_db: unknown, ...path: string[]) => ref(path),
  serverTimestamp: () => "ts",
  runTransaction: async (_db: unknown, callback: (tx: {
    get: (ref: { path: string }) => Promise<{ exists: () => boolean; data: () => Record<string, unknown> | undefined }>;
    set: (ref: { path: string }, value: Record<string, unknown>) => void;
  }) => Promise<void>) => {
    // Simulación sin red: el commit del manifiesto ocurre después de leerlo.
    const writes: Array<() => void> = [];
    await callback({
      get: async (r) => ({ exists: () => store.has(r.path), data: () => store.get(r.path) }),
      set: (r, value) => writes.push(() => store.set(r.path, value)),
    });
    for (const write of writes) write();
  },
  getDocFromServer: async (r: { path: string }) => ({
    exists: () => store.has(r.path),
    data: () => store.get(r.path),
  }),
  getDocs: async (r: { path: string }) => ({
    docs: [...store.entries()]
      .filter(([k]) => k.startsWith(`${r.path}/`))
      .map(([k, v]) => ({ id: k.split("/").pop(), data: () => v })),
  }),
  setDoc: async (r: { path: string }, data: Record<string, unknown>) => { store.set(r.path, data); },
  deleteDoc: async (r: { path: string }) => { store.delete(r.path); },
  writeBatch: () => {
    const ops: Array<() => void> = [];
    let payloadBytes = 0;
    let isDelete = false;
    return {
      set: (r: { path: string }, data: Record<string, unknown>) => { payloadBytes += new TextEncoder().encode(JSON.stringify(data)).length; ops.push(() => store.set(r.path, data)); },
      delete: (r: { path: string }) => { isDelete = true; ops.push(() => store.delete(r.path)); },
      commit: async () => {
        if (payloadBytes > 10 * 1024 * 1024) throw new Error("Firestore request exceeds 10 MiB");
        const gate = holdNextBatch; holdNextBatch = undefined;
        if (gate) { batchWaiting = true; await gate; }
        if (isDelete && holdNextDeleteBatch) {
          const deleteGate = holdNextDeleteBatch; holdNextDeleteBatch = undefined;
          deleteBatchWaiting = true; await deleteGate;
        }
        ops.forEach((op) => op());
      },
    };
  },
}));

let administrator = true;
vi.mock("../src/infrastructure/relas/RelasClient", () => ({
  readMembership: async () => (administrator ? "administrator" : "reader"),
  readAccessProfile: async () => ({ administrator, scopes: [] }),
}));

import {
  deleteRemoteWorkspace,
  readRemoteWorkspace,
  saveRemoteWorkspace,
  uploadLocalWorkspaces,
} from "../src/infrastructure/relas/RemoteWorkspace";
import { createMunicipalityWorkspace } from "../src/domain/workspace/MunicipalityWorkspace";
import type { RelasClient } from "../src/infrastructure/relas/RelasClient";
import type { MunicipalityWorkspace } from "../src/domain/workspace";

const client = { auth: { currentUser: { uid: "u1" } }, db: {} } as unknown as RelasClient;

function workspace(id: string, updatedAt: string): MunicipalityWorkspace {
  const base = createMunicipalityWorkspace(
    { identity: { id, name: id } } as never,
    { documents: [] } as never,
    { atoms: [] } as never
  );
  return { ...base, updatedAt };
}

describe("expediente remoto: ciclo de vida", () => {
  beforeEach(() => {
    store.clear(); administrator = true; holdNextBatch = undefined; batchWaiting = false;
    holdNextDeleteBatch = undefined; deleteBatchWaiting = false;
  });

  it("no bloquea la confirmación del perfil por la limpieza de una copia anterior", async () => {
    const first = workspace("alfacar", "2026-11-04T10:00:00.000Z");
    await saveRemoteWorkspace(client, first);
    let releaseCleanup!: () => void;
    holdNextDeleteBatch = new Promise<void>(resolve => { releaseCleanup = resolve; });
    const progress: string[] = [];
    const second = workspace("alfacar", "2026-11-04T11:00:00.000Z");
    await saveRemoteWorkspace(client, second, event => progress.push(event.phase));
    expect(progress.at(-1)).toBe("saved");
    expect(progress).toContain("confirming");
    await vi.waitFor(() => expect(deleteBatchWaiting).toBe(true));
    // The new profile is live despite the old snapshot's cleanup being held.
    expect((await readRemoteWorkspace(client, "alfacar"))?.updatedAt).toBe(second.updatedAt);
    releaseCleanup();
    await vi.waitFor(() => expect([...store.keys()].filter(k => k.includes("/chunks/"))).toHaveLength(1));
  });

  it("expone el avance por fragmentos y confirma al publicar el manifiesto", async () => {
    const w = workspace("progress", "2026-11-04T11:30:00.000Z");
    w.healthReport = { body: { originalText: "A".repeat(700000) } } as never;
    const updates: Array<{phase:string;completedChunks:number;totalChunks:number}> = [];
    await saveRemoteWorkspace(client, w, p => updates.push(p));
    const writing = updates.filter(p => p.phase === "writing");
    expect(writing.length).toBeGreaterThan(1);
    expect(writing[0].completedChunks).toBe(0);
    expect(writing.at(-1)?.completedChunks).toBe(writing.at(-1)?.totalChunks);
    expect(updates.at(-2)?.phase).toBe("confirming");
    expect(updates.at(-1)?.phase).toBe("saved");
    expect((await readRemoteWorkspace(client, "progress"))?.updatedAt).toBe(w.updatedAt);
  });

  it("tras guardar dos veces solo queda la copia vigente en Firebase", async () => {
    await saveRemoteWorkspace(client, workspace("fv", "2026-10-19T10:00:00.000Z"));
    const first = [...store.keys()].filter((k) => k.includes("/chunks/"));
    await saveRemoteWorkspace(client, workspace("fv", "2026-10-19T11:00:00.000Z"));
    await vi.waitFor(() => expect([...store.keys()].filter((k) => k.includes("/chunks/"))).toHaveLength(1));
    const second = [...store.keys()].filter((k) => k.includes("/chunks/"));
    expect(first.length).toBe(1);
    expect(second.length).toBe(1);
    expect(second[0]).not.toBe(first[0]);
    expect((await readRemoteWorkspace(client, "fv"))?.updatedAt).toBe("2026-10-19T11:00:00.000Z");
  });

  it("un guardado obsoleto no sustituye una copia remota más reciente", async () => {
    const recent = workspace("fv", "2026-11-04T14:00:00.000Z");
    await saveRemoteWorkspace(client, recent);
    await expect(saveRemoteWorkspace(client, workspace("fv", "2026-11-03T14:00:00.000Z"))).rejects.toThrow(/más reciente/);
    expect((await readRemoteWorkspace(client, "fv"))?.updatedAt).toBe(recent.updatedAt);
    expect([...store.keys()].filter(k => k.includes("/chunks/"))).toHaveLength(1);
  });

  it("una eliminación histórica no sobrescribe versiones remotas cambiadas por otro navegador", async () => {
    const first=workspace("loja", "2026-11-05T08:00:00Z");
    await saveRemoteWorkspace(client, first);
    const otherUser=workspace("loja", "2026-11-05T08:15:00Z");
    await saveRemoteWorkspace(client, otherUser);
    const destructive=workspace("loja", "2026-11-05T08:20:00Z");
    await expect(saveRemoteWorkspace(client, destructive, undefined, first.updatedAt))
      .rejects.toThrow(/revisión diferente/);
    expect((await readRemoteWorkspace(client, "loja"))?.updatedAt).toBe(otherUser.updatedAt);
    await saveRemoteWorkspace(client, destructive, undefined, otherUser.updatedAt);
    expect((await readRemoteWorkspace(client, "loja"))?.updatedAt).toBe(destructive.updatedAt);
  });

  it("eliminar retira fragmentos y manifiesto", async () => {
    await saveRemoteWorkspace(client, workspace("fv", "2026-10-19T10:00:00.000Z"));
    expect(await deleteRemoteWorkspace(client, "fv")).toEqual({ deleted: true });
    expect([...store.keys()].sort()).toEqual(["compas_deleted_scopes/fv", "relas_scopes/fv"]);
    expect(await deleteRemoteWorkspace(client, "fv")).toEqual({ deleted: false });
  });

  it("solo el administrador general elimina; sin permiso no se toca nada", async () => {
    await saveRemoteWorkspace(client, workspace("fv", "2026-10-19T10:00:00.000Z"));
    administrator = false;
    await expect(deleteRemoteWorkspace(client, "fv")).rejects.toThrow(/administrador general/);
    expect([...store.keys()].some((k) => k.startsWith("compas_deleted_scopes"))).toBe(false);
    expect(store.has("relas_scopes/fv/workspace/current")).toBe(true);
  });

  it("la subida masiva no sustituye una copia remota más reciente", async () => {
    await saveRemoteWorkspace(client, workspace("a", "2026-10-19T12:00:00.000Z"));
    const result = await uploadLocalWorkspaces(client, [
      workspace("a", "2026-10-19T09:00:00.000Z"),
      workspace("b", "2026-10-19T09:00:00.000Z"),
    ]);
    expect(result).toEqual({ a: "remoto-mas-reciente", b: "subido" });
    expect((await readRemoteWorkspace(client, "a"))?.updatedAt).toBe("2026-10-19T12:00:00.000Z");
  });
});


describe("documentos del diagnóstico compartidos", () => {
  it("otro navegador recupera los originales y las bajas del expediente", async () => {
    store.clear(); administrator = true;
    const w = workspace("alfacar", "2026-11-04T10:00:00Z");
    const { encodeDocumentOriginal, decodeDocumentOriginal } = await import("../src/application/document-files/documentOriginals");
    const original = await encodeDocumentOriginal("informe-v2", new File(["%PDF prueba"], "INFORME SALUD ALFACAR.pdf", {type:"application/pdf"}));
    w.documentOriginals = [original];
    w.deletedDocuments = [{ documentId: "informe-v1", title: "Informe anterior", deletedAt: "2026-11-04T09:00:00Z" }];
    await saveRemoteWorkspace(client, w);
    const recovered = await readRemoteWorkspace(client, "alfacar");
    expect(recovered?.documentOriginals?.[0].sha256).toBe(original.sha256);
    expect(recovered?.deletedDocuments).toEqual(w.deletedDocuments);
    expect(await (await decodeDocumentOriginal(recovered!.documentOriginals![0])).text()).toBe("%PDF prueba");
  });
});

describe('perfil externo en Firebase fragmentado', () => {
 it('recupera originales completos y revisiones en otro navegador sin caché local', async () => {
  store.clear();administrator=true;
  const w=workspace('profile-cloud','2026-10-29T09:00:00Z');
  const text='Perfil íntegro de prueba · '+ 'a'.repeat(260000);
  const {attachment}=await importProfileFile(new File([text],'perfil.txt'),'profile-cloud');
  const first={...externalProfileFixture('profile-cloud'),attachmentIds:[attachment.id]};
  const second={...first,id:'profile-test-v2',revisionOf:first.id,text:'Revisión técnica aportada'};
  w.externalProfileLibrary={profiles:[first,second],attachments:[attachment],activeId:second.id};
  await saveRemoteWorkspace(client,w);
  expect([...store.keys()].filter(k=>k.includes('/chunks/')).length).toBeGreaterThan(1);
  const recovered=await readRemoteWorkspace(client,'profile-cloud');
  expect(recovered?.externalProfileLibrary).toEqual(w.externalProfileLibrary);
  const {profileAttachmentBlob}=await import('../src/application/health-profile/externalProfiles');
  expect(await (await profileAttachmentBlob(recovered!.externalProfileLibrary!.attachments[0])).text()).toBe(text);
 });
 it('serializa guardados simultáneos para que una copia anterior lenta no sustituya la última',async()=>{
  store.clear();administrator=true;batchWaiting=false;
  let release!:()=>void;holdNextBatch=new Promise<void>(resolve=>{release=resolve;});
  const oldSave=saveRemoteWorkspace(client,workspace('queue-profile','2026-10-29T09:00:00Z'));
  await vi.waitFor(()=>expect(batchWaiting).toBe(true));
  const nextSave=saveRemoteWorkspace(client,workspace('queue-profile','2026-10-29T10:00:00Z'));
  release();await Promise.all([oldSave,nextSave]);
  expect((await readRemoteWorkspace(client,'queue-profile'))?.updatedAt).toBe('2026-10-29T10:00:00Z');
  expect([...store.keys()].filter(k=>k.includes('/chunks/'))).toHaveLength(1);
 });
});


it('guarda un original de 9 MiB en lotes que respetan el máximo de cada petición de Firebase',async()=>{
 store.clear();administrator=true;
 const w=workspace('large-profile','2026-10-29T09:00:00Z');
 const {attachment}=await importProfileFile(new File([new Uint8Array(9*1024*1024)],'original.txt'),'large-profile');
 const p={...externalProfileFixture('large-profile'),attachmentIds:[attachment.id]};
 w.externalProfileLibrary={profiles:[p],attachments:[attachment],activeId:p.id};
 await saveRemoteWorkspace(client,w);
 const recovered=await readRemoteWorkspace(client,'large-profile');
 expect(recovered?.externalProfileLibrary?.attachments[0].sha256).toBe(attachment.sha256);
 expect(recovered?.externalProfileLibrary?.attachments[0].base64).toBe(attachment.base64);
});
