import type { MunicipalityWorkspace } from '../../domain/workspace';
import type { LocalHealthProfile } from '../../domain/health-profile';

/** Compatibility projection for planning. No diagnosis, narrative or profile generation. */
export function selectExternalProfile(workspace: MunicipalityWorkspace): LocalHealthProfile {
 const library = workspace.externalProfileLibrary;
 const profile = library?.profiles.find(p => p.id === library.activeId && p.municipalityId === workspace.municipality.identity.id);
 if (!profile && workspace.validatedPSL?.municipalityId === workspace.municipality.identity.id) return workspace.validatedPSL;
 const areas = profile?.areas.map(a => ({...a,relatedEvidenceIds:[],cautions:profile.limitations})) ?? [];
 return {
  id:profile?.id ?? `no-profile:${workspace.municipality.identity.id}`,municipalityId:workspace.municipality.identity.id,
  status:profile?.status ?? 'archived',version:profile?.id ?? 'none',evidenceStoreVersion:profile?.evidenceVersion ?? '',strategicFrameworkSectionIds:[],
  healthReportSectionCount:0,healthReportAtomCount:0,totalEvidenceAtoms:0,integrityErrors:0,integrityWarnings:0,
  atomsByOrigin:{},atomsByKind:{},evidenceAtomIds:[],originsSummary:[],ibsePresent:false,dukePresent:false,
  predimedPresent:false,sf12Present:false,suenoPresent:false,cagePresent:false,thematicPrioritisationPresent:false,complementaryStudyCount:0,
  territorialSummary:profile?.summary ?? '',determinantCount:0,assetCount:0,indicatorCount:profile?.results.length ?? 0,
  qualitativeFindingCount:profile?.findings.length ?? 0,methodologicalCautionCount:profile?.limitations.length ?? 0,
  preliminaryOpportunities:[],longitudinalActive:false,longitudinalNote:'',longitudinalEvidenceCount:0,marcosAplicados:[],
  tensionesEstructurales:[],limitacionesDiagnosticas:profile?.limitations ?? [],conflictos:[],tensionesEscaladas:[],
  tensionesNoEscaladas:[],ruidoEstructural:[],areasDeIntervencion:areas,
  conclusiones:{content:profile?.text ?? '',status:profile ? 'authored':'scaffold',authorshipNote:profile?.author ?? ''},
  cierreInterpretativo:{content:profile?.summary ?? '',status:profile ? 'authored':'scaffold',authorshipNote:profile?.author ?? ''},
  priorizacion:{candidaturasTecnicas:areas.map(a => ({id:a.id,title:a.title,rationale:a.rationale,relatedEvidenceIds:[]})),
   hasTechnicalCandidatures:areas.length>0,tematicasSeleccionadasIds:[],tematicasSeleccionadasLabels:[],hasParticipatorySelection:false,
   deliberacionNota:'',consensoDocumentado:false},priorizacionStatus:areas.length ? 'partial':'scaffold',
  generatedAt:profile?.createdAt ?? workspace.createdAt,validatedAt:profile?.validatedAt,validatedBy:profile?.validatedBy,requiresHumanValidation:true,
 };
}
