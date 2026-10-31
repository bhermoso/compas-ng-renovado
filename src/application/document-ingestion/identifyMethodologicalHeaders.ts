import { getAllMethodologicalModules } from "../../domain/methodology";

/** Solo coteja cabeceras con adaptadores declarativos existentes; no procesa respuestas. */
export interface MethodologicalMatch {
  moduleId: string;
  label: string;
  matched: number;
  expected: number;
  confidence: "strong" | "partial";
  adapter: "redcap" | "sav";
}

export function identifyMethodologicalHeaders(headerLine: string): MethodologicalMatch[] {
  const separator = headerLine.includes("\t") ? "\t" : headerLine.includes(";") ? ";" : ",";
  // Cabeceras sencillas: los CSV completos siguen siendo responsabilidad del parser canónico.
  const columns = new Set(headerLine.replace(/^\uFEFF/, "").split(separator).map(v => v.trim().replace(/^"|"$/g, "").toLowerCase()));
  const matches: MethodologicalMatch[] = [];
  for (const module of getAllMethodologicalModules()) {
    const adapters: Array<{ type: "redcap" | "sav"; fields: string[] }> = [];
    if (module.adapters?.redcap) {
      const a = module.adapters.redcap;
      adapters.push({ type:"redcap", fields:[...a.columns.map(c=>c.redcapColumn), a.completedColumn] });
    }
    if (module.adapters?.sav) adapters.push({ type:"sav", fields:module.adapters.sav.variables.map(v=>v.savVariable) });
    for (const a of adapters) {
      const expected = [...new Set(a.fields.filter(Boolean).map(s=>s.toLowerCase()))];
      const matched = expected.filter(s=>columns.has(s)).length;
      if (expected.length < 2 || matched < 2) continue;
      const ratio = matched / expected.length;
      if (ratio < 0.65) continue;
      matches.push({moduleId:module.identity.id,label:module.identity.shortName,matched,expected:expected.length,confidence:ratio===1?"strong":"partial",adapter:a.type});
    }
  }
  return matches.sort((a,b)=>b.matched/b.expected-a.matched/a.expected || b.matched-a.matched);
}
