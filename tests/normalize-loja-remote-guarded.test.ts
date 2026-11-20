import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { normalizeLojaMetadataRemotely } from "../src/application/workspace/normalizeLojaMetadataRemotely";
import type { MunicipalityWorkspace } from "../src/domain/workspace";

function fixture(id: "loja" | "atarfe"): MunicipalityWorkspace {
  return JSON.parse(readFileSync(new URL(`../public/seeds/compas-ng-workspace-${id}.json`,import.meta.url),"utf8")) as MunicipalityWorkspace;
}

describe("Corrección remota de metadatos con control de revisión",()=>{
  it("guarda únicamente la clasificación y tiempos de revisión de Loja, y la relee",async()=>{
    let server=fixture("loja");
    const original=JSON.stringify(server);
    let writes=0;
    let expectedVersion="";
    const result=await normalizeLojaMetadataRemotely({
      read: async()=>server,
      save: async(updated,expected)=>{
        expectedVersion=expected;writes++;
        server=structuredClone(updated);
      },
    },structuredClone(server));
    expect(result.status).toBe("updated");
    expect(writes).toBe(1);
    expect(expectedVersion).toBe(JSON.parse(original).updatedAt);
    expect(result.workspace.repository.documents.find(d=>d.id==="doc-action-plan-loja-2022")?.kind).toBe("territorial-documentation");
    const before=JSON.parse(original) as MunicipalityWorkspace;
    const after=structuredClone(result.workspace);
    after.updatedAt=before.updatedAt;after.repository.updatedAt=before.repository.updatedAt;
    after.repository.documents.find(d=>d.id==="doc-action-plan-loja-2022")!.kind="strategic-framework";
    expect(after).toEqual(before);
  });
  it("rechaza la revisión desactualizada sin escribir",async()=>{
    const live=fixture("loja");const local=structuredClone(live);local.updatedAt="2020-01-01T00:00:00.000Z";
    let writes=0;
    await expect(normalizeLojaMetadataRemotely({
      read:async()=>live,save:async()=>{writes++;},
    },local)).rejects.toThrow("versión distinta");
    expect(writes).toBe(0);
  });
  it("no permite aplicar a Atarfe",async()=>{
    let writes=0;
    await expect(normalizeLojaMetadataRemotely({
      read:async()=>{throw new Error("No debe leer Firebase");},
      save:async()=>{writes++;},
    },fixture("atarfe"))).rejects.toThrow("sólo corresponde");
    expect(writes).toBe(0);
  });
  it("no escribe si ya está corregido",async()=>{
    const server=fixture("loja");
    server.repository.documents.find(d=>d.id==="doc-action-plan-loja-2022")!.kind="territorial-documentation";
    let writes=0;
    const result=await normalizeLojaMetadataRemotely({
      read:async()=>server,save:async()=>{writes++;},
    },structuredClone(server));
    expect(result.status).toBe("already-normalized");
    expect(writes).toBe(0);
  });
  it("detecta fallo de verificación posterior al guardado",async()=>{
    const server=fixture("loja");let writes=0;
    await expect(normalizeLojaMetadataRemotely({
      read:async()=>server,
      save:async()=>{writes++;}, // simulación de guardado que no se hace visible
    },structuredClone(server))).rejects.toThrow("no devuelve la revisión esperada");
    expect(writes).toBe(1);
  });
});
