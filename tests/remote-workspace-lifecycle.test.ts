import { importProfileFile } from '../src/application/health-profile/externalProfiles';
import { externalProfileFixture } from './helpers/externalProfileFixture';
import { beforeEach, describe, expect, it, vi } from "vitest";

// Firestore en memoria: rutas como clave. Solo las operaciones que usa RemoteWorkspace.
const store = new Map<string, Record<string, unknown>>();
let holdNextBatch: Promise<void> | undefined;
let batchWaiting = false;
const ref = (path: string[]) => ({ path: path.join("/"), __ref: true });
vi.mock("firebase/firestore", () => ({
  doc: (_db: unknown, ...path: string[]) => ref(path),
  collection: (_db: unknown, ...path: string[]) => ref(path),
  serverTimestamp: () => "ts",
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
    return {
      set: (r: { path: string }, data: Record<string, unknown>) => ops.push(() => store.set(r.path, data)),
      delete: (r: { path: string }) => ops.push(() => store.delete(r.path)),
      commit: async () => { const gate = holdNextBatch; holdNextBatch = undefined; if (gate) { batchWaiting = true; await gate; } ops.forEach((op) => op()); },
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
  beforeEach(() => { store.clear(); administrator = true; holdNextBatch = undefined; batchWaiting = false; });

  it("tras guardar dos veces solo queda la copia vigente en Firebase", async () => {
    await saveRemoteWorkspace(client, workspace("fv", "2026-10-19T10:00:00.000Z"));
    const first = [...store.keys()].filter((k) => k.includes("/chunks/"));
    await saveRemoteWorkspace(client, workspace("fv", "2026-10-19T11:00:00.000Z"));
    const second = [...store.keys()].filter((k) => k.includes("/chunks/"));
    expect(first.length).toBe(1);
    expect(second.length).toBe(1);
    expect(second[0]).not.toBe(first[0]);
    expect((await readRemoteWorkspace(client, "fv"))?.updatedAt).toBe("2026-10-19T11:00:00.000Z");
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
