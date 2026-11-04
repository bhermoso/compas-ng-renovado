import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HEALTHY_AGING_MODULE, ADDICTIONS_MODULE, ACTION_PLAN_CATALOG } from "../src/domain/action-plan-catalog/ActionPlanCatalog";
import {
  COMMON_AGING_FOUR_BLOCKS_VERSION, COMMON_AGING_FOUR_BLOCKS,
  municipalActionPlanModule, prepareMunicipalActionPlanDraft
} from "../src/domain/action-plan-catalog/MunicipalActionPlanModule";
import { type PlanPreparationDraft } from "../src/domain/action-plan-catalog/PlanPreparationDraft";
import { buildDefinitiveActionPlanProjection } from "../src/domain/action-plan-catalog/DefinitiveActionPlanProjection";
import { buildPlanDocument } from "../src/domain/action-plan-catalog/PlanDocument";
import { PlanPreparationPanel } from "../src/ui/components/PlanPreparationPanel";
import { ActionPlanCatalogPanel } from "../src/ui/components/BrowserCanonicalActionPlanPanel";
import TerritorialWorkspace from "../src/ui/components/TerritorialWorkspace";
import type { RelasClient } from "../src/infrastructure/relas/RelasClient";

const four = ["Edadismo", "Soledad no deseada", "Autonomía", "Participación"];
const oldSpecific = HEALTHY_AGING_MODULE.generalObjectives.flatMap(g => g.specificObjectives);

function previousDraft(municipalityId: string): PlanPreparationDraft {
  return {
    municipalityId, moduleId: HEALTHY_AGING_MODULE.id,
    version: HEALTHY_AGING_MODULE.version, updatedAt: "2026-10-04T00:00:00.000Z",
    decisions: {
      [HEALTHY_AGING_MODULE.id]: {status:"included",sourceText:HEALTHY_AGING_MODULE.strategicObjective},
      "ENV-OG1": {status:"excluded",sourceText:"Autonomía · agrupación histórica"},
      "ENV-OE1.1": {status:"modified",sourceText:"Objetivo original",text:"Adaptación individual del municipio"},
      "ENV-OE2.1": {status:"included",sourceText:"Objetivo en soledad"},
      "ENV-I2.1": {status:"modified",sourceText:"Indicador original",text:"Indicador adaptado localmente"},
    },
    unaddressedNeeds:[{id:"need-1",title:"Una necesidad no cubierta",justification:"Aún requiere valoración local"}],
    evaluationFramework:{evaluationQuestions:["Pregunta del municipio"],evaluationMoments:[],evaluationResponsible:"",baselineNote:""},
  };
}

describe("Plan de Acción común para cualquier expediente", () => {
  it("expone exactamente dos líneas para municipios existentes y expedientes futuros", () => {
    expect(ACTION_PLAN_CATALOG.map(m => m.title)).toEqual([
      "Envejecimiento saludable", "Prevención y abordaje de las adicciones",
    ]);
    for (const municipalityId of ["loja","alfacar","atarfe","granada","municipio-nuevo-2027"]) {
      const modules=ACTION_PLAN_CATALOG.map(m=>municipalActionPlanModule(municipalityId,m));
      expect(modules).toHaveLength(2);
      const [aging,addictions]=modules;
      expect(aging.version).toBe(COMMON_AGING_FOUR_BLOCKS_VERSION);
      expect(aging.generalObjectives.map(g=>g.thematicBlockName)).toEqual(four);
      expect(aging.generalObjectives.map(g=>g.specificObjectives.length)).toEqual([2,7,4,5]);
      expect(aging.generalObjectives.flatMap(g=>g.specificObjectives)).toHaveLength(18);
      expect(addictions).toBe(ADDICTIONS_MODULE);
      expect(addictions.generalObjectives).toHaveLength(6);
      expect(JSON.stringify(aging.generalObjectives)).not.toMatch(/Zaidín|del distrito|SENIOR FEST/);
      expect(aging.sourceLabel).toContain("Granada-Zaidín");
      expect(aging.cautions.join(" ")).toContain("no diagnóstico");
    }
    expect(HEALTHY_AGING_MODULE.generalObjectives).toHaveLength(9);
    expect(COMMON_AGING_FOUR_BLOCKS.generalObjectives.map(g=>g.code)).toEqual([
      "COMUN-ENV-OG1","COMUN-ENV-OG2","COMUN-ENV-OG3","COMUN-ENV-OG4",
    ]);
  });

  it("no traslada ningún borrador, decisión ni validación a un municipio distinto",()=>{
    const orig=previousDraft("loja");
    const alfacar=municipalActionPlanModule("alfacar", HEALTHY_AGING_MODULE);
    expect(()=>prepareMunicipalActionPlanDraft("alfacar",alfacar,orig)).toThrow(/municipio/);
    expect(buildDefinitiveActionPlanProjection("alfacar",[alfacar],[orig])).toEqual([]);
    expect(buildDefinitiveActionPlanProjection("alfacar",[alfacar],[])).toEqual([]);
  });

  it("archiva íntegro el borrador 3.1 y preserva exclusiones, adaptaciones y datos no priorizados",()=>{
    const orig=previousDraft("loja");
    const before=JSON.stringify(orig);
    const module=municipalActionPlanModule("loja",HEALTHY_AGING_MODULE);
    const converted=prepareMunicipalActionPlanDraft("loja",module,orig,"2026-11-04T20:00:00.000Z")!;
    expect(JSON.stringify(orig)).toBe(before);
    expect(converted.version).toBe(COMMON_AGING_FOUR_BLOCKS_VERSION);
    expect(converted.migration?.draft).toEqual(orig);
    expect(converted.migration?.replacementVersion).toBe(module.version);
    expect(converted.decisions["ENV-OE1.1"]).toMatchObject({
      status:"excluded",text:"Adaptación individual del municipio",
      excludedDecision:{status:"modified",text:"Adaptación individual del municipio"},
    });
    expect(converted.decisions["ENV-I2.1"].text).toBe("Indicador adaptado localmente");
    expect(module.generalObjectives.map(g=>converted.decisions[g.code].status)).toEqual(["pending","pending","pending","pending"]);
    expect(converted.evaluationFramework).toEqual(orig.evaluationFramework);
    expect(converted.unaddressedNeeds).toEqual(orig.unaddressedNeeds);
    expect(prepareMunicipalActionPlanDraft("loja",module,converted)).toBe(converted);
    expect(()=>prepareMunicipalActionPlanDraft("loja",module,{...orig,version:"desconocida"})).toThrow(/compatibilidad/);
  });

  it("el editor y el documento final comparten cuatro bloques y los dos módulos, sin validación automática",()=>{
    const municipalityId="alfacar";
    const aging=municipalActionPlanModule(municipalityId,HEALTHY_AGING_MODULE);
    const first=aging.generalObjectives[0];
    const selected:PlanPreparationDraft={
      municipalityId,moduleId:aging.id,version:aging.version,updatedAt:"2026-11-04",
      decisions:{
        [aging.id]:{status:"included",sourceText:aging.strategicObjective},
        [first.code]:{status:"included",sourceText:first.title},
        [first.specificObjectives[0].code]:{status:"included",sourceText:first.specificObjectives[0].title},
        [first.specificObjectives[0].indicator.code]:{status:"included",sourceText:first.specificObjectives[0].indicator.title},
      },
    };
    const html=renderToStaticMarkup(<PlanPreparationPanel municipalityId={municipalityId} module={aging}
      draft={selected} onChange={()=>{}} renderWorksheet={()=>null}/>);
    for(const name of four)expect(html).toContain(`<summary>${name}</summary>`);
    expect(html).toContain("4 objetivos generales");
    const active=buildDefinitiveActionPlanProjection(municipalityId,[aging,ADDICTIONS_MODULE],[selected]);
    const document=buildPlanDocument(municipalityId,active,"2026-11-04");
    expect(document.status).toBe("draft");
    expect(document.moduleVersions).toEqual([{moduleId:aging.id,version:aging.version}]);
    expect(document.paragraphs.some(p=>p.text==="Bloque temático · Edadismo")).toBe(true);
    expect(document.paragraphs.some(p=>p.text.startsWith("Objetivo específico"))).toBe(true);
    const full=renderToStaticMarkup(<ActionPlanCatalogPanel municipalityId={municipalityId}
      eligibleModules={[]} reviews={[]} worksheets={[]} drafts={[selected]}
      onDraftChange={()=>{}} onSave={()=>[]} />);
    expect(full).toContain("Envejecimiento saludable");
    expect(full).toContain("Prevención y abordaje de las adicciones");
  });

  it("muestra botón de conversión pero no modifica el borrador antiguo al abrir",()=>{
    const old=previousDraft("loja"),before=JSON.stringify(old);
    let changes=0;
    const html=renderToStaticMarkup(<ActionPlanCatalogPanel municipalityId="loja"
      eligibleModules={[]} reviews={[]} worksheets={[]} drafts={[old]}
      onDraftChange={()=>changes++} onSave={()=>[]}/>);
    expect(html).toContain("Preparar cuatro bloques y conservar la versión anterior");
    expect(html).toContain("no se puede editar");
    expect(changes).toBe(0);
    expect(JSON.stringify(old)).toBe(before);
  });

  it("el espacio de coordinación autenticado ofrece las dos líneas, no solo envejecimiento",()=>{
    const html=renderToStaticMarkup(<TerritorialWorkspace scope="loja" role="reader"
      client={{} as RelasClient} onBack={()=>{}}/>);
    expect(html).toContain('aria-label="Líneas del Plan de Acción"');
    expect(html).toContain("Envejecimiento saludable");
    expect(html).toContain("Prevención y abordaje de las adicciones");
  });

  it("todos los 18 códigos individuales mantienen su significado y las fichas originales",()=>{
    const current=COMMON_AGING_FOUR_BLOCKS.generalObjectives.flatMap(g=>g.specificObjectives);
    expect(current.map(s=>s.code).sort()).toEqual(oldSpecific.map(s=>s.code).sort());
    for(const specific of oldSpecific){
      const next=current.find(s=>s.code===specific.code)!;
      expect(next.indicator).toEqual({...specific.indicator,displayCode:next.indicator.displayCode});
      expect(next.displayCode).toMatch(/^ENV-OE[1-4]\./);
    }
  });
});
