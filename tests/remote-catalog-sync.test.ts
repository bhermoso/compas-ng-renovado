import { describe, expect, it } from "vitest";
import {
  syncRemoteCatalog,
  type CatalogSyncPorts,
} from "../src/application/remote-catalog/syncRemoteCatalog";
import type { MunicipalityWorkspace } from "../src/domain/workspace";

const ws = (id: string, empty = false) =>
  ({ municipality: { identity: { id } }, empty }) as unknown as MunicipalityWorkspace;

function ports(over: {
  scopes?: string[];
  tombstones?: string[];
  remoteWorkspaces?: string[];
  local?: MunicipalityWorkspace[];
  catalog?: string[];
}) {
  const calls = { discarded: [] as string[], uploaded: [] as string[] };
  const remote = new Set(over.remoteWorkspaces ?? []);
  const p: CatalogSyncPorts = {
    listScopes: async () => (over.scopes ?? []).map((id) => ({ id, name: id, type: "municipio" })),
    listTombstones: async () => new Set(over.tombstones ?? []),
    hasRemoteWorkspace: async (id) => remote.has(id),
    readRemoteContext: async (id) => ({ id, name: id, province: "Granada" }),
    uploadWorkspace: async (w) => { calls.uploaded.push(w.municipality.identity.id); },
    localWorkspaces: async () => over.local ?? [],
    localCatalogIds: () => new Set(over.catalog ?? []),
    isEmptyWorkspace: (w) => (w as unknown as { empty: boolean }).empty,
    discardLocal: async (id) => { calls.discarded.push(id); },
  };
  return { p, calls };
}

describe("sincronización del catálogo con Firebase", () => {
  it("descarta el expediente local eliminado en otro equipo y no lo repone", async () => {
    const { p, calls } = ports({
      tombstones: ["fv"], local: [ws("fv")], catalog: ["fv"], remoteWorkspaces: [],
    });
    const r = await syncRemoteCatalog(p);
    expect(r.discarded).toEqual(["fv"]);
    expect(calls.uploaded).toEqual([]);
  });

  it("incorpora el expediente que solo existe en Firebase", async () => {
    const { p } = ports({ scopes: ["fv"], remoteWorkspaces: ["fv"] });
    const r = await syncRemoteCatalog(p);
    expect(r.adopted.map((m) => m.id)).toEqual(["fv"]);
  });

  it("no incorpora un ámbito sin expediente remoto ni con lápida", async () => {
    const { p } = ports({
      scopes: ["vacio", "borrado"], tombstones: ["borrado"], remoteWorkspaces: ["borrado"],
    });
    expect((await syncRemoteCatalog(p)).adopted).toEqual([]);
  });

  it("sube el expediente local con contenido que Firebase no tiene y omite el vacío", async () => {
    const { p, calls } = ports({
      local: [ws("fv"), ws("vacio", true), ws("ya")], remoteWorkspaces: ["ya"],
      catalog: ["fv", "vacio", "ya"],
    });
    const r = await syncRemoteCatalog(p);
    expect(calls.uploaded).toEqual(["fv"]);
    expect(r.uploaded).toEqual(["fv"]);
  });

  it("un fallo en un expediente no impide procesar los demás", async () => {
    const { p } = ports({ local: [ws("a"), ws("b")], catalog: ["a", "b"] });
    p.uploadWorkspace = async (w) => {
      if (w.municipality.identity.id === "a") throw new Error("sin permiso");
    };
    const r = await syncRemoteCatalog(p);
    expect(r.errors).toEqual([{ id: "a", message: "sin permiso" }]);
    expect(r.uploaded).toEqual(["b"]);
  });
});
