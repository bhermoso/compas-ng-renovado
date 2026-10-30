import { actionPlanElementCode } from "../src/domain/action-plan-catalog/ActionPlanNotation";
import { isValidElement, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { PlanPreparationPanel } from "../src/ui/components/PlanPreparationPanel";
import { ZAIDIN_AGING_PROPOSAL as module, type PlanPreparationDraft } from "../src/domain/action-plan-catalog/PlanPreparationDraft";
import { buildDefinitiveActionPlanProjection } from "../src/domain/action-plan-catalog/DefinitiveActionPlanProjection";

type Control = { "aria-label"?: string; value?: string; children?: ReactNode; onChange?: (e: {target: {value: string}}) => void; onClick?: () => void };
function find(node: ReactNode, label: string): Control | undefined {
 if (Array.isArray(node)) {
  for (const child of node) { const result = find(child, label); if (result) return result; }
 } else if (isValidElement<Control>(node)) {
  if (node.props["aria-label"] === label) return node.props;
  return find(node.props.children, label);
 }
}

describe("Plan editor preserves typed whitespace", () => {
 const general = module.generalObjectives[0];
 const objective = general.specificObjectives[0];
 for (const id of [module.id, general.code, objective.code, objective.indicator.code]) {
  it(`preserves spaces character by character, save and reopen: ${id}`, () => {
   const visibleId = actionPlanElementCode(module,id);
   let draft: PlanPreparationDraft | undefined;
   const render = () => PlanPreparationPanel({ module, municipalityId: "granada-zaidin", draft, onChange: next => { draft = next; }, renderWorksheet: () => null });
   find(render(), `Estado del Plan ${visibleId}`)!.onChange!({target:{value:"modified"}});
   const label = id.startsWith("ENV-B-")
    ? `Redacción del objetivo general · ${visibleId}`
    : `Redacción vigente · ${visibleId}`;
   find(render(), label)!.onChange!({target:{value:""}});
   let typed = "";
   for (const char of "Mejorar  la salud\ny la participación (nota local) ") {
    typed += char;
    const control = find(render(), label)!;
    control.onChange!({target:{value:control.value! + char}});
    expect(find(render(), label)!.value).toBe(typed);
    expect(draft!.decisions[id].text).toBe(typed);
   }
   find(render(), `Guardar redacción vigente · ${visibleId}`)!.onClick!();
   draft = JSON.parse(JSON.stringify(draft)) as PlanPreparationDraft;
   expect(find(render(), label)!.value).toBe(typed);
   expect(draft.decisions[id].text).toBe(typed);
  });
 }
 it("still normalizes the generated document without mutating the editor", () => {
  const draft: PlanPreparationDraft = {municipalityId:"granada-zaidin",moduleId:module.id,version:module.version,updatedAt:"2026-09-16",decisions:{
   [objective.code]:{status:"modified",sourceText:objective.title,text:"Mejorar  la salud\ny la participación "}
  }};
  const before = JSON.stringify(draft);
  const result = buildDefinitiveActionPlanProjection("granada-zaidin",[module],[draft]);
  expect(result[0].rows[0].objectiveDecision!.text).toBe("Mejorar la salud\ny la participación");
  expect(JSON.stringify(draft)).toBe(before);
 });
});
