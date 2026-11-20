import { describe, expect, it } from "vitest";
import { inferIBSESampleScope } from "../src/application/ibse/inferIBSESampleScope";
import { createCompleteMunicipalityWorkspace } from "../src/application/workspace";
import { parseWorkspaceJSON, serializeWorkspaceForStorage } from "../src/infrastructure/persistence/local-storage";
import { createIBSEStudy } from "../src/domain/ibse";

describe("recuperación IBSE con muestra mixta y trazabilidad", () => {
  it("declara mixed con menores y adultos válidos aunque una edad no sea interpretable", () => {
    expect(inferIBSESampleScope({
      under16: { n: 162, nValid: 145 },
      plus16: { n: 737, nValid: 665 },
      noAge: { n: 11, nValid: 1 },
    })).toBe("mixed");
  });
  it("no atribuye estrato exclusivo cuando hay edad desconocida", () => {
    expect(inferIBSESampleScope({
      under16: { n: 0, nValid: 0 },
      plus16: { n: 100, nValid: 99 },
      noAge: { n: 1, nValid: 1 },
    })).toBe("unknown");
    expect(inferIBSESampleScope()).toBe("unknown");
  });
  it("conserva una revisión IBSE sin cambiar resultados activos al guardar y rehidratar", () => {
    const ws = createCompleteMunicipalityWorkspace({id:"atarfe",name:"Atarfe",province:"Granada",ineCode:"18022"});
    const aggregates = {n:910,nValid:811,meanTotal:62.2,meanFactorVinculo:72.4,meanFactorSituacion:60.3,meanFactorControl:51.1,meanFactorPersona:65};
    const previousStudy = createIBSEStudy({ municipalityId:"atarfe", sourceFileName:"ibse-atarfe.csv", aggregates, methodologicalCautions:[] });
    ws.ibseStudy = previousStudy;
    ws.ibseStudyHistory = [{replacedAt:"2026-11-20T00:00:00Z",previousStudy,documents:[],evidence:[]}];
    const back = parseWorkspaceJSON(serializeWorkspaceForStorage(ws));
    expect(back?.ibseStudy?.aggregates.meanTotal).toBe(62.2);
    expect(back?.ibseStudyHistory?.[0]?.previousStudy.aggregates.nValid).toBe(811);
  });
});
