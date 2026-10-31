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

function minimalZip(path: string, size = 4, compressedSize = 4): Uint8Array {
  const name = encode(path), localLength = 30 + name.length + compressedSize;
  const centralOffset = localLength, centralLength = 46 + name.length;
  const b = new Uint8Array(localLength + centralLength + 22);
  const v = new DataView(b.buffer);
  v.setUint32(0,0x04034b50,true);
  v.setUint16(8,0,true);
  v.setUint32(18,0,true);
  v.setUint32(22,size,true);
  v.setUint16(26,name.length,true);
  b.set(name,30);
  v.setUint32(centralOffset,0x02014b50,true);
  v.setUint16(centralOffset+10,0,true);
  v.setUint32(centralOffset+20,compressedSize,true);
  v.setUint32(centralOffset+24,size,true);
  v.setUint16(centralOffset+28,name.length,true);
  v.setUint32(centralOffset+42,0,true);
  b.set(name,centralOffset+46);
  const eocd=centralOffset+centralLength;
  v.setUint32(eocd,0x06054b50,true);
  v.setUint16(eocd+8,1,true);v.setUint16(eocd+10,1,true);
  v.setUint32(eocd+12,centralLength,true);
  v.setUint32(eocd+16,centralOffset,true);
  return b;
}

describe("inspección defensiva del directorio ZIP", () => {
  it("enumera la entrada sin extraerla ni asignar automáticamente un destino", async () => {
    const result=await analyzeDocument(file(minimalZip("estudios/duke.csv"),"fuentes.zip"));
    expect(result.format).toBe("zip");
    expect(result.archiveEntries?.[0].format).toBe("csv");
    expect(result.archiveEntries?.[0].suggestedKind).toBe("undetermined");
  });
  it("señala rutas de traversal",async () => {
    const result=await analyzeDocument(file(minimalZip("../otro-municipio.csv"),"datos.zip"));
    expect(result.archiveEntries?.[0].unsafe).toBe(true);
    expect(result.warnings.some(x=>x.includes("bloqueada"))).toBe(true);
  });
  it("señala ratios de compresión sospechosos",async () => {
    const result=await analyzeDocument(file(minimalZip("datos.csv",100000,4),"datos.zip"));
    expect(result.warnings.some(x=>x.includes("Compresión"))).toBe(true);
  });
  it("rechaza referencias a cabeceras locales inexistentes",async () => {
    const data=minimalZip("datos.csv");
    const view=new DataView(data.buffer);
    const centralOffset=30+encode("datos.csv").length+4;
    view.setUint32(centralOffset+42,9999,true);
    await expect(analyzeDocument(file(data,"datos.zip"))).rejects.toThrow("Cabecera local");
  });
  it("no identifica un cuestionario concreto por los nombres de ficheros",async () => {
    const result=await analyzeDocument(file(minimalZip("DUKE_EAS.csv"),"datos.zip"));
    expect(result.proposedKind).toBe("undetermined");
  });
});
