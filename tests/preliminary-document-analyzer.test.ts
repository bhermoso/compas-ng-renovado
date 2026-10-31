import { describe, expect, it } from "vitest";
import { analyzeDocument } from "../src/application/document-ingestion/preliminaryDocumentAnalyzer";

function file(bytes: Uint8Array, name: string): File {
  return {name, size: bytes.byteLength, arrayBuffer: async () => bytes.slice().buffer} as File;
}
const encode = (s: string) => new TextEncoder().encode(s);
describe("analizador preliminar sin efectos sobre el expediente", () => {
  it("reconoce PDF por firma sin clasificar su naturaleza", async () => {
    const result = await analyzeDocument(file(encode("%PDF-1.7\n"),"informe.pdf"));
    expect(result.format).toBe("pdf");
    expect(result.proposedKind).toBe("undetermined");
    expect(result.fingerprint).toHaveLength(64);
  });
  it("no confunde cualquier CSV con REDCap", async () => {
    const result = await analyzeDocument(file(encode("nombre,edad\nAna,45\n"),"datos.csv"));
    expect(result.format).toBe("csv");
    expect(result.proposedKind).toBe("undetermined");
  });
  it("propone REDCap únicamente ante cabecera conocida", async () => {
    const result = await analyzeDocument(file(encode("record_id,temas___1,temas___2\n1,1,0\n"),"datos.csv"));
    expect(result.proposedKind).toBe("redcap-export");
  });
  it("advierte extensión incompatible con firma", async () => {
    const result = await analyzeDocument(file(encode("%PDF-1.7\n"),"datos.csv"));
    expect(result.warnings.some(s=>s.includes("extensión"))).toBe(true);
  });
  it("rechaza archivos mayores al límite antes de leerlos", async () => {
    const huge = {name:"huge.pdf",size:41*1024*1024,arrayBuffer: async()=>{throw new Error("should not read");}} as File;
    await expect(analyzeDocument(huge)).rejects.toThrow("40 MiB");
  });
  it("rechaza ZIP sin directorio central y no descomprime", async () => {
    await expect(analyzeDocument(file(new Uint8Array([0x50,0x4b,0x03,0x04]),"doc.zip"))).rejects.toThrow("directorio central");
  });
});
