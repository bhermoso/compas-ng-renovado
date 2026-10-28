import type { MunicipalityWorkspace } from "../../domain/workspace";
import { assessIBSEStudySAM } from "./assessStudies";
import { getPopulationReferenceSet } from "./populationReferenceRegistry";
import { describeSAM } from "./describeSAM";
import { assessSample } from "./assessSample";

/** Read-only notes for newly generated profiles; saved profiles are not rewritten. */
export function profileSAMNotes(workspace: MunicipalityWorkspace): string[] {
  const notes: string[] = [];
  for (const atom of workspace.evidenceStore.atoms.filter(a => a.provenance.origin === "sam")) {
    notes.push(atom.methodology.version === "SAM-3.0.0" ? atom.content :
      `SAM histórico (${atom.id}): conserva su clasificación ${atom.confidence} para trazabilidad. Esa clasificación no demuestra confianza metodológica ni representatividad; requiere reevaluación explícita con la metodología vigente.`);
  }
  const study = workspace.ibseStudy;
  if (study) {
    const refs = getPopulationReferenceSet(study.municipalityId);
    const result = assessIBSEStudySAM(study, refs);
    if (!result.evaluable) notes.push(`SAM IBSE: No evaluable. ${result.notEvaluableReason}`);
    for (const a of [result.under16, result.plus16]) if (a) notes.push(`SAM ${a.instrumentId}: ${describeSAM(a)}`);
    if (study.ageSexObserved && refs.allAges) {
      const r = assessSample({ municipalityId: study.municipalityId, instrumentId: "ibse-composition", observedCells: study.ageSexObserved.cells });
      if (r.status === "evaluable") notes.push(`Comparación descriptiva con el padrón de todas las edades, sin confirmar que sea el universo objetivo: ${describeSAM(r.assessment)} Registros no asignables: ${study.ageSexObserved.unassignableCount}.`);
    }
  }
  const participation = workspace.thematicPrioritisationStudy?.ageSexObserved;
  if (workspace.thematicPrioritisationStudy && !participation) notes.push("SAM participación: No evaluable; no hay recuentos por sexo y edad de las papeletas.");
  if (participation) {
    const r = assessSample({ municipalityId: workspace.municipality.identity.id, instrumentId: "priorizacion", observedCells: participation.cells });
    notes.push(r.status === "evaluable"
      ? `Participación, comparación descriptiva con todas las edades (universo objetivo sin confirmar): ${describeSAM(r.assessment)}`
      : `SAM participación: No evaluable. ${r.reasons.join(" ")}`);
  }
  return notes;
}
