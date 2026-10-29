/**
 * buildLocalHealthProfile
 *
 * Función pura. Construye un LocalHealthProfile en estado "generated"
 * a partir de los outputs del pipeline existente y del workspace.
 *
 * Contratos garantizados:
 *  - No escribe en el workspace.
 *  - No persiste nada.
 *  - No llama a localStorage.
 *  - No depende de React.
 *  - No genera datos simulados; todo contenido procede de los inputs.
 *  - El capítulo V es scaffold marcado como "authored" pendiente.
 *  - El capítulo VII contiene datos reales + nota de deliberación humana.
 *  - El Informe de Salud se referencia por ID; nunca se embebe su contenido.
 */

import { profileSAMNotes } from "../sam/profileSAMNotes";
import type { EvidenceStore } from "../../domain/evidence";
import type { IntegrityGuardResult } from "../../application/evidence";
import type { EstadoTerritorialEvolutivo } from "../../application/territorial-interpretation";
import type {
  ReconciliacionResult,
  ConflictoInterpretativo,
  TensionAnalizada,
} from "../../application/reconciliation";
import type { OITResult, OITOpportunity } from "../../application/oit";
import type { MunicipalityWorkspace } from "../../domain/workspace";
import { territorialScopeNoun } from "./territorialGrammar";
import type { IBSEStudy } from "../../domain/ibse";
import type {
  LocalHealthProfile,
  PSLConflicto,
  PSLTension,
  PSLAreaIntervencion,
  PSLPriorizacion,
  PSLPriorizacionStatus,
} from "../../domain/health-profile";
import { THEMATIC_TOPICS } from "../../domain/thematic-prioritisation";
import {
  buildNarrativeChapters,
  renderNarrativeChapters,
  NARRATIVE_GENERATOR_VERSION,
} from "./narrativeChapters";
import { buildDiagnosticAnswers } from "./diagnosticAnswers";
import { healthReportFingerprint } from "./profileSourceChanged";
import { institutionalHealthReportTitle } from "./healthReportSanitaryReading";

// ── Secciones del Marco Estratégico (Capítulo I) ──────────────────────────────
// Corresponden a los IDs fijos de createStrategicFramework().
const STRATEGIC_FRAMEWORK_SECTION_IDS: string[] = [
  "normativo",
  "estrategico",
  "metodologico",
  "salutogenico",
  "fuentes",
];

// ── Vocabulario territorial ───────────────────────────────────────────────────
// El sustantivo con el que el Perfil se refiere a su ámbito se deriva de la
// identidad territorial (territorialGrammar): un distrito nunca debe redactarse
// como "municipio", y un municipio con INE no debe caer a "ámbito territorial".
// Re-exportado desde su fuente única para no romper importadores existentes.
export { territorialScopeNoun };

// ── Cautelas de escala/proxy ──────────────────────────────────────────────────
// Detecta cautelas metodológicas que declaran evidencia de escala más amplia
// que el ámbito (provincial u origen externo) usada como contexto exploratorio.

const PROXY_SCALE_RE =
  /proxy|contexto exploratorio|estimaci[óo]n espec[íi]fica|escala provincial|[áa]mbito provincial/i;

interface StudyWithCautions {
  methodologicalCautions?: string[];
}

function collectStudyCautions(workspace: MunicipalityWorkspace): string[] {
  const studies: Array<StudyWithCautions | undefined> = [
    workspace.ibseStudy,
    workspace.dukeStudy,
    workspace.predimedStudy,
    workspace.sf12Study,
    workspace.suenoStudy,
    workspace.cageStudy,
    workspace.auditcStudy,
    workspace.ipaqStudy,
    workspace.ghq12Study,
    workspace.phq9Study,
    workspace.psqiStudy,
    workspace.fagerstromStudy,
    workspace.sbqStudy,
  ];
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const study of studies) {
    for (const caution of study?.methodologicalCautions ?? []) {
      if (!seen.has(caution)) {
        seen.add(caution);
        unique.push(caution);
      }
    }
  }
  return unique;
}

interface ScopeContext {
  scopeNoun: string;
  studyCautions: string[];
  hasProxyScale: boolean;
}

// ── Input ─────────────────────────────────────────────────────────────────────

export interface BuildLocalHealthProfileInput {
  sanitizedStore: EvidenceStore;
  integrityResult: IntegrityGuardResult;
  mit: EstadoTerritorialEvolutivo;
  reconciliacion: ReconciliacionResult;
  oitParaDecision: OITResult;
  workspace: MunicipalityWorkspace;
}

// ── Entry point ───────────────────────────────────────────────────────────────

export function buildLocalHealthProfile(
  input: BuildLocalHealthProfileInput
): LocalHealthProfile {
  const { sanitizedStore, integrityResult, mit, reconciliacion, oitParaDecision, workspace } =
    input;

  const now = new Date().toISOString();
  const lt1 = mit.dimensionDiagnostica;

  // Vocabulario y escala del ámbito, compartidos por todos los bloques narrativos.
  const scope: ScopeContext = (() => {
    const studyCautions = collectStudyCautions(workspace);
    return {
      scopeNoun: territorialScopeNoun(workspace.municipality.identity),
      studyCautions,
      hasProxyScale: studyCautions.some((c) => PROXY_SCALE_RE.test(c)),
    };
  })();

  // ── Capítulo II: referencia al Informe de Salud ──────────────────────────
  const hr = workspace.healthReport;
  const hrTitle =
    hr !== undefined
      ? institutionalHealthReportTitle(workspace.municipality.identity.id, hr.title)
      : undefined;
  const hrAtomCount = sanitizedStore.atoms.filter(
    (a) => a.provenance.origin === "health-report"
  ).length;

  // ── Capítulo III: diagnóstico integrado ──────────────────────────────────
  const originsSummary = [...new Set(
    sanitizedStore.atoms.map((a) => a.provenance.origin)
  )].sort();

  const complementaryStudyCount = [
    workspace.ibseStudy,
    workspace.dukeStudy,
    workspace.predimedStudy,
    workspace.sf12Study,
    workspace.suenoStudy,
    workspace.cageStudy,
    workspace.auditcStudy,
    workspace.ipaqStudy,
    workspace.ghq12Study,
    workspace.phq9Study,
    workspace.psqiStudy,
    workspace.fagerstromStudy,
    workspace.sbqStudy,
  ].filter(Boolean).length;

  // ── Capítulo VII: priorización scaffold ──────────────────────────────────
  const topicMap = new Map(THEMATIC_TOPICS.map((t) => [t.id, t.label]));
  const selectedIds = workspace.thematicPrioritisation?.selectedTopicIds ?? [];

  const realOpportunities = oitParaDecision.opportunities.filter(
    (o) => !o.isAnalyticalGap
  );
  const hasTechnical = realOpportunities.length > 0;

  const priorizacion: PSLPriorizacion = {
    candidaturasTecnicas: realOpportunities.map((o) => ({
      id: o.id,
      title: o.title,
      rationale: o.rationale,
      relatedEvidenceIds: [...o.relatedEvidenceIds],
    })),
    hasTechnicalCandidatures: hasTechnical,
    tematicasSeleccionadasIds: [...selectedIds],
    tematicasSeleccionadasLabels: selectedIds.map((id) => topicMap.get(id) ?? id),
    hasParticipatorySelection: selectedIds.length > 0,
    deliberacionNota:
      "Deliberación pendiente. Las prioridades definitivas del " +
      `${scope.scopeNoun} se acuerdan entre el equipo técnico, la ciudadanía y ` +
      "las instituciones, a partir de las candidaturas técnicas y las " +
      "preferencias ciudadanas; el sistema prepara el material de contraste, " +
      "no la decisión.",
    consensoDocumentado: false,
  };

  const priorizacionStatus: PSLPriorizacionStatus =
    hasTechnical || selectedIds.length > 0 ? "partial" : "scaffold";

  return {
    // ── Identidad ──────────────────────────────────────────────────────────
    id: crypto.randomUUID(),
    municipalityId: workspace.municipality.identity.id,
    status: "generated",
    version: now,
    evidenceStoreVersion: sanitizedStore.updatedAt,
    narrativeGeneratorVersion: NARRATIVE_GENERATOR_VERSION,

    // ── I: Marco Estratégico ───────────────────────────────────────────────
    strategicFrameworkSectionIds: STRATEGIC_FRAMEWORK_SECTION_IDS,

    // ── II: Informe de Salud — referencia, nunca el documento ─────────────
    healthReportDocumentId: hr?.linkedDocumentId,
    healthReportFingerprint: healthReportFingerprint(hr),
    healthReportTitle: hrTitle,
    healthReportSectionCount: hr?.sections.length ?? 0,
    healthReportAtomCount: hrAtomCount,

    // ── III: Diagnóstico integrado ─────────────────────────────────────────
    totalEvidenceAtoms: integrityResult.stats.totalAtoms,
    integrityErrors: integrityResult.errors.length,
    integrityWarnings: integrityResult.warnings.length,
    atomsByOrigin: { ...integrityResult.stats.byOrigin },
    atomsByKind: { ...integrityResult.stats.byKind },
    evidenceAtomIds: sanitizedStore.atoms.map((a) => a.id),
    originsSummary,
    ibsePresent: workspace.ibseStudy !== undefined,
    dukePresent: workspace.dukeStudy !== undefined,
    predimedPresent: workspace.predimedStudy !== undefined,
    sf12Present: workspace.sf12Study !== undefined,
    suenoPresent: workspace.suenoStudy !== undefined,
    cagePresent: workspace.cageStudy !== undefined,
    auditcPresent: workspace.auditcStudy !== undefined,
    ipaqPresent: workspace.ipaqStudy !== undefined,
    ghq12Present: workspace.ghq12Study !== undefined,
    phq9Present: workspace.phq9Study !== undefined,
    psqiPresent: workspace.psqiStudy !== undefined,
    fagerstromPresent: workspace.fagerstromStudy !== undefined,
    sbqPresent: workspace.sbqStudy !== undefined,
    thematicPrioritisationPresent: workspace.thematicPrioritisation !== undefined,
    complementaryStudyCount,

    // ── IV: Interpretación territorial ────────────────────────────────────
    territorialSummary: lt1.summary,
    determinantCount: lt1.determinants.length,
    assetCount: lt1.assets.length,
    indicatorCount: lt1.indicators.length,
    qualitativeFindingCount: lt1.qualitativeFindings.length,
    methodologicalCautionCount: lt1.methodologicalCautions.length,
    preliminaryOpportunities: [...lt1.preliminaryOpportunities],
    longitudinalActive: mit.dimensionLongitudinal.activa,
    longitudinalNote: mit.dimensionLongitudinal.nota,
    longitudinalEvidenceCount: mit.dimensionLongitudinal.evidenciasLongitudinales,
    marcosAplicados: [...mit.marcosAplicados],
    tensionesEstructurales: [...mit.tensionesEstructurales],
    limitacionesDiagnosticas: [...(mit.limitacionesDiagnosticas ?? [])],
    conflictos: reconciliacion.conflictos.map(mapConflicto),
    tensionesEscaladas: reconciliacion.tensionesEscaladas.map(mapTension),
    tensionesNoEscaladas: reconciliacion.tensionesNoEscaladas.map(mapTension),
    ruidoEstructural: reconciliacion.ruidoEstructural.map(mapTension),
    areasDeIntervencion: oitParaDecision.opportunities.map(mapAreaIntervencion),

    // ── V: Conclusiones (scaffold) ─────────────────────────────────────────
    conclusiones: {
      content: buildConclusionesScaffold(mit, reconciliacion, oitParaDecision, hrTitle, workspace.ibseStudy, scope, {
        complementaryStudyCount,
        territorialDocTitles: workspace.repository.documents
          .filter(
            (d) =>
              (d.kind === "territorial-documentation" ||
                d.kind === "complementary-study" ||
                d.kind === "qualitative-material") &&
              (d.sourceText?.trim().length ?? 0) > 0
          )
          .map((d) => d.title),
        scopeName: workspace.municipality.identity.name,
        province: workspace.municipality.identity.province,
        workspace,
      }),
      status: "scaffold",
      authorshipNote:
        "Borrador sustantivo elaborado desde la evidencia y el espacio de " +
        "conocimiento. El equipo técnico debe revisarlo, matizarlo y asumir su " +
        "autoría; no es un hueco a rellenar desde cero.",
    },

    // ── VI: Cierre interpretativo (scaffold) ──────────────────────────────
    cierreInterpretativo: {
      content: buildCierreInterpretativoScaffold(mit, reconciliacion, oitParaDecision, {
        hasLocalizaSaludAssets: lt1.assets.some((a) => a.provenance.origin === "localiza-salud"),
        isDistrict: scope.scopeNoun === "distrito",
        scope,
      }),
      status: "scaffold",
      authorshipNote:
        "Borrador de cierre elaborado desde el diagnóstico. El equipo técnico " +
        "lo revisa, matiza y valida antes de su uso institucional; no formula " +
        "acciones ni recomendaciones.",
    },

    // ── VII: Síntesis y Priorización (scaffold) ───────────────────────────
    priorizacion,
    priorizacionStatus,

    // ── Metadatos del ciclo de vida ────────────────────────────────────────
    generatedAt: now,

    requiresHumanValidation: true,
  };
}

// ── Detección de contenido humano ────────────────────────────────────────────
// Devuelve true si el PSL validado contiene texto o consenso redactado por el
// equipo técnico. Se usa para proteger contra invalidación accidental.

export function hasPSLHumanContent(psl: LocalHealthProfile): boolean {
  return (
    psl.conclusiones.status === "authored" ||
    psl.cierreInterpretativo.status === "authored" ||
    psl.priorizacion.consensoDocumentado
  );
}

// ── Mappers de tipos de aplicación a tipos PSL de dominio ────────────────────

function mapConflicto(c: ConflictoInterpretativo): PSLConflicto {
  return {
    id: c.id,
    tipo: c.tipo,
    descripcion: c.descripcion,
    fuentesImplicadas: [...c.fuentesImplicadas],
    resolucion: "no-resuelta",
  };
}

function mapTension(t: TensionAnalizada): PSLTension {
  return {
    descripcion: t.tension,
    clasificacion: t.clasificacion,
    criteriosCumplidos: t.relevancia.criteriosCumplidos,
  };
}

function mapAreaIntervencion(o: OITOpportunity): PSLAreaIntervencion {
  return {
    id: o.id,
    title: o.title,
    rationale: o.rationale,
    relatedEvidenceIds: [...o.relatedEvidenceIds],
    cautions: [...o.cautions],
    isAnalyticalGap: o.isAnalyticalGap,
  };
}

// ── Scaffold text generators ──────────────────────────────────────────────────

// Normalización para la heurística de pertenencia territorial de activos.
function normalizeForScopeMatch(value: string): string {
  const decomposed = value.normalize("NFD").toLowerCase();
  let out = "";
  for (let i = 0; i < decomposed.length; i++) {
    const code = decomposed.charCodeAt(i);
    const isDigit = code >= 48 && code <= 57;
    const isLower = code >= 97 && code <= 122;
    if (isDigit || isLower) out += decomposed[i];
  }
  return out;
}

// Token distintivo del ámbito: el fragmento más largo de su nombre que no sea
// el nombre de la provincia (para "Granada-Zaidín" → "zaidin").
function distinctiveScopeToken(
  scopeName: string,
  province: string | undefined
): string | undefined {
  const provinceNorm = province !== undefined ? normalizeForScopeMatch(province) : "";
  const tokens = scopeName
    .split(/[^\p{L}\p{N}]+/u)
    .map(normalizeForScopeMatch)
    .filter((t) => t.length >= 4 && t !== provinceNorm);
  if (tokens.length === 0) return undefined;
  return tokens.reduce((a, b) => (b.length > a.length ? b : a));
}

function buildConclusionesScaffold(
  mit: EstadoTerritorialEvolutivo,
  reconciliacion: ReconciliacionResult,
  oitParaDecision: OITResult,
  healthReportTitle: string | undefined,
  ibseStudy: IBSEStudy | undefined,
  scope: ScopeContext,
  extras: {
    complementaryStudyCount: number;
    territorialDocTitles: string[];
    scopeName: string;
    province?: string;
    workspace: MunicipalityWorkspace;
  },
): string {
  const lt1 = mit.dimensionDiagnostica;

  const hasReadableDiagnosticDocuments = extras.workspace.repository.documents.some(
    (d) =>
      (d.kind === "territorial-documentation" ||
        d.kind === "complementary-study" ||
        d.kind === "qualitative-material") &&
      (d.sourceText?.trim().length ?? 0) > 0
  );

  if (mit.totalEvidencias === 0 && !hasReadableDiagnosticDocuments) {
    return (
      "El Perfil aún no dispone de información territorial suficiente para formular " +
      "conclusiones sustantivas. Incorpora fuentes diagnósticas al repositorio " +
      "antes de redactar este capítulo."
    );
  }

  // El borrador de conclusiones se organiza como documento por determinantes
  // (capítulos I–VI). La composición vive en narrativeChapters.ts como
  // funciones puras; aquí solo se seleccionan los datos que lo alimentan.
  const areasReales = oitParaDecision.opportunities
    .filter((o) => !o.isAnalyticalGap)
    .map((o) => o.title);

  // Activos que se identifican expresamente con el ámbito: su título o
  // contenido contiene el nombre distintivo del territorio (p. ej., "Zaidín").
  const scopeToken = distinctiveScopeToken(extras.scopeName, extras.province);
  const scopeMatchedAssetTitles =
    scopeToken === undefined
      ? []
      : lt1.assets
          .filter((a) => normalizeForScopeMatch(`${a.title} ${a.content}`).includes(scopeToken))
          .map((a) => a.title);

  // Capa de respuestas diagnósticas: conocimiento del técnico + lectura del
  // Informe de Salud + epidemiología social + salutogénesis analítica.
  const answers = buildDiagnosticAnswers({
    workspace: extras.workspace,
    determinantTitles: lt1.determinants.map((a) => a.title),
    assets: lt1.assets.map((a) => ({ title: a.title, content: a.content })),
    indicatorTitles: lt1.indicators.map((a) => a.title),
  });

  const chapters = buildNarrativeChapters({
    answers,
    scopeNoun: scope.scopeNoun,
    province: extras.province,
    studyCautions: scope.studyCautions,
    samNotes: profileSAMNotes(extras.workspace),
    hasProxyScale: scope.hasProxyScale,
    healthReportTitle,
    complementaryStudyCount: extras.complementaryStudyCount,
    territorialDocTitles: extras.territorialDocTitles,
    ibse:
      ibseStudy && Number.isFinite(ibseStudy.aggregates.meanTotal)
        ? {
            meanTotal: ibseStudy.aggregates.meanTotal,
            nValid: ibseStudy.aggregates.nValid,
            isProxy: (ibseStudy.methodologicalCautions ?? []).some((c) =>
              PROXY_SCALE_RE.test(c)
            ),
          }
        : undefined,
    indicatorCount: lt1.indicators.length,
    indicatorTitles: lt1.indicators.map((a) => a.title),
    determinantCount: lt1.determinants.length,
    determinantTitles: lt1.determinants.map((a) => a.title),
    assetCount: lt1.assets.length,
    assetTitles: lt1.assets.map((a) => a.title),
    scopeMatchedAssetTitles,
    hasLocalizaAssets: lt1.assets.some(
      (a) => a.provenance.origin === "localiza-salud"
    ),
    qualitativeCount: lt1.qualitativeFindings.length,
    cautionCount: lt1.methodologicalCautions.length,
    longitudinalNote: mit.dimensionLongitudinal.nota,
    tensionesEscaladas: reconciliacion.tensionesEscaladas.length,
    tensionesNoEscaladas: reconciliacion.tensionesNoEscaladas.length,
    conflictos: reconciliacion.conflictos.length,
    limitacionesDiagnosticas: [...(mit.limitacionesDiagnosticas ?? [])],
    areasReales,
  });

  return renderNarrativeChapters(chapters);
}

function buildCierreInterpretativoScaffold(
  mit: EstadoTerritorialEvolutivo,
  reconciliacion: ReconciliacionResult,
  oitParaDecision: OITResult,
  options: { hasLocalizaSaludAssets: boolean; isDistrict: boolean; scope: ScopeContext },
): string {
  const { scopeNoun, hasProxyScale } = options.scope;

  if (mit.totalEvidencias === 0) {
    return (
      "El Perfil aún no dispone de información suficiente para formular un cierre " +
      "interpretativo. Incorpora fuentes diagnósticas al repositorio antes de " +
      "redactar este capítulo."
    );
  }

  const parts: string[] = [];

  parts.push(
    `La salud del ${scopeNoun} no queda explicada por una lista de patologías ` +
    "ni por la acumulación de indicadores aislados. La lectura disponible señala " +
    "un territorio cuya situación sanitaria debe entenderse a través de las " +
    "condiciones de vida, las oportunidades cotidianas de salud, los apoyos " +
    "comunitarios y los límites de la evidencia incorporada. No formula " +
    "actuaciones ni recomendaciones: fija la comprensión diagnóstica que debe " +
    "llegar a la deliberación pública."
  );

  // ── Escala de la evidencia: contexto exploratorio, no estimación propia ───
  if (hasProxyScale) {
    parts.push(
      "La evidencia que procede de escalas más amplias no autoriza por sí sola " +
      `una afirmación específica sobre el ${scopeNoun}. Sí permite situar el ` +
      "análisis en un contexto epidemiológico y social reconocible, siempre que " +
      "sus implicaciones se contrasten con fuentes locales y con el conocimiento " +
      "del Grupo Motor."
    );
  }

  // ── Tensiones que señalan donde el conocimiento es más incierto ───────────
  const hasConflictos = reconciliacion.conflictos.length > 0;
  const hasTensionesNoEscaladas = reconciliacion.tensionesNoEscaladas.length > 0;

  if (hasConflictos || hasTensionesNoEscaladas) {
    parts.push(
      "Las fuentes no convergen plenamente en todos los puntos. Esa falta de " +
      "cierre empírico no debe maquillarse: delimita los asuntos donde el juicio " +
      "técnico necesita contraste comunitario, revisión documental y una lectura " +
      "prudente antes de convertirse en prioridad institucional."
    );
  }

  // ── Activos: capacidades que sostienen el proceso ─────────────────────────
  if (mit.dimensionDiagnostica.assets.length > 0) {
    if (options.hasLocalizaSaludAssets) {
      parts.push(
        "Se han identificado recursos y activos en el entorno territorial " +
        "mediante consulta de Localiza Salud. " +
        (options.isDistrict
          ? "En este ámbito inframunicipal, los activos incorporados pueden " +
            "incluir recursos del municipio matriz o del entorno funcional más amplio. " +
            "Por eso expresan capacidad potencial, no cobertura demostrada: deben " +
            "validarse territorialmente antes de sostener decisiones de planificación."
          : "Expresan capacidad potencial del proceso local, no cobertura demostrada " +
            "ni suficiencia comunitaria: deben validarse antes de sostener decisiones " +
            "de planificación.")
      );
    } else {
      parts.push(
        "Los activos comunitarios incorporados muestran que el territorio no se " +
        "reduce a sus necesidades. También contiene capacidades, vínculos y recursos " +
        "que pueden hacer viable una respuesta local si el plan los reconoce sin " +
        "idealizarlos."
      );
    }
  }

  // ── Incertidumbres: hacerlas explícitas, no ocultarlas ────────────────────
  if (mit.dimensionDiagnostica.methodologicalCautions.length > 0) {
    parts.push(
      "Las lagunas de información forman parte del diagnóstico. Cuando faltan " +
      "desagregaciones por edad, sexo, barrio o posición social, el Perfil no debe " +
      "convertir hipótesis plausibles en certezas; debe nombrar la incertidumbre " +
      "y usarla para orientar la búsqueda de evidencia y la conversación pública."
    );
  }

  // ── Transición a la priorización ──────────────────────────────────────────
  const realCount = oitParaDecision.opportunities.filter(
    (o) => !o.isAnalyticalGap
  ).length;

  if (realCount > 0) {
    parts.push(
      `De esta lectura emergen ${realCount} asunto(s) que merecen llegar mejor ` +
      "formulados a la priorización. No son una votación ni una orden de actuación: " +
      "son materias que concentran evidencia, incertidumbre o relevancia comunitaria " +
      "y que deben someterse a contraste técnico, político y ciudadano."
    );
  }

  parts.push(
    "Por tanto, el expediente no queda cerrado por acumulación documental, sino " +
    "por una posición interpretativa: avanzar exige contrastar lo observado, " +
    "completar lo que falta, reconocer los determinantes probables sin fingir " +
    "pruebas que no existen y usar la priorización ciudadana como información " +
    "organizada para decidir mejor, no como sustituto del juicio técnico y " +
    "comunitario."
  );

  return parts.join("\n\n");
}
