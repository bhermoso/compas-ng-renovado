import type { ExternalHealthProfile } from "../../domain/health-profile/ExternalHealthProfile";

type EditableSnapshot = Pick<ExternalHealthProfile, "summary" | "findings" | "areas" | "text">;

export interface ProfileUpdateDelta {
  summaryChanged: boolean;
  findingsChanged: boolean;
  areasChanged: boolean;
  textChanged: boolean;
  before: EditableSnapshot;
  after: EditableSnapshot;
}

/** Vista previa íntegra y sin efectos secundarios de los cuatro campos editoriales. */
export function compareProfileUpdate(
  base: ExternalHealthProfile,
  updated: ExternalHealthProfile,
): ProfileUpdateDelta {
  const before: EditableSnapshot = {
    summary: base.summary,
    findings: base.findings,
    areas: base.areas,
    text: base.text,
  };
  const after: EditableSnapshot = {
    summary: updated.summary,
    findings: updated.findings,
    areas: updated.areas,
    text: updated.text,
  };
  const changed = (a: unknown, b: unknown) => JSON.stringify(a) !== JSON.stringify(b);
  return {
    summaryChanged: before.summary !== after.summary,
    findingsChanged: changed(before.findings, after.findings),
    areasChanged: changed(before.areas, after.areas),
    textChanged: before.text !== after.text,
    before,
    after,
  };
}
