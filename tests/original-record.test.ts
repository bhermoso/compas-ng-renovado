import { describe, expect, it } from "vitest";
import { buildOriginalRecord, compareIndexedOriginal, storagePathForOriginal } from "../src/domain/repository/OriginalRecord";
const hash="a".repeat(64);
const make=()=>buildOriginalRecord({municipalityId:"zagra",sha256:hash,byteLength:100,fileName:"informe.pdf",contentType:"application/pdf",createdAt:"2026-10-31T10:00:00Z",createdBy:"tecnico"});
describe("registro original inmutable",()=>{
 it("separa originales por ámbito y contenido",()=>{expect(storagePathForOriginal("zagra",hash)).toBe("relas_scopes/zagra/originals/"+hash);expect(storagePathForOriginal("loja",hash)).not.toBe(storagePathForOriginal("zagra",hash));});
 it("rechaza identificadores manipulados",()=>{expect(()=>storagePathForOriginal("../loja",hash)).toThrow();expect(()=>storagePathForOriginal("zagra","123")).toThrow();});
 it("no confunde un registro sin índice con un duplicado",()=>{expect(compareIndexedOriginal(make(),undefined)).toBe("not-indexed");expect(compareIndexedOriginal(make(),make())).toBe("exact");});
 it("no confirma coincidencias con metadatos distintos",()=>{expect(compareIndexedOriginal(make(),{...make(),byteLength:101})).toBe("unverified");});
 it("limita tamaño y requiere procedencia",()=>{expect(()=>buildOriginalRecord({...make(),byteLength:-1})).toThrow();expect(()=>buildOriginalRecord({...make(),createdBy:""})).toThrow();});
});