/**
 * integratedInterpretation — Nivel 3 del Perfil.
 *
 * Cruza la agenda sanitaria oficial del Informe (N1,
 * `answers.sanitaria.baseEpidemiologica`) con las señales y conjuntos
 * integrados de los estudios (N2, `buildIntegratedSignalSets`), los
 * determinantes plausibles, las desigualdades/incertidumbres y las capacidades
 * salutogénicas ya disponibles en el expediente. Produce interpretaciones
 * territoriales trazables y prudentes que la vista editorial (N4) consume.
 *
 * Reglas (contratos del Perfil):
 *   - La epidemiología se escribe UNA vez en el Informe: aquí no se reenumera
 *     como segundo informe; se cita el tema y una magnitud, y se explica qué
 *     lectura territorial permite.
 *   - Primacía local: la señal local es la evidencia principal; el proxy es
 *     contexto y nunca la sustituye ni completa vacíos.
 *   - Señales distintas no se fusionan (GHQ-12≠PHQ-9, PSQI≠Sueño EAS, SBQ≠IPAQ,
 *     AUDIT-C≠CAGE, Fagerström≠prevalencia).
 *   - Los determinantes se formulan como mecanismos plausibles, nunca como
 *     causalidad demostrada.
 *   - La falta de desagregación es incertidumbre sustantiva, no nota marginal.
 *   - Las capacidades son potenciales: nunca cobertura, uso ni resultado.
 */

import type { DiagnosticAnswers } from "./diagnosticAnswers";
import type { UGCAssistanceQuestion } from "../ugc-clinical-assistance";
import type { ProfileSpace } from "../../domain/health-profile";
import type { TerritorialLexicon } from "./territorialGrammar";
import type {
  HealthReportStructuredFinding,
  HealthReportStructuredReading,
} from "../../domain/health-report";
import {
  buildIntegratedSignalSets,
  type IntegratedHealthProfileSignal,
  type IntegratedSignalSet,
} from "./integratedProfileSignals";

// ── Tipos ─────────────────────────────────────────────────────────────────────

/**
 * Estatus epistemológico de una unidad de interpretación (Nivel 3). Los estatus
 * de nivel de hallazgo (`documented-fact`, `document-authored-interpretation`,
 * `textual-presence`) viven en N1 y se conservan en la trazabilidad; estos tres
 * describen la naturaleza del CRUCE que construye N3.
 */
export type IntegratedInterpretationStatus =
  | "integrated-interpretation" // agenda documentada + evidencia local/contextual que se cruzan
  | "plausible-hypothesis" // el cruce descansa en un mecanismo plausible, pendiente de contraste
  | "open-question"; // el Informe calla o solo nombra; la señal local abre la pregunta

/**
 * Presencia del tema en la BASE ESTRUCTURADA del Informe (N1), no en el Informe
 * completo. La base es una extracción parcial: la ausencia de hallazgo
 * estructurado NO significa ausencia epidemiológica —puede ser tabla no
 * estructurada, sección no reconocida o contenido no accesible—.
 */
export type SanitaryAgendaPresence =
  | "documented" // hay hallazgo estructurado (medido o interpretado) en la base
  | "textual-only" // solo detectado textualmente (presencia textual), sin estructura
  | "not-structured"; // sin hallazgo estructurado disponible: no evaluable con la representación actual, no "no documentado"

export interface InterpretationSignalRef {
  id: string;
  label: string;
  value: string;
  scale: string;
  esLocal: boolean;
  sampleSize?: number;
  caution: string;
}

export interface InterpretationTraceability {
  /** Ids de los hallazgos del Informe (N1) que constituyen la agenda. */
  sanitaryFindingIds: string[];
  /** Secciones o tablas del Informe citadas, cuando existen. */
  sanitarySources: string[];
  localSignalIds: string[];
  corroboratingSignalIds: string[];
  contextualSignalIds: string[];
  determinantStatements: string[];
  capacityAmbitos: string[];
  /** Estatus de cada hallazgo del Informe usado (nivel N1). */
  sanitaryFindingStatuses: string[];
}

export interface IntegratedInterpretationUnit {
  id: string;
  title: string;
  /** Pregunta sustantiva que gobierna el razonamiento de la unidad. */
  question: string;
  sanitaryAgenda: {
    topics: string[];
    presence: SanitaryAgendaPresence;
    /** UNA frase honesta con la magnitud, no una copia de tablas. */
    magnitudeNote?: string;
  };
  localSignals: InterpretationSignalRef[];
  corroboratingSignals: InterpretationSignalRef[];
  contextualSignals: InterpretationSignalRef[];
  plausibleDeterminants: string[];
  inequalitiesOrUncertainties: string[];
  salutogenicCapacities: string[];
  limitations: string[];
  /** Interpretaciones de autoría humana del técnico (document-authored). */
  documentAuthoredInterpretations: string[];
  /** Hipótesis del técnico incorporadas como posibilidad a contrastar. */
  plausibleHypotheses: string[];
  /** Preguntas abiertas del técnico que la unidad mantiene vivas. */
  openHumanQuestions: string[];
  /**
   * Preguntas de contraste asistencial (N1b) que CONVERGEN con esta unidad.
   * Complementan la pregunta principal como cuestiones técnicas pendientes; son
   * `open-question` y NO elevan el `epistemicStatus` de la unidad ni entran en
   * `sanitaryAgenda`, `plausibleDeterminants` ni en las señales N2. Máximo una.
   */
  clinicalAssistanceQuestions: UGCAssistanceQuestion[];
  /** Lectura integrada como razonamiento continuo (valores reales). */
  reasoning: string;
  epistemicStatus: IntegratedInterpretationStatus;
  traceability: InterpretationTraceability;
}

/**
 * Cobertura de la base epidemiológica estructurada (N1) sobre la que opera N3.
 * Auditoría (2026-07): N1 recupera principalmente crónicos y cáncer
 * seleccionados, cribados, mortalidad, intervenciones sobre estilos de vida y
 * limitaciones territoriales; deja fuera sociodemografía, desigualdad material,
 * EDO/brotes, estructura de barrios/distritos censales, centros educativos y
 * gran parte de las tablas. Los recuentos se DERIVAN de la lectura estructurada;
 * los vacíos son una lista declarada y trazable (no cifras inventadas).
 */
export interface EpidemiologicalCoverage {
  /** Tablas HTML detectadas en el documento original. */
  detectedTableCount: number;
  /** Tablas reconocidas por el extractor. */
  recognizedTableCount: number;
  /** Tablas reconocidas que llegaron a producir hallazgos estructurados. */
  structuredTableCount: number;
  /** Hallazgos estructurados (no meras menciones textuales). */
  structuredFindingCount: number;
  /** Señales de presencia textual (agenda por conteo de menciones). */
  textualPresenceCount: number;
  /** Dominios epidemiológicos que la base SÍ estructura (derivado). */
  extractionScope: string[];
  /** Dominios omitidos o muy incompletos (declarado por auditoría + derivado). */
  knownGaps: string[];
  /** Grado de completitud de la base respecto al documento original. */
  completeness: "partial" | "substantial" | "unknown";
}

export interface IntegratedInterpretation {
  units: IntegratedInterpretationUnit[];
  /** La desigualdad de escala/desagregación como incertidumbre central. */
  centralUncertainty: string;
  /** Señales locales que no encontraron tema de agenda (no se pierden). */
  unmappedLocalSignalIds: string[];
  /** Cobertura parcial de N1: N3 opera sobre una base no exhaustiva. */
  coverage: EpidemiologicalCoverage;
  /**
   * Advertencia de no exhaustividad (una sola vez, no por hilo): los hilos son
   * construibles con la evidencia estructurada, no la agenda sanitaria completa.
   */
  nonExhaustiveNotice: string;
}

// ── Registro declarativo de temas de interpretación ───────────────────────────
//
// Cada tema declara CÓMO se selecciona su agenda (N1) y su evidencia (N2), y el
// razonamiento que gobierna. El CONTENIDO (hallazgos, valores, señales) procede
// siempre de los datos reales; el marco es específico del tema, no una plantilla
// común repetida.

type InterpretationUse = HealthReportStructuredFinding["interpretationUse"][number];

interface InterpretationTheme {
  id: string;
  title: string;
  question: string;
  questionWithoutLocal?: string;
  /** Espacios de conocimiento del técnico que modulan este tema (autoría humana). */
  spaces: ProfileSpace[];
  /** Usos interpretativos del Informe que constituyen la agenda del tema. */
  agendaUses: InterpretationUse[];
  /** Fragmentos de `topic` del Informe que también entran en la agenda. */
  agendaTopicIncludes: string[];
  /** Sólo hallazgos textual-agenda cuando true (temas casi ausentes del Informe). */
  agendaTextualOnly?: boolean;
  /** Dimensiones de N2 (buildIntegratedSignalSets) que se cruzan. */
  n2Dimensions: string[];
  determinantIncludes: string[];
  capacityIncludes: string[];
  /** Conector del mecanismo (evita muletilla común). */
  mechanismFrame: string;
  mechanismFrameWithoutLocal?: string;
  /** Marco de la lectura territorial específico del tema. */
  territorialFrame: string;
  territorialFrameWithoutLocal?: string;
  /**
   * Variantes inframunicipales (Lote D). El texto base se redacta en clave
   * neutra (municipio/ámbito, «territorio», «zonas»); cuando la identidad es un
   * distrito, se usan estas formas —léxico de barrios/distrito—. Municipio nunca cae al
   * vocabulario inframunicipal.
   */
  questionDistrito?: string;
  territorialFrameDistrito?: string;
}

const THEMES: InterpretationTheme[] = [
  {
    id: "cronicidad-condiciones-de-vida",
    title: "Cronicidad, envejecimiento y condiciones de vida",
    question:
      "¿Qué condiciones cotidianas de movilidad, sedentarismo y alimentación acompañan la carga de cronicidad y envejecimiento que documenta el Informe?",
    questionWithoutLocal:
      "¿Qué información local sobre movilidad, sedentarismo y alimentación falta para contrastar la carga de cronicidad y envejecimiento del territorio?",
    spaces: ["situacion-salud", "determinantes", "contexto-territorial"],
    agendaUses: ["chronicity"],
    agendaTopicIncludes: [],
    n2Dimensions: ["sedentarismo", "actividad-fisica", "alimentacion"],
    determinantIncludes: ["entorno urbano", "socioeconómic"],
    capacityIncludes: ["tejido vecinal"],
    mechanismFrame:
      "La cronicidad no se lee aquí como suma de diagnósticos, sino como expresión de condiciones de vida",
    territorialFrame:
      "La agenda clínica de cronicidad del Informe puede leerse junto a cómo se mueve y se alimenta el territorio",
    territorialFrameDistrito:
      "La agenda clínica de cronicidad del Informe puede leerse junto a cómo se mueve y se alimenta el barrio",
    territorialFrameWithoutLocal:
      "La cronicidad y el envejecimiento plantean una pregunta territorial sobre movilidad, sedentarismo y alimentación todavía no medida localmente",
  },
  {
    id: "apoyo-social-soledad-envejecimiento",
    title: "Apoyo social, soledad y envejecimiento",
    question:
      "¿A quién no llega la red de apoyo, y qué papel juega la soledad no deseada en el envejecimiento del territorio?",
    questionDistrito:
      "¿A quién no llega la red de apoyo, y qué papel juega la soledad no deseada en el envejecimiento del barrio?",
    questionWithoutLocal:
      "¿Qué información local sobre apoyo social, soledad y cuidados falta para comprender el envejecimiento del territorio?",
    spaces: ["activos", "determinantes", "situacion-salud"],
    agendaUses: ["ageing"],
    agendaTopicIncludes: ["envejecimiento y dependencia"],
    n2Dimensions: ["apoyo-social"],
    determinantIncludes: ["envejecimiento", "soledad", "apoyo"],
    capacityIncludes: ["mayores", "tejido vecinal"],
    mechanismFrame:
      "Un apoyo social medio no cierra la cuestión: puede convivir con aislamiento no observado",
    mechanismFrameWithoutLocal:
      "La falta de medición local de apoyo social no cierra la cuestión: puede ocultar aislamiento no observado",
    territorialFrame:
      "El envejecimiento y la dependencia que nombra el Informe se cruzan con el apoyo social medido en la muestra",
    territorialFrameWithoutLocal:
      "El envejecimiento, los cuidados y la dependencia abren una pregunta sobre apoyo social y soledad todavía no medida localmente",
  },
  {
    id: "salud-mental-señal-local",
    title: "Salud mental y malestar: una señal local que requiere contraste",
    question:
      "¿Qué relación hay entre la escasa información estructurada sobre salud mental en la base disponible y la señal que abren GHQ-12, PHQ-9 y PSQI en la muestra local?",
    questionWithoutLocal:
      "¿Qué información local sobre salud mental y descanso falta para contrastar la agenda sanitaria disponible?",
    spaces: ["situacion-salud", "determinantes"],
    agendaUses: [],
    agendaTopicIncludes: ["salud mental"],
    agendaTextualOnly: true,
    n2Dimensions: ["salud-mental", "sueno"],
    determinantIncludes: ["psicosocial"],
    capacityIncludes: ["salud mental"],
    mechanismFrame:
      "El malestar emocional y el mal descanso remiten a condiciones psicosociales cotidianas",
    territorialFrame:
      "La base estructurada disponible ofrece poca información específica sobre salud mental —lo que no prueba que el Informe no la trate—, mientras los estudios locales abren una señal",
    territorialFrameWithoutLocal:
      "La base estructurada disponible ofrece poca información específica sobre salud mental —lo que no prueba que el Informe no la trate— y deja abierta la necesidad de medición local",
  },
  {
    id: "consumos-tabaco-alcohol",
    title: "Consumos de tabaco y alcohol",
    question:
      "¿Qué leen AUDIT-C y Fagerström locales sobre los consumos que el Informe nombra y cuya intervención registra con baja cobertura?",
    questionWithoutLocal:
      "¿Qué magnitud tienen en el territorio los consumos si no existe cribado local que los mida?",
    spaces: ["determinantes", "situacion-salud"],
    agendaUses: [],
    agendaTopicIncludes: ["consumos de tabaco", "dejar el tabaco"],
    n2Dimensions: ["alcohol", "tabaco"],
    determinantIncludes: ["socioeconómic", "consumo"],
    capacityIncludes: ["educación"],
    mechanismFrame:
      "El consumo se lee como práctica situada en condiciones materiales y de oferta, no como decisión individual aislada",
    territorialFrame:
      "El Informe nombra los consumos y registra una cobertura baja de intervención; los cribados locales aportan magnitud exploratoria",
    territorialFrameWithoutLocal:
      "Los consumos quedan como pregunta territorial; la magnitud queda como laguna mientras no exista cribado local",
  },
  {
    id: "alimentacion-sobrepeso",
    title: "Alimentación, sobrepeso y condiciones materiales",
    question:
      "¿Qué condiciones materiales de alimentación acompañan la agenda de sobrepeso, si no hay medición alimentaria local y PREDIMED es contexto provincial?",
    questionWithoutLocal:
      "¿Qué condiciones materiales de alimentación acompañan la agenda de sobrepeso, si no existe medición alimentaria local?",
    spaces: ["determinantes"],
    agendaUses: [],
    agendaTopicIncludes: ["alimentación", "obesidad", "dietético"],
    n2Dimensions: ["alimentacion"],
    determinantIncludes: ["socioeconómic", "consumo"],
    capacityIncludes: ["educación"],
    mechanismFrame:
      "La alimentación conecta hábitos con precio, disponibilidad y margen real de elección",
    territorialFrame:
      "La agenda de sobrepeso del Informe carece de medición alimentaria local; PREDIMED solo contextualiza",
    territorialFrameWithoutLocal:
      "La alimentación y el sobrepeso plantean una pregunta alimentaria que queda abierta mientras no exista medición local",
  },
  {
    id: "prevencion-cribados",
    title: "Prevención y cribados: cobertura desigual y escala",
    question:
      "¿Qué diferencias de cobertura y qué límites de escala muestran las participaciones en cribado leídas por Unidad Asistencial y no por distrito?",
    spaces: ["contexto-territorial", "situacion-salud"],
    agendaUses: ["prevention"],
    agendaTopicIncludes: [],
    n2Dimensions: [],
    determinantIncludes: ["socioeconómic"],
    capacityIncludes: ["educación", "promoción"],
    mechanismFrame:
      "La participación desigual en cribado remite a accesibilidad, información y confianza, no solo a oferta",
    territorialFrame:
      "El Informe documenta participaciones dispares en cribado, siempre a escala de Unidad Asistencial o municipio",
  },
  {
    id: "mortalidad-escala-desigualdad",
    title: "Mortalidad y el límite de escala como desigualdad",
    question:
      "¿Qué desigualdades internas quedan ocultas cuando la mortalidad y la morbilidad solo pueden leerse a escala del conjunto del territorio, no de forma desagregada por sus zonas?",
    questionDistrito:
      "¿Qué desigualdades internas quedan ocultas cuando la mortalidad y la morbilidad solo pueden leerse a escala municipal o de Unidad Asistencial, no de distrito?",
    spaces: ["desigualdades", "situacion-salud"],
    agendaUses: ["sanitary-thread"],
    agendaTopicIncludes: ["mortalidad"],
    n2Dimensions: [],
    determinantIncludes: ["desigualdades internas", "condiciones materiales"],
    capacityIncludes: [],
    mechanismFrame:
      "El promedio municipal puede ocultar diferencias internas de mortalidad y morbilidad",
    territorialFrame:
      "El propio Informe declara que no hay estadísticas fiables desagregadas internamente; la escala es aquí la desigualdad",
    territorialFrameDistrito:
      "El propio Informe declara que no hay estadísticas fiables por barrios; la escala es aquí la desigualdad",
  },
];

function themeForEvidenceState(
  theme: InterpretationTheme,
  hasLocalSignals: boolean
): InterpretationTheme {
  if (hasLocalSignals) return theme;
  return {
    ...theme,
    question: theme.questionWithoutLocal ?? theme.question,
    mechanismFrame: theme.mechanismFrameWithoutLocal ?? theme.mechanismFrame,
    territorialFrame: theme.territorialFrameWithoutLocal ?? theme.territorialFrame,
  };
}

/**
 * Selecciona la variante inframunicipal del tema cuando la identidad territorial
 * es un distrito (Lote D). El texto base ya es neutro (municipio/ámbito); solo el
 * distrito adopta el léxico de barrios/distrito. Debe aplicarse ANTES de
 * `themeForEvidenceState`, para que la variante «sin evidencia local» —siempre
 * neutra— tenga prioridad cuando corresponda.
 */
function themeForScope(
  theme: InterpretationTheme,
  scope: TerritorialLexicon["scope"]
): InterpretationTheme {
  if (scope !== "distrito") return theme;
  return {
    ...theme,
    question: theme.questionDistrito ?? theme.question,
    territorialFrame: theme.territorialFrameDistrito ?? theme.territorialFrame,
  };
}

// ── Utilidades de selección ───────────────────────────────────────────────────

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function incluyeAlguno(texto: string, fragmentos: string[]): boolean {
  const t = normalizar(texto);
  return fragmentos.some((f) => t.includes(normalizar(f)));
}

function findingsDelTema(
  base: HealthReportStructuredReading,
  theme: InterpretationTheme
): HealthReportStructuredFinding[] {
  return base.findings.filter((f) => {
    if (theme.agendaTextualOnly && f.kind !== "textual-agenda") {
      // Para temas casi ausentes, solo cuenta la agenda textual del propio tema.
      return false;
    }
    const porUso = theme.agendaUses.some((u) => f.interpretationUse.includes(u));
    const porTopic = incluyeAlguno(f.topic, theme.agendaTopicIncludes);
    return porUso || porTopic;
  });
}

function presenciaAgenda(
  findings: HealthReportStructuredFinding[]
): SanitaryAgendaPresence {
  // Sin hallazgo estructurado NO es "no documentado": es "no evaluable con la
  // representación disponible" (puede estar en tablas no estructuradas).
  if (findings.length === 0) return "not-structured";
  const hayDocumentado = findings.some(
    (f) =>
      f.interpretationStatus === "documented-fact" ||
      f.interpretationStatus === "document-authored-interpretation"
  );
  return hayDocumentado ? "documented" : "textual-only";
}

// ── Cobertura de la base estructurada (derivada, no inventada) ────────────────

// Dominios omitidos o muy incompletos según la auditoría independiente de N1.
// Vacíos que PERSISTEN tras el Incremento 4. La demografía, la desigualdad
// material, la EDO/brotes y la correspondencia territorial se recuperaron de
// forma PARCIAL (municipal-proxy o recuentos absolutos), por lo que sus lagunas
// se reformulan como estructurales, no como ausencia total.
// Laguna de desagregación territorial: su redacción depende de la identidad del
// ámbito (Lote D). Para un distrito reproduce el texto canónico («distrital y por
// barrios»); para un municipio no puede afirmarse ausencia de desagregación
// inframunicipal como si fuera un distrito.
function territorialDisaggregationGap(lex: TerritorialLexicon): string {
  const eje = lex.scope === "distrito" ? "distrital y por barrios" : "interna por zonas";
  return `desagregación ${eje} de sociodemografía y desigualdad (los datos recuperados son de escala municipal, proxy)`;
}

const AUDITED_KNOWN_GAPS = [
  "denominadores y tasas de EDO y brotes (los recuentos recuperados son absolutos)",
  "renta, vulnerabilidad y composición social detalladas por sección censal",
  "gran parte de las tablas municipales no priorizadas (natalidad, extranjería, etc.)",
  "inventarios de recursos y centros educativos (fuera de alcance de este incremento)",
  "tablas detectadas con semántica no estructurable de forma fiable",
];

// kind del hallazgo estructurado → etiqueta de dominio cubierto.
const KIND_A_DOMINIO: Record<string, string> = {
  "clinical-indicator": "crónicos y cáncer seleccionados",
  screening: "cribados",
  mortality: "mortalidad",
  "territorial-comparison": "comparaciones territoriales",
  "health-behaviour-intervention": "intervenciones sobre estilos de vida",
  "declared-limitation": "limitaciones territoriales declaradas",
  // Incremento 4 — dominios recuperados (parciales).
  "demographic-indicator": "estructura demográfica municipal (envejecimiento, dependencia, edad)",
  "material-inequality-indicator": "desigualdad material municipal (desempleo, bienestar)",
  "epidemiological-event": "EDO, alertas y brotes (recuentos absolutos)",
};

function buildCoverage(
  base: HealthReportStructuredReading,
  lex: TerritorialLexicon
): EpidemiologicalCoverage {
  const structuredFindings = base.findings.filter(
    (f) => f.kind !== "textual-agenda"
  );
  const textualPresenceCount = base.findings.length - structuredFindings.length;
  const detectedTableCount = base.originalTableCount ?? base.tables.length;
  // Reconocida = el extractor le asignó un tema; estructurada = además produjo
  // hallazgos (su referencia aparece en algún finding). Detectar ≠ reconocer ≠
  // estructurar.
  const recognizedTables = base.tables.filter(
    (t) => t.recognizedTopic !== undefined
  );
  const recognizedTableCount = recognizedTables.length;
  const referenciasConHallazgo = new Set(
    base.findings
      .map((f) => f.source.tableReference)
      .filter((r): r is string => r !== undefined)
  );
  const structuredTableCount = recognizedTables.filter((t) =>
    referenciasConHallazgo.has(t.tableReference)
  ).length;

  const extractionScope = [
    ...new Set(
      structuredFindings
        .map((f) => KIND_A_DOMINIO[f.kind])
        .filter((d): d is string => d !== undefined)
    ),
  ];

  // Vacío derivado: tablas detectadas que no llegaron a estructurarse.
  const tablasNoEstructuradas = detectedTableCount - structuredTableCount;
  const knownGaps = [
    ...(tablasNoEstructuradas > 0
      ? [
          `${tablasNoEstructuradas} de ${detectedTableCount} tablas detectadas no se estructuraron`,
        ]
      : []),
    territorialDisaggregationGap(lex),
    ...AUDITED_KNOWN_GAPS,
  ];

  // La completitud NO se decide solo por número de tablas: mientras persistan
  // vacíos estructurales (escala municipal-proxy, recuentos sin denominador,
  // desagregación distrital ausente) la base sigue siendo parcial aunque suba el
  // número de tablas estructuradas. No se asciende a «substantial» de forma
  // automática solo porque aumenten los hallazgos.
  const ratio =
    detectedTableCount > 0 ? structuredTableCount / detectedTableCount : 0;
  const sinVaciosEstructurales = knownGaps.length === 0;
  const completeness: EpidemiologicalCoverage["completeness"] =
    !base.present || detectedTableCount === 0
      ? "unknown"
      : ratio >= 0.75 && sinVaciosEstructurales
        ? "substantial"
        : "partial";

  return {
    detectedTableCount,
    recognizedTableCount,
    structuredTableCount,
    structuredFindingCount: structuredFindings.length,
    textualPresenceCount,
    extractionScope,
    knownGaps,
    completeness,
  };
}

function toSignalRef(
  s: IntegratedHealthProfileSignal,
  lex: TerritorialLexicon
): InterpretationSignalRef {
  return {
    id: s.id,
    label: s.senal,
    value: s.valor,
    scale: s.escala,
    esLocal: s.esLocal,
    sampleSize: s.tamanoMuestra,
    caution: s.esLocal
      ? `muestra exploratoria, no representativa ni estimación poblacional ${lex.delScope}; requiere contraste comunitario`
      : `contexto provincial/externo, no estimación ${lex.escalaFinaAdj}`,
  };
}

function determinantesDelTema(
  answers: DiagnosticAnswers,
  theme: InterpretationTheme
): typeof answers.determinantes {
  return answers.determinantes.filter(
    (d) =>
      (d.kind === "plausible" ||
        d.kind === "a-contrastar" ||
        d.kind === "no-evaluable") &&
      incluyeAlguno(d.enunciado, theme.determinantIncludes)
  );
}

/**
 * Conocimiento de autoría humana del técnico (porEspacio) que modula el tema.
 * Cada pieza se consume UNA vez (registro compartido), para que la
 * interpretación, la hipótesis o la pregunta abierta del equipo no se repitan
 * en varias unidades. Se distingue su estatus: interpretación = autoría
 * documentada; hipótesis = plausible a contrastar; laguna = pregunta abierta.
 */
interface HumanKnowledgeLedger {
  interpretaciones: Set<string>;
  hipotesis: Set<string>;
  lagunas: Set<string>;
}

function conocimientoHumanoDelTema(
  answers: DiagnosticAnswers,
  theme: InterpretationTheme,
  ledger: HumanKnowledgeLedger
): {
  interpretaciones: string[];
  hipotesis: string[];
  lagunas: string[];
} {
  const bloques = theme.spaces
    .map((espacio) => answers.porEspacio[espacio])
    .filter((b): b is NonNullable<typeof b> => b !== undefined);

  const interpretaciones = bloques
    .flatMap((b) => b.interpretaciones)
    .filter((i) => !ledger.interpretaciones.has(i.enunciado))
    .map((i) => {
      ledger.interpretaciones.add(i.enunciado);
      return i.enunciado;
    });
  const hipotesis = bloques
    .flatMap((b) => b.hipotesis)
    .filter((h) => !ledger.hipotesis.has(h.enunciado))
    .map((h) => {
      ledger.hipotesis.add(h.enunciado);
      return h.enunciado;
    });
  const lagunas = bloques
    .flatMap((b) => b.lagunas)
    .filter((l) => !ledger.lagunas.has(l.formulacion))
    .map((l) => {
      ledger.lagunas.add(l.formulacion);
      return l.formulacion;
    });

  return { interpretaciones, hipotesis, lagunas };
}

function capacidadesDelTema(
  answers: DiagnosticAnswers,
  theme: InterpretationTheme
): string[] {
  return answers.salutogenica.grupos
    .filter((g) => incluyeAlguno(g.ambito, theme.capacityIncludes))
    .map((g) => g.ambito);
}

// Una magnitud representativa, nunca la tabla completa. Prioriza valores
// numéricos limpios (tasas, %, ‰); si el Informe solo trae comparaciones
// cualitativas, resume por temas en vez de arrastrar el texto crudo.
function esValorNumericoLimpio(f: HealthReportStructuredFinding): boolean {
  if (typeof f.value === "number") return true;
  if (typeof f.value !== "string") return false;
  const unidad = normalizar(f.unit ?? "");
  if (unidad.includes("cualitativa")) return false;
  return /^\s*\d/.test(f.value);
}

function formatCount(
  count: number,
  singular: string,
  plural: string
): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function magnitudeNote(
  findings: HealthReportStructuredFinding[]
): string | undefined {
  const documentados = findings.filter((f) => f.kind !== "textual-agenda");
  if (documentados.length === 0) {
    const textual = findings.find((f) => f.kind === "textual-agenda");
    return textual !== undefined
      ? `presencia textual (${String(textual.value)} menciones)`
      : undefined;
  }
  const numericos = documentados.filter(esValorNumericoLimpio);
  if (numericos.length > 0) {
    const muestra = numericos.slice(0, 2).map((f) => {
      const unidad = f.unit !== undefined ? ` ${f.unit}` : "";
      return `${f.topic} ${String(f.value)}${unidad}`.replace(/\s+/g, " ").trim();
    });
    const extra =
      documentados.length > numericos.slice(0, 2).length
        ? ` (y ${formatCount(documentados.length - muestra.length, "indicador más", "indicadores más")} en el Informe)`
        : "";
    return `${muestra.join("; ")}${extra}`;
  }
  // Sin magnitud numérica limpia: resumen por temas, sin copiar el texto crudo.
  const temas = [...new Set(documentados.map((f) => f.topic))].slice(0, 3);
  const extra =
    documentados.length > temas.length
      ? ` y otros indicadores del Informe`
      : "";
  return `${temas.join(", ")}${extra}`;
}

// ── Estatus epistemológico del cruce ──────────────────────────────────────────

function estatusUnidad(input: {
  presence: SanitaryAgendaPresence;
  hasLocal: boolean;
  hasDeterminant: boolean;
}): IntegratedInterpretationStatus {
  const { presence, hasLocal, hasDeterminant } = input;
  if (presence === "documented" && hasLocal) return "integrated-interpretation";
  if (presence === "textual-only" && hasLocal) return "open-question";
  if (hasLocal || (presence === "documented" && hasDeterminant)) {
    return "integrated-interpretation";
  }
  if (hasDeterminant) return "plausible-hypothesis";
  return "open-question";
}

// ── Composición del razonamiento (valores reales, marco por tema) ─────────────

function frase(...partes: Array<string | undefined>): string {
  return partes.filter((p) => p !== undefined && p.length > 0).join(" ");
}

function tramoAgenda(
  theme: InterpretationTheme,
  presence: SanitaryAgendaPresence,
  note: string | undefined,
  lex: TerritorialLexicon
): string {
  if (presence === "textual-only") {
    return frase(
      `${theme.territorialFrame}:`,
      note !== undefined ? `${note}.` : "solo consta como presencia textual.",
      "El conteo de menciones orienta exploración; no mide cobertura",
      "epidemiológica ni prevalencia."
    );
  }
  if (presence === "documented") {
    return frase(
      `${theme.territorialFrame}.`,
      note !== undefined
        ? `El Informe documenta ${note} —a su escala, ${lex.sinDesagregacionInterna}—.`
        : undefined
    );
  }
  return frase(
    `${theme.territorialFrame},`,
    "aunque la base estructurada disponible no aporta un hallazgo específico",
    "—lo que no equivale a ausencia en el Informe ni a ausencia del problema—."
  );
}

function tramoLocal(
  local: InterpretationSignalRef[],
  corroborating: InterpretationSignalRef[],
  lex: TerritorialLexicon
): string | undefined {
  if (local.length === 0) return undefined;
  const principal = local[0];
  const otras = [...local.slice(1), ...corroborating].slice(0, 2);
  const base =
    `La evidencia local que ayuda a leerla es «${principal.label}» ` +
    `(${principal.value}, ${principal.scale}): señal exploratoria, no prevalencia ${lex.escalaFinaAdj}.`;
  if (otras.length === 0) return base;
  const listadas = otras.map((s) => `«${s.label}» (${s.value})`).join(", ");
  return frase(
    base,
    `Apuntan en la misma dirección, sin confundirse con ella, ${listadas}.`
  );
}

function tramoContexto(
  contextual: InterpretationSignalRef[],
  lex: TerritorialLexicon
): string | undefined {
  if (contextual.length === 0) return undefined;
  const listadas = contextual
    .slice(0, 2)
    .map((s) => `«${s.label}» (${s.value})`)
    .join(", ");
  return `Como contexto, no como medición ${lex.escalaFinaAdj}, ${listadas}.`;
}

function tramoHumano(input: {
  interpretaciones: string[];
  hipotesis: string[];
}): string | undefined {
  const partes: string[] = [];
  if (input.interpretaciones.length > 0) {
    partes.push(
      `La lectura del equipo técnico orienta este hilo: ${input.interpretaciones[0]}`
    );
  }
  if (input.hipotesis.length > 0) {
    partes.push(
      `El equipo lo plantea como hipótesis a contrastar, no como hecho: ${input.hipotesis[0]}`
    );
  }
  return partes.length > 0 ? partes.join(" ") : undefined;
}

function tramoMecanismo(
  theme: InterpretationTheme,
  determinantes: string[]
): string {
  if (determinantes.length === 0) {
    return `${theme.mechanismFrame}; el mecanismo concreto queda por contrastar con el territorio.`;
  }
  return `${theme.mechanismFrame}: ${determinantes[0]}. Es un mecanismo plausible, no una causa demostrada.`;
}

function tramoCapacidad(capacidades: string[]): string | undefined {
  if (capacidades.length === 0) return undefined;
  return (
    `El territorio aporta capacidades para explorar respuestas —${capacidades.join(", ")}—, ` +
    `potenciales mientras no se conozca su acceso, uso y resultado.`
  );
}

function tramoIncertidumbre(items: string[]): string | undefined {
  if (items.length === 0) return undefined;
  // El prefijo "Lo que no puede saberse todavía:" duplicaba "no puede saberse"
  // cuando la nota de desigualdad ya lo contiene, y actuaba como etiqueta
  // de plantilla. La prosa fluye directamente desde la declaración.
  const sentence = items[0].trim();
  if (sentence.length === 0) return undefined;
  const capitalized = sentence.charAt(0).toUpperCase() + sentence.slice(1);
  return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`;
}

function componerRazonamiento(input: {
  theme: InterpretationTheme;
  presence: SanitaryAgendaPresence;
  note: string | undefined;
  local: InterpretationSignalRef[];
  corroborating: InterpretationSignalRef[];
  contextual: InterpretationSignalRef[];
  determinantes: string[];
  capacidades: string[];
  incertidumbres: string[];
  interpretaciones: string[];
  hipotesis: string[];
  lex: TerritorialLexicon;
}): string {
  return frase(
    tramoAgenda(input.theme, input.presence, input.note, input.lex),
    tramoLocal(input.local, input.corroborating, input.lex),
    tramoContexto(input.contextual, input.lex),
    tramoHumano({
      interpretaciones: input.interpretaciones,
      hipotesis: input.hipotesis,
    }),
    tramoMecanismo(input.theme, input.determinantes),
    tramoIncertidumbre(input.incertidumbres),
    tramoCapacidad(input.capacidades)
  );
}

// ── Constructor principal ─────────────────────────────────────────────────────

export function buildIntegratedInterpretation(
  answers: DiagnosticAnswers
): IntegratedInterpretation {
  const base = answers.sanitaria.baseEpidemiologica;
  const lex = answers.territorial;
  const signalSets = buildIntegratedSignalSets(answers);
  const setPorDimension = new Map<string, IntegratedSignalSet>(
    signalSets.map((s) => [s.dimension, s])
  );

  const centralUncertainty =
    base.limitations[0] ??
    "El diagnóstico no dispone de desagregación interna " +
      `${lex.ejesDesagregacionAusente}: la desigualdad no se observa, no se ` +
      "descarta.";

  const usadas = new Set<string>();
  const humanLedger: HumanKnowledgeLedger = {
    interpretaciones: new Set(),
    hipotesis: new Set(),
    lagunas: new Set(),
  };
  const units: IntegratedInterpretationUnit[] = [];

  for (const theme of THEMES) {
    const findings = findingsDelTema(base, theme);
    const presence = presenciaAgenda(findings);
    if (presence === "not-structured" && theme.n2Dimensions.length === 0) {
      continue; // sin base estructurada ni evidencia propia: no se fuerza unidad
    }

    const sets = theme.n2Dimensions
      .map((d) => setPorDimension.get(d))
      .filter((s): s is IntegratedSignalSet => s !== undefined);

    const localSignals: InterpretationSignalRef[] = [];
    const corroboratingSignals: InterpretationSignalRef[] = [];
    const contextualSignals: InterpretationSignalRef[] = [];
    for (const set of sets) {
      // Primacía local: la principal local encabeza; si la principal es proxy,
      // pasa a contexto (nunca desplaza una local que no exista).
      if (set.primary.esLocal) {
        localSignals.push(toSignalRef(set.primary, lex));
      } else {
        contextualSignals.push(toSignalRef(set.primary, lex));
      }
      for (const s of set.corroborating) {
        (s.esLocal ? corroboratingSignals : contextualSignals).push(
          toSignalRef(s, lex)
        );
      }
      for (const s of set.contextual) contextualSignals.push(toSignalRef(s, lex));
      set.all.forEach((s) => usadas.add(s.id));
    }

    const determinantes = determinantesDelTema(answers, theme);
    const determinantStatements = determinantes.map((d) => d.enunciado);
    const capacidades = capacidadesDelTema(answers, theme);
    const humano = conocimientoHumanoDelTema(answers, theme, humanLedger);

    // Incertidumbres: la laguna específica de la señal local principal, la
    // limitación de escala del Informe cuando aplica, y la muestra pequeña.
    const incertidumbres: string[] = [];
    if (localSignals.length === 0 && presence !== "textual-only") {
      incertidumbres.push(
        "no hay medición local directa de esta agenda; la lectura descansa en contexto e hipótesis"
      );
    }
    if (localSignals.length > 0) {
      const set = sets.find((x) => x.primary.esLocal);
      if (set !== undefined) {
        // El tamaño de muestra ya se declara junto a la señal local en la
        // lectura; aquí va solo la laguna de equidad, sin duplicarlo.
        incertidumbres.push(set.primary.desigualdad.nota);
      }
    }
    if (
      findings.some((f) => f.geography.isProxyForTargetTerritory) ||
      theme.id === "mortalidad-escala-desigualdad"
    ) {
      incertidumbres.push(centralUncertainty);
    }
    const noEvaluable = determinantes.find((d) => d.kind === "no-evaluable");
    if (noEvaluable !== undefined) {
      incertidumbres.push(
        `queda como laguna declarada: ${noEvaluable.enunciado}`
      );
    }
    for (const laguna of humano.lagunas) {
      incertidumbres.push(`pregunta abierta del equipo: ${laguna}`);
    }

    const inequalitiesOrUncertainties = [...new Set(incertidumbres)];

    const note = magnitudeNote(findings);
    const epistemicStatus = estatusUnidad({
      presence,
      hasLocal: localSignals.length > 0,
      hasDeterminant:
        determinantes.some(
          (d) => d.kind === "plausible" || d.kind === "a-contrastar"
        ) ||
        humano.interpretaciones.length > 0 ||
        humano.hipotesis.length > 0,
    });

    // Primero la identidad territorial (distrito adopta el léxico inframunicipal),
    // luego el estado de evidencia (la variante «sin evidencia local» es neutra).
    const scopedTheme = themeForScope(theme, lex.scope);
    const reasoningTheme = themeForEvidenceState(
      scopedTheme,
      localSignals.length > 0
    );

    const reasoning = componerRazonamiento({
      theme: reasoningTheme,
      presence,
      note,
      local: localSignals,
      corroborating: corroboratingSignals,
      contextual: contextualSignals,
      determinantes: determinantes
        .filter((d) => d.kind === "plausible" || d.kind === "a-contrastar")
        .map((d) => d.enunciado),
      capacidades,
      incertidumbres: inequalitiesOrUncertainties,
      interpretaciones: humano.interpretaciones,
      hipotesis: humano.hipotesis,
      lex,
    });

    // La pregunta abierta del equipo, cuando existe, gobierna la unidad; si no,
    // la pregunta de razonamiento del tema.
    const question = humano.lagunas[0] ?? reasoningTheme.question;

    const sanitarySources = [
      ...new Set(
        findings
          .map((f) => f.source.sectionTitle ?? f.source.tableReference)
          .filter((x): x is string => x !== undefined)
      ),
    ];

    units.push({
      id: theme.id,
      title: theme.title,
      question,
      sanitaryAgenda: {
        topics: [...new Set(findings.map((f) => f.topic))].slice(0, 6),
        presence,
        magnitudeNote: note,
      },
      localSignals,
      corroboratingSignals,
      contextualSignals,
      plausibleDeterminants: determinantStatements,
      inequalitiesOrUncertainties,
      salutogenicCapacities: capacidades,
      limitations: [
        ...new Set(findings.flatMap((f) => f.limitations)),
      ].slice(0, 4),
      documentAuthoredInterpretations: humano.interpretaciones,
      plausibleHypotheses: humano.hipotesis,
      openHumanQuestions: humano.lagunas,
      // N1b se consume como preguntas pre-construidas por la capa intermedia; N3
      // NO recorre las 384 señales. Máximo una pregunta por unidad.
      clinicalAssistanceQuestions: (answers.ugcAssistanceQuestions ?? [])
        .filter((q) => q.unitId === theme.id)
        .slice(0, 1),
      reasoning,
      epistemicStatus,
      traceability: {
        sanitaryFindingIds: findings.map((f) => f.id),
        sanitarySources,
        localSignalIds: localSignals.map((s) => s.id),
        corroboratingSignalIds: corroboratingSignals.map((s) => s.id),
        contextualSignalIds: contextualSignals.map((s) => s.id),
        determinantStatements,
        capacityAmbitos: capacidades,
        sanitaryFindingStatuses: [
          ...new Set(findings.map((f) => f.interpretationStatus)),
        ],
      },
    });
  }

  // Señales locales que no encontraron tema: se registran para no perderlas.
  const localesTotales = signalSets
    .flatMap((s) => s.all)
    .filter((s) => s.esLocal)
    .map((s) => s.id);
  const unmappedLocalSignalIds = [...new Set(localesTotales)].filter(
    (id) => !usadas.has(id)
  );

  const coverage = buildCoverage(base, lex);
  const complementaryScope =
    answers.estudios.totalStudies > 0
      ? "y con los estudios incorporados"
      : "sin estudios complementarios incorporados en este expediente";
  const nonExhaustiveNotice =
    "Estos hilos se construyen con la parte del Informe actualmente " +
    `estructurada, ${complementaryScope}. No son una reproducción ` +
    "exhaustiva de todo el contenido epidemiológico del documento original: " +
    "la base estructurada es parcial y hay tablas y dominios aún no extraídos.";

  return {
    units,
    centralUncertainty,
    unmappedLocalSignalIds,
    coverage,
    nonExhaustiveNotice,
  };
}
