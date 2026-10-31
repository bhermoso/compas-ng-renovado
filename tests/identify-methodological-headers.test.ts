import { describe, expect, it } from "vitest";
import { identifyMethodologicalHeaders } from "../src/application/document-ingestion/identifyMethodologicalHeaders";
import { getMethodologicalModule } from "../src/domain/methodology";

describe("identificación de esquemas metodológicos canónicos", () => {
  it("identifica columnas reales de DUKE en el adaptador SAV", () => {
    const m=getMethodologicalModule("duke-eas");
    expect(m?.adapters?.sav).toBeDefined();
    const header=m!.adapters!.sav!.variables.map(v=>v.savVariable).join(",");
    const matches=identifyMethodologicalHeaders(header);
    expect(matches.some(x=>x.moduleId==="duke-eas" && x.adapter==="sav" && x.confidence==="strong")).toBe(true);
  });
  it("identifica REDCap IBSE a partir de su adaptador", () => {
    const m=getMethodologicalModule("ibse");
    expect(m?.adapters?.redcap).toBeDefined();
    const a=m!.adapters!.redcap!;
    const header=[...a.columns.map(x=>x.redcapColumn),a.completedColumn].join(",");
    expect(identifyMethodologicalHeaders(header).some(x=>x.moduleId==="ibse" && x.adapter==="redcap")).toBe(true);
  });
  it("no identifica instrumentos a partir de nombres de fichero ni datos genéricos", () => {
    expect(identifyMethodologicalHeaders("nombre,edad,municipio")).toEqual([]);
  });
});
