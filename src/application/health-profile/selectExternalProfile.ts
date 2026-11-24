import type { MunicipalityWorkspace } from '../../domain/workspace';
import type { LocalHealthProfile } from '../../domain/health-profile';
import { chosenProposals } from './profileChoices';

export function activeExternalProfile(workspace: Pick<MunicipalityWorkspace, "municipality" | "externalProfileLibrary">) {
 const library = workspace.externalProfileLibrary;
 return library?.profiles.find(p => p.id === library.activeId && !p.archivedAt && p.municipalityId === workspace.municipality.identity.id);
}

/** Compatibility projection for planning. No diagnosis, narrative or profile generation. */
export function selectExternalProfile(workspace: MunicipalityWorkspace): LocalHealthProfile {
 const profile = activeExternalProfile(workspace);
 if (!profile && workspace.validatedPSL?.municipalityId === workspace.municipality.identity.id) return workspace.validatedPSL;
 // La recomendación externa solo conserva su identidad y texto. El paquete
 // no contiene enlaces a EvidenceAtom: no fabricar un recuento cero ni
 // convertir las limitaciones generales en cautelas de cada recomendación.
 const chosen = profile ? chosenProposals(profile) : new Set<string>();
 const areas = profile?.areas.filter(a => chosen.has(a.id)).map(a => ({...a,relatedEvidenceIds:[],cautions:[]})) ?? [];
 const findings = profile?.findings.filter(f => chosen.has(/^(C\d+)\./.exec(f.trim())?.[1] ?? '')) ?? [];
 return {
  id:profile?.id ?? `no-profile:${workspace.municipality.identity.id}`,municipalityId:workspace.municipality.identity.id,
  status:profile?.status ?? 'archived',version:profile?.id ?? 'none',evidenceStoreVersion:profile?.evidenceVersion ?? '',strategicFrameworkSectionIds:[],
  healthReportSectionCount:0,healthReportAtomCount:0,totalEvidenceAtoms:0,integrityErrors:0,integrityWarnings:0,
  atomsByOrigin:{},atomsByKind:{},evidenceAtomIds:[],originsSummary:[],ibsePresent:false,dukePresent:false,
  predimedPresent:false,sf12Present:false,suenoPresent:false,cagePresent:false,thematicPrioritisationPresent:false,complementaryStudyCount:0,
  territorialSummary:profile?.summary ?? '',determinantCount:0,assetCount:0,indicatorCount:profile?.results.length ?? 0,
  qualitativeFindingCount:findings.length,methodologicalCautionCount:profile?.limitations.length ?? 0,
  preliminaryOpportunities:[],longitudinalActive:false,longitudinalNote:'',longitudinalEvidenceCount:0,marcosAplicados:[],
  tensionesEstructurales:[],limitacionesDiagnosticas:profile?.limitations ?? [],conflictos:[],tensionesEscaladas:[],
  tensionesNoEscaladas:[],ruidoEstructural:[],areasDeIntervencion:areas,
  conclusiones:{content:findings.join('\n\n'),status:profile ? 'authored':'scaffold',authorshipNote:profile?.author ?? ''},
  cierreInterpretativo:{content:profile?.summary ?? '',status:profile ? 'authored':'scaffold',authorshipNote:profile?.author ?? ''},
  priorizacion:{candidaturasTecnicas:areas.map(a => ({id:a.id,title:a.title,rationale:a.rationale,relatedEvidenceIds:[]})),
   hasTechnicalCandidatures:areas.length>0,tematicasSeleccionadasIds:[],tematicasSeleccionadasLabels:[],hasParticipatorySelection:false,
   deliberacionNota:'',consensoDocumentado:false},priorizacionStatus:areas.length ? 'partial':'scaffold',
  generatedAt:profile?.createdAt ?? workspace.createdAt,validatedAt:profile?.validatedAt,validatedBy:profile?.validatedBy,requiresHumanValidation:true,
 };
}
