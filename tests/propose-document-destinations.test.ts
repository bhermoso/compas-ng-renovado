import { describe, expect, it } from "vitest";
import { proposeDocumentDestinations } from "../src/application/document-ingestion/proposeDocumentDestinations";
import type { PreliminaryAnalysis } from "../src/application/document-ingestion/preliminaryDocumentAnalyzer";

const analysis=(format:PreliminaryAnalysis["format"]):PreliminaryAnalysis=>({format, proposedKind:"undetermined",reasons:[],warnings:[]});
describe("propuestas conservadoras de destino",()=>{
 it("no distribuye ZIP automáticamente",()=>expect(proposeDocumentDestinations(analysis("zip"),"undetermined")[0].target).toBe("manual-review"));
 it("propone el importador de informes solo con clasificación humana y formato admisible",()=>expect(proposeDocumentDestinations(analysis("pdf"),"health-report")[0].target).toBe("health-report"));
 it("no atribuye instrumento por simple CSV",()=>expect(proposeDocumentDestinations(analysis("csv"),"undetermined")[0].target).toBe("manual-review"));
 it("propone estudios si hay coincidencia metodológica previa",()=>{
 const candidate={...analysis("csv"),methodologicalMatches:[{moduleId:"duke-eas",label:"DUKE",matched:11,expected:11,confidence:"strong" as const,adapter:"sav" as const}]};
 expect(proposeDocumentDestinations(candidate,"undetermined")[0].target).toBe("complementary-studies");
 });
 it("no propone carga directa para PDF sin clasificar",()=>expect(proposeDocumentDestinations(analysis("pdf"),"undetermined")[0].target).toBe("manual-review"));
});
