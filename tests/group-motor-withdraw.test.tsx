import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { GroupMotorDecisionSummary } from "../src/ui/components/GroupMotorDecisionSummary";
import type { DeliberativePrioritySelection } from "../src/domain/deliberative-prioritisation";

const selection = {
  id: "s", municipalityId: "m", sourceLecturaId: "l", sourcePSLId: "p", sourcePSLVersion: "1",
  candidateScenarioIds: [], selectedScenarioIds: [], catalogModuleLinks: [], citizenTopicIds: [],
  deliberationRationale: "x", citizenInfluenceStatement: "x", decidedBy: "Grupo Motor", decidedAt: "2026-10-01T11:43:29.047Z",
} as unknown as DeliberativePrioritySelection;

describe("retirar un registro erróneo de la decisión del Grupo Motor", () => {
  it("solo se ofrece donde se registra la decisión", () => {
    expect(renderToStaticMarkup(<GroupMotorDecisionSummary selection={selection} isStale onWithdraw={() => {}} />)).toContain("Retirar este registro");
    expect(renderToStaticMarkup(<GroupMotorDecisionSummary selection={selection} isStale />)).not.toContain("Retirar este registro");
  });
});
