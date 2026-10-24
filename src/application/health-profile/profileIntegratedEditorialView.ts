import type { DiagnosticAnswers } from "./diagnosticAnswers";
import type { ProfileSpace } from "../../domain/health-profile";
import {
  buildIntegratedProfileSignals,
  type IntegratedHealthProfileSignal,
} from "./integratedProfileSignals";
import {
  buildDiagnosticVisuals,
  type EvidenceVariant,
  type GrupoMotorCard,
  type TrazadorRow,
} from "./profileDiagnosticVisuals";
import {
  buildMatrizAnexo,
  buildProfileSynthesis,
  type MatrizAnexo,
} from "./profileSynthesisView";
import { DIAGNOSTIC_ENGINE_QUESTIONS } from "./profileWritingContract";
import {
  buildIntegratedInterpretation,
  type IntegratedInterpretation,
  type IntegratedInterpretationUnit,
  type IntegratedInterpretationStatus,
} from "./integratedInterpretation";
import { selectVisibleUGCAssistanceQuestions } from "../ugc-clinical-assistance";
import type { TerritorialLexicon } from "./territorialGrammar";

export interface ProfileIntegratedEditorialHeader {
  title: string;
  subtitle: string;
  territory: string;
  status: string;
  scale: string;
  sources: string[];
  generatedDate?: string;
}

export interface ProfileIntegratedEditorialOverviewMessage {
  id: string;
  title: string;
  text: string;
  signal: string;
  source: string;
  variant: EvidenceVariant;
}

export interface ProfileIntegratedEditorialSourceBlock {
  id: "informe" | "estudios" | "activos" | `documento-territorial:${string}`;
  title: string;
  whatItAdds: string;
  whatItDoesNotAllow: string;
  variant: EvidenceVariant;
}

export interface ProfileIntegratedEditorialReadingBlock {
  id: string;
  title: string;
  signal: string;
  source: string;
  scale: string;
  reading: string;
  mechanism: string;
  exclusion: string;
  groupMotorQuestion: string;
  motorQuestion: string;
  variant: EvidenceVariant;
  /** Estatus del cruce (N3), cuando la lectura procede de la interpretación integrada. */
  epistemicStatus?: IntegratedInterpretationStatus;
  /**
   * Pregunta de contraste asistencial (N1b), si la unidad converge con una señal
   * UGC. Es una pregunta, no un resultado; máximo una por hilo.
   */
  clinicalAssistanceQuestion?: string;
}

export interface ProfileIntegratedEditorialClosingColumn {
  id: "sabemos" | "contrastar" | "no-confundir";
  title: string;
  items: string[];
}

export interface ProfileIntegratedDiagnosticSynthesis {
  id: "diagnostic-synthesis";
  title: string;
  thesis: string;
  interpretiveWeight: string;
  caution: string;
  contrastQuestions: string[];
  traceability: {
    unitIds: string[];
    localSignalIds: string[];
    contextualSignalIds: string[];
    statusCounts: Record<IntegratedInterpretationStatus, number>;
  };
}

export interface ProfileIntegratedEditorialTechnicalAnnex {
  title: string;
  summary: string;
  tracerRows: TrazadorRow[];
  matrix: MatrizAnexo;
  documentarySourceBlocks?: ProfileIntegratedEditorialSourceBlock[];
}

export interface ProfileIntegratedEditorialView {
  header: ProfileIntegratedEditorialHeader;
  overview: ProfileIntegratedEditorialOverviewMessage[];
  sourceBlocks: ProfileIntegratedEditorialSourceBlock[];
  territorialReadings: ProfileIntegratedEditorialReadingBlock[];
  /** Interpretación integrada (Nivel 3) que gobierna la lectura principal. */
  interpretation: IntegratedInterpretation;
  /** Síntesis interpretativa derivada de los hilos N3, sin recomendar medidas. */
  diagnosticSynthesis: ProfileIntegratedDiagnosticSynthesis;
  tracerTable: TrazadorRow[];
  groupMotorAgenda: GrupoMotorCard[];
  closing: ProfileIntegratedEditorialClosingColumn[];
  technicalAnnex: ProfileIntegratedEditorialTechnicalAnnex;
}

export interface BuildProfileIntegratedEditorialViewOptions {
  territory: string;
  status: string;
  informeTitulo?: string;
  generatedDate?: string;
}

interface ReadingDefinition {
  id: string;
  title: string;
  variant: EvidenceVariant;
  spaces: ProfileSpace[];
  motorQuestionIndexes: number[];
  preferredSignalIds?: string[];
  preferredAgendaId?: string;
  capacityMatches: string[];
  signalMatches: string[];
  agendaMatches: string[];
  territorialImplication: string;
  mechanismFallback: string;
  capacityFrame: string;
  diagnosticConclusion: string;
}

interface HumanKnowledgeSelection {
  interpretation?: {
    enunciado: string;
    certeza: string;
    autorNombre: string;
  };
  hypothesis?: {
    enunciado: string;
    plausibilidad: string;
    preguntasResolutoras: string[];
  };
  openQuestion?: {
    formulacion: string;
    relevancia: string;
    urgencia: string;
  };
}

interface TerritorialDiagnosticReasoning {
  id: string;
  title: string;
  motorQuestion: string;
  signal: IntegratedHealthProfileSignal;
  source: string;
  scale: string;
  value: string;
  mechanism: string;
  exclusion: string;
  groupMotorQuestion: string;
  human: HumanKnowledgeSelection;
  territorialImplication: string;
  capacity?: string;
  capacityFrame: string;
  diagnosticConclusion: string;
  variant: EvidenceVariant;
}

const READING_DEFINITIONS: ReadingDefinition[] = [
  {
    id: "salud-sanitaria-partida",
    title: "Salud sanitaria de partida",
    variant: "informe",
    spaces: ["situacion-salud", "contexto-territorial"],
    motorQuestionIndexes: [0, 1, 3],
    signalMatches: ["informe-"],
    agendaMatches: ["desigualdad"],
    capacityMatches: ["cuidados", "atencion sanitaria", "salud mental"],
    territorialImplication:
      "El Informe sostiene el objeto salud del Perfil y coloca la conversación en torno a problemas, factores y necesidades sanitarias antes de abrir la explicación social.",
    mechanismFallback:
      "relación entre los problemas tratados por el Informe y las condiciones cotidianas que pueden modular bienestar o malestar",
    capacityFrame:
      "Las capacidades sanitarias y comunitarias solo entran aquí como soporte posible del diagnóstico",
    diagnosticConclusion:
      "el hilo sanitario queda fijado como punto de partida, no como prevalencia local ni como mandato de intervención",
  },
  {
    id: "sueno-malestar-vida-cotidiana",
    title: "Sueño, malestar y vida cotidiana",
    variant: "estudio",
    spaces: ["situacion-salud", "determinantes", "desigualdades"],
    motorQuestionIndexes: [2, 4, 5, 7],
    preferredSignalIds: ["trazador-sueno-insuficiente"],
    preferredAgendaId: "sueno-malestar",
    capacityMatches: ["salud mental", "bienestar emocional", "cuidados"],
    signalMatches: ["sueno", "sf12", "ghq", "phq", "malestar"],
    agendaMatches: ["sueno", "malestar"],
    territorialImplication:
      "El descanso insuficiente desplaza la lectura desde la conducta individual hacia la organización cotidiana del tiempo, los cuidados, el trabajo y la vivienda.",
    mechanismFallback:
      "cargas psicosociales, tiempos de cuidado y condiciones residenciales que pueden afectar al descanso",
    capacityFrame:
      "Los recursos de bienestar emocional o cuidados serían capacidad potencial si son conocidos, accesibles y usados",
    diagnosticConclusion:
      "el descanso queda como señal de vida diaria que necesita experiencia territorial para entender a quién afecta y por qué",
  },
  {
    id: "actividad-sedentarismo-entorno",
    title: "Actividad física, sedentarismo y entorno urbano",
    variant: "estudio",
    spaces: ["contexto-territorial", "determinantes", "desigualdades"],
    motorQuestionIndexes: [2, 4, 5, 7],
    preferredSignalIds: ["trazador-ipaq-inactividad", "trazador-sbq-sedentario"],
    preferredAgendaId: "sedentarismo-entorno",
    capacityMatches: ["vida activa", "actividad fisica", "tejido vecinal"],
    signalMatches: ["actividad", "sedentarismo", "ipaq", "sbq", "entorno"],
    agendaMatches: ["sedentarismo", "entorno", "actividad"],
    territorialImplication:
      "La inactividad en tiempo libre lleva la pregunta al entorno: seguridad, accesibilidad, autonomía, horarios y posibilidad real de usar el espacio público.",
    mechanismFallback:
      "entorno urbano, tiempos disponibles y barreras de movilidad que pueden limitar la vida activa",
    capacityFrame:
      "Los activos de vida activa importan como capacidad potencial, no como prueba de que el entorno sea accesible",
    diagnosticConclusion:
      "el movimiento cotidiano queda formulado como relación entre cuerpo, tiempo y lugar, pendiente de contraste comunitario",
  },
  {
    id: "apoyo-social-soledad-envejecimiento",
    title: "Apoyo social, soledad y envejecimiento",
    variant: "activo",
    spaces: ["activos", "determinantes", "desigualdades", "preparacion-deliberativa"],
    motorQuestionIndexes: [3, 6, 7, 8],
    preferredSignalIds: ["trazador-duke-apoyo-global"],
    preferredAgendaId: "soledad-envejecimiento",
    capacityMatches: ["mayores", "envejecimiento", "tejido vecinal", "participacion"],
    signalMatches: ["apoyo", "duke", "soledad", "envejecimiento"],
    agendaMatches: ["soledad", "envejecimiento", "apoyo"],
    territorialImplication:
      "Un apoyo social agregado alto puede convivir con soledad no observada; esa tensión territorial cruza red, envejecimiento, cuidados y accesibilidad real a recursos.",
    mechanismFallback:
      "envejecimiento y riesgo de soledad no deseada como eje territorial que necesita contraste",
    capacityFrame:
      "Los recursos para mayores o tejido comunitario son capacidad potencial mientras no se conozca acceso, uso y reconocimiento",
    diagnosticConclusion:
      "el apoyo social no cierra la cuestión: mantiene como hipótesis la relación entre red declarada, aislamiento posible y capacidad comunitaria",
  },
  {
    id: "alimentacion-consumos-condiciones",
    title: "Alimentación, consumos y condiciones materiales",
    variant: "estudio",
    spaces: ["determinantes", "desigualdades", "situacion-salud"],
    motorQuestionIndexes: [2, 4, 5, 7],
    preferredSignalIds: ["trazador-predimed-adherencia", "trazador-cage-riesgo"],
    preferredAgendaId: "consumos-alimentacion",
    capacityMatches: ["adicciones", "educacion", "promocion"],
    signalMatches: ["aliment", "consumo", "predimed", "audit", "cage"],
    agendaMatches: ["consumo", "aliment"],
    territorialImplication:
      "Alimentación y consumos conectan hábitos con precio, disponibilidad, renta, redes domésticas y margen real de elección.",
    mechanismFallback:
      "condiciones materiales de consumo y alimentación que pueden facilitar o restringir opciones saludables",
    capacityFrame:
      "Los recursos educativos o preventivos solo son capacidad si llegan a los hogares y grupos que afrontan más restricción",
    diagnosticConclusion:
      "el hilo queda como lectura material de hábitos y consumos, no como juicio sobre decisiones individuales",
  },
];

const OVERVIEW_TITLES: Record<string, string> = {
  "hilo-sanitario": "Agenda sanitaria de partida",
  "vida-cotidiana": "Vida cotidiana",
  "apoyo-envejecimiento": "Apoyo y envejecimiento",
  "bienestar-escolar": "Bienestar escolar",
  capacidades: "Capacidades comunitarias",
  "equidad-abierta": "Equidad pendiente",
};

function unique(values: string[]): string[] {
  return [...new Set(values.filter((v) => v.trim().length > 0))];
}

function humanSource(fuente: string): string {
  return fuente.replace(/\s+—\s+\S+\.csv\b/g, "").trim();
}

function normalized(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function includesAny(text: string, matches: string[]): boolean {
  const value = normalized(text);
  return matches.some((match) => value.includes(normalized(match)));
}

function signalText(signal: IntegratedHealthProfileSignal): string {
  return [
    signal.id,
    signal.senal,
    signal.fuente,
    signal.escala,
    signal.valor,
    signal.mecanismoPlausible ?? "",
    signal.activoRelacionado ?? "",
  ].join(" ");
}

function agendaText(card: GrupoMotorCard): string {
  return [card.id, card.tema, card.senal, card.mecanismo].join(" ");
}

function signalVariant(signal: IntegratedHealthProfileSignal): EvidenceVariant {
  if (signal.esMencionTextual) return "informe";
  if (signal.esProxy) return "proxy";
  if (signal.activoRelacionado !== undefined) return "activo";
  if (signal.desigualdad.distribucion === "desconocida-sin-desagregacion") {
    return "estudio";
  }
  return "equidad";
}

function pickSignal(
  signals: IntegratedHealthProfileSignal[],
  used: Set<string>,
  definition: ReadingDefinition
): IntegratedHealthProfileSignal | undefined {
  const preferredById = definition.preferredSignalIds
    ?.map((id) => signals.find((signal) => signal.id === id && !used.has(signal.id)))
    .find((signal): signal is IntegratedHealthProfileSignal => signal !== undefined);
  if (preferredById !== undefined) return preferredById;

  if (definition.variant !== "informe") {
    const quantitative = signals.find(
      (signal) =>
        !used.has(signal.id) &&
        !signal.esMencionTextual &&
        includesAny(signalText(signal), definition.signalMatches)
    );
    if (quantitative !== undefined) return quantitative;
  }

  const preferred = signals.find(
    (signal) =>
      !used.has(signal.id) &&
      includesAny(signalText(signal), definition.signalMatches)
  );
  if (preferred !== undefined) return preferred;

  // Un bloque editorial solo existe cuando el expediente contiene una señal
  // relacionada con su tema. Reutilizar aquí «la primera señal libre» hacía que
  // una evidencia cualquiera alimentara bloques de sueño, sedentarismo, apoyo
  // social o alimentación y producía perfiles casi idénticos entre territorios.
  return undefined;
}

function pickAgenda(
  cards: GrupoMotorCard[],
  definition: ReadingDefinition
): GrupoMotorCard | undefined {
  if (definition.preferredAgendaId !== undefined) {
    const preferred = cards.find((card) => card.id === definition.preferredAgendaId);
    if (preferred !== undefined) return preferred;
  }
  return cards.find((card) => includesAny(agendaText(card), definition.agendaMatches));
}

function shortText(text: string, maxLength = 220): string {
  const compact = text.trim().replace(/\s+/g, " ");
  if (compact.length <= maxLength) return compact;
  return compact.slice(0, maxLength - 1).replace(/\s+\S*$/, "") + "…";
}

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function upperFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Cierra una frase sin duplicar signos (evita «….» y «?.»). */
function cerrarFrase(text: string): string {
  const compact = text.trim();
  return /[.…?!]$/.test(compact) ? compact : `${compact}.`;
}

function enumerarEjes(ejes: string[]): string {
  if (ejes.length <= 1) return ejes[0] ?? "los ejes disponibles";
  return `${ejes.slice(0, -1).join(", ")} ni ${ejes[ejes.length - 1]}`;
}

/**
 * Asignación del conocimiento humano a los hilos.
 *
 * Sin asignación, una sola interpretación, hipótesis o laguna del equipo se
 * repite en todos los hilos que comparten espacio —«determinantes» y
 * «desigualdades» los comparten cuatro— y la pregunta al Grupo Motor deja de
 * derivar de la evidencia de cada hilo para convertirse en una fórmula añadida
 * mecánicamente. Tampoco basta un reparto por orden: el primer hilo se
 * apropiaría de conocimiento redactado para un espacio que otro hilo tiene como
 * espacio principal.
 *
 * Regla: cada pieza se consume UNA vez. Primero se asigna al hilo cuyo espacio
 * PRINCIPAL (spaces[0]) coincide con el espacio en que el equipo la redactó;
 * después, lo no reclamado se ofrece a los hilos que lo tienen como espacio
 * secundario.
 */
type HumanKnowledgeByDefinition = Map<string, HumanKnowledgeSelection>;

function assignByPrimaryThenSecondary<T>(
  definitions: ReadingDefinition[],
  itemsBySpace: (space: ProfileSpace) => T[],
  eligible: (definitionId: string) => boolean,
  assign: (definitionId: string, item: T) => void
): void {
  const claimed = new Set<T>();
  const passes: Array<(definition: ReadingDefinition) => ProfileSpace[]> = [
    (definition) => definition.spaces.slice(0, 1),
    (definition) => definition.spaces.slice(1),
  ];
  for (const spacesOfPass of passes) {
    for (const definition of definitions) {
      if (!eligible(definition.id)) continue;
      for (const space of spacesOfPass(definition)) {
        const item = itemsBySpace(space).find(
          (candidate) => !claimed.has(candidate)
        );
        if (item !== undefined) {
          claimed.add(item);
          assign(definition.id, item);
          break;
        }
      }
    }
  }
}

function assignHumanKnowledge(
  answers: DiagnosticAnswers,
  definitions: ReadingDefinition[]
): HumanKnowledgeByDefinition {
  const result: HumanKnowledgeByDefinition = new Map(
    definitions.map((definition) => [definition.id, {}])
  );

  assignByPrimaryThenSecondary(
    definitions,
    (space) => answers.porEspacio[space]?.interpretaciones ?? [],
    (id) => result.get(id)?.interpretation === undefined,
    (id, item) => {
      result.get(id)!.interpretation = item;
    }
  );
  // La hipótesis solo se ofrece a hilos que no van a citar interpretación: la
  // frase de conocimiento antepone la interpretación y la hipótesis se perdería.
  assignByPrimaryThenSecondary(
    definitions,
    (space) => answers.porEspacio[space]?.hipotesis ?? [],
    (id) =>
      result.get(id)?.interpretation === undefined &&
      result.get(id)?.hypothesis === undefined,
    (id, item) => {
      result.get(id)!.hypothesis = item;
    }
  );
  assignByPrimaryThenSecondary(
    definitions,
    (space) => answers.porEspacio[space]?.lagunas ?? [],
    (id) => result.get(id)?.openQuestion === undefined,
    (id, item) => {
      result.get(id)!.openQuestion = item;
    }
  );

  return result;
}

function pickCapacity(
  definition: ReadingDefinition,
  signal: IntegratedHealthProfileSignal,
  answers: DiagnosticAnswers
): string | undefined {
  for (const match of definition.capacityMatches) {
    const group = answers.salutogenica.grupos.find((candidate) =>
      normalized(candidate.ambito).includes(normalized(match))
    );
    if (group !== undefined) return group.ambito;
  }
  if (signal.activoRelacionado !== undefined) return signal.activoRelacionado;
  return undefined;
}

function firstMotorQuestion(definition: ReadingDefinition): string {
  const question = definition.motorQuestionIndexes
    .map((index) => DIAGNOSTIC_ENGINE_QUESTIONS[index])
    .find((item) => item !== undefined);
  return question ?? "¿Qué queda preparado para deliberar?";
}

function buildReasoning(
  definition: ReadingDefinition,
  signal: IntegratedHealthProfileSignal,
  agenda: GrupoMotorCard | undefined,
  answers: DiagnosticAnswers,
  human: HumanKnowledgeSelection
): TerritorialDiagnosticReasoning {
  // El mecanismo procede de la evidencia del hilo (señal, agenda o marco de la
  // definición). Una hipótesis del equipo NO se convierte en mecanismo: se cita
  // como hipótesis, con su plausibilidad, en la frase de conocimiento.
  const mechanism =
    signal.mecanismoPlausible ??
    agenda?.mecanismo ??
    definition.mechanismFallback;
  // Quién puede quedar fuera es una cuestión de equidad, no la «relevancia» de
  // una laguna del equipo (que explica por qué importa, no a quién excluye).
  const exclusion = agenda?.oculto ?? signal.desigualdad.nota;
  const groupMotorQuestion =
    human.openQuestion?.formulacion ??
    agenda?.pregunta ??
    signal.preguntaGrupoMotor;

  return {
    id: definition.id,
    title: definition.title,
    motorQuestion: firstMotorQuestion(definition),
    signal,
    source: humanSource(signal.fuente),
    scale: signal.escala,
    value: signal.valor,
    mechanism,
    exclusion,
    groupMotorQuestion,
    human,
    territorialImplication: definition.territorialImplication,
    capacity: pickCapacity(definition, signal, answers),
    capacityFrame: definition.capacityFrame,
    diagnosticConclusion: definition.diagnosticConclusion,
    variant: agenda?.variant ?? signalVariant(signal) ?? definition.variant,
  };
}

function evidenceSentence(reasoning: TerritorialDiagnosticReasoning): string {
  const { signal } = reasoning;
  const value = reasoning.value.replace(/\s+\[[^\]]+\]/, "");
  if (signal.esMencionTextual) {
    // Marco científico (Hernán/Robins): las menciones del Informe son
    // trazabilidad textual. Ni prevalencia, ni carga de enfermedad, ni
    // prioridad territorial demostrada.
    return (
      `El Informe registra «${signal.senal}» (${value}): atención documental ` +
      `del hilo sanitario, no prevalencia, ni carga de enfermedad, ni ` +
      `prioridad territorial demostrada.`
    );
  }
  const qualifier = signal.esProxy ? "proxy contextual" : "muestra declarada";
  return (
    `El expediente incorpora «${signal.senal}» (${value}) desde ` +
    `${reasoning.source} como ${qualifier}: contextualiza el análisis sin ` +
    `sustituir medición local ausente.`
  );
}

function knowledgeSentence(reasoning: TerritorialDiagnosticReasoning): string {
  const { human } = reasoning;
  if (human.interpretation !== undefined) {
    const { enunciado, certeza, autorNombre } = human.interpretation;
    return (
      `La interpretación activa del equipo técnico (${certeza}, ${autorNombre}) ` +
      `orienta este hilo: ${cerrarFrase(shortText(enunciado))} ` +
      `${reasoning.territorialImplication}`
    );
  }
  if (human.hypothesis !== undefined) {
    const { enunciado, plausibilidad, preguntasResolutoras } = human.hypothesis;
    const base =
      `La hipótesis activa del equipo (${plausibilidad}) se incorpora como ` +
      `posibilidad a contrastar: ${cerrarFrase(shortText(enunciado))}`;
    if (preguntasResolutoras.length > 0) {
      return `${base} Para resolverla: ${cerrarFrase(shortText(preguntasResolutoras[0], 110))}`;
    }
    return base;
  }
  // El mecanismo es el nucleo del argumento: no se trunca.
  return (
    `${reasoning.territorialImplication} Mecanismo plausible, sin causalidad ` +
    `demostrada: ${cerrarFrase(reasoning.mechanism)}`
  );
}

/**
 * Equidad: laguna ESPECÍFICA de esta señal (ejes ausentes + lo que no puede
 * saberse) y quién puede quedar fuera. La cadena diagnóstica progresa aquí en
 * la prosa; no se expone como campo suelto.
 */
function equitySentence(reasoning: TerritorialDiagnosticReasoning): string {
  const { desigualdad } = reasoning.signal;
  const base =
    `Sin desagregación por ${enumerarEjes(desigualdad.ejesAusentes)} no puede ` +
    `saberse ${desigualdad.loQueNoSeSabe}: incertidumbre de equidad, no ` +
    `ausencia de desigualdad.`;
  // Cuando no hay una exclusión propia del hilo, la propia laguna ya la enuncia.
  if (reasoning.exclusion === desigualdad.nota) return base;
  // Dos puntos: la exclusión puede ser singular («quien cuida») o plural («los
  // grupos que…») y la frase debe concordar con ambas.
  return `${base} Puede quedar fuera de esa lectura: ${cerrarFrase(
    lowerFirst(shortText(reasoning.exclusion, 120))
  )}`;
}

function capacitySentence(reasoning: TerritorialDiagnosticReasoning): string {
  const { capacity, capacityFrame } = reasoning;
  // El marco de capacidad se cita íntegro: distingue recurso, capacidad
  // potencial, conocimiento, acceso y uso. Truncarlo mutilaba la frase.
  return capacity !== undefined
    ? `${upperFirst(capacity)}: capacidad potencial, no cobertura ni resultado. ` +
        `${cerrarFrase(capacityFrame)}`
    : `${cerrarFrase(capacityFrame)} Sin recurso concreto vinculado.`;
}

function questionSentence(reasoning: TerritorialDiagnosticReasoning): string {
  const { human, groupMotorQuestion, diagnosticConclusion } = reasoning;
  // La pregunta ya termina en «?»: no se le añade otro punto.
  // La pregunta de contraste no se trunca: truncarla le quitaba el «?».
  const question = groupMotorQuestion.trim().replace(/[.\s]+$/, "");
  const conclusion =
    diagnosticConclusion.charAt(0).toUpperCase() + diagnosticConclusion.slice(1);

  if (human.openQuestion !== undefined) {
    const { urgencia } = human.openQuestion;
    const urgenciaStr = urgencia.trim().length > 0 ? ` (${urgencia})` : "";
    return (
      `La pregunta abierta del equipo${urgenciaStr}: ${question} ${conclusion}.`
    );
  }
  return `De ahí la pregunta de contraste: ${question} ${conclusion}.`;
}

/**
 * Progresión argumental (contrato de escritura): señal → mecanismo social
 * plausible → desigualdad observable o no + quién puede quedar fuera →
 * capacidad relacionada → pregunta de contraste → conclusión diagnóstica.
 * No es una lista de campos: la cadena se lee como argumento.
 */
function composeReading(reasoning: TerritorialDiagnosticReasoning): string {
  return [
    evidenceSentence(reasoning),
    knowledgeSentence(reasoning),
    equitySentence(reasoning),
    capacitySentence(reasoning),
    questionSentence(reasoning),
  ].join(" ");
}

function buildReadingBlock(
  definition: ReadingDefinition,
  signal: IntegratedHealthProfileSignal,
  agenda: GrupoMotorCard | undefined,
  answers: DiagnosticAnswers,
  human: HumanKnowledgeSelection
): ProfileIntegratedEditorialReadingBlock {
  const reasoning = buildReasoning(definition, signal, agenda, answers, human);
  return {
    id: reasoning.id,
    title: reasoning.title,
    signal: reasoning.signal.senal,
    source: reasoning.source,
    scale: reasoning.scale,
    reading: composeReading(reasoning),
    mechanism: reasoning.mechanism,
    exclusion: reasoning.exclusion,
    groupMotorQuestion: reasoning.groupMotorQuestion,
    motorQuestion: reasoning.motorQuestion,
    variant: reasoning.variant,
  };
}

function buildOverviewTitle(id: string, index: number): string {
  return OVERVIEW_TITLES[id] ?? `Mensaje ${index + 1}`;
}

function findSignalById(
  signals: IntegratedHealthProfileSignal[],
  id: string
): IntegratedHealthProfileSignal | undefined {
  return signals.find((signal) => signal.id === id);
}

function joinLabels(values: Array<string | undefined>, fallback: string): string {
  const labels = unique(values.filter((value): value is string => value !== undefined));
  return labels.length > 0 ? labels.join(" + ") : fallback;
}

function overviewFromMessage(
  message: { id: string; texto: string },
  index: number,
  context: {
    signals: IntegratedHealthProfileSignal[];
    visuals: ReturnType<typeof buildDiagnosticVisuals>;
    synthesis: ReturnType<typeof buildProfileSynthesis>;
    informeTitulo?: string;
    totalAssets: number;
    hasComplementaryStudies: boolean;
  }
): ProfileIntegratedEditorialOverviewMessage {
  const title = buildOverviewTitle(message.id, index);

  if (message.id === "hilo-sanitario") {
    const informeRow = context.synthesis.senalesPrincipales.find((row) =>
      row.grupo.includes("Informe")
    );
    const informeSignal = context.signals.find((signal) => signal.esMencionTextual);
    return {
      id: message.id,
      title,
      text:
        `${context.informeTitulo ?? "El Informe de salud"} sostiene el hilo ` +
        `sanitario del Perfil y fija su objeto salud: ` +
        `${informeRow?.senal ?? informeSignal?.senal ?? "sus dimensiones principales"} ` +
        `constan como presencia textual del documento. Eso aporta la agenda ` +
        `sanitaria de partida; no permite conocer prevalencia local, carga de ` +
        `enfermedad ni distribución interna.` +
        (context.hasComplementaryStudies
          ? ` Los estudios complementarios amplían ese hilo hacia la vida ` +
            `cotidiana y el bienestar, sin sustituirlo.`
          : "") +
        ` Los activos añaden las capacidades del territorio, sin sustituirlo.`,
      signal: informeRow?.senal ?? "dimensiones sanitarias principales del Informe",
      source: context.informeTitulo ?? informeRow?.fuente ?? "Informe de salud",
      variant: "informe",
    };
  }

  if (message.id === "vida-cotidiana") {
    const sueno = findSignalById(context.signals, "trazador-sueno-insuficiente");
    const inactividad = findSignalById(context.signals, "trazador-ipaq-inactividad");
    return {
      id: message.id,
      title,
      text:
        `La vida cotidiana entra por señales incorporadas al proceso: ` +
        `${sueno?.valor ?? "sueño insuficiente"} en descanso y ` +
        `${inactividad?.valor ?? "inactividad"} en tiempo libre. Su escala ` +
        `contextual no reemplaza el dato local ausente; orienta preguntas sobre ` +
        `tiempos, cuidados, vivienda, seguridad y uso real del entorno.`,
      signal: joinLabels(
        [sueno?.senal, inactividad?.senal],
        "sueño insuficiente e inactividad en tiempo libre"
      ),
      source: humanSource(joinLabels(
        [sueno?.fuente, inactividad?.fuente],
        "Sueño (EAS) + IPAQ"
      )),
      variant: "estudio",
    };
  }

  if (message.id === "apoyo-envejecimiento") {
    const apoyo = findSignalById(context.signals, "trazador-duke-apoyo-global");
    const agenda = context.visuals.grupoMotorCards.find((card) =>
      card.id === "soledad-envejecimiento"
    );
    const activos =
      context.totalAssets > 0
        ? `${context.totalAssets} recursos comunitarios`
        : undefined;
    return {
      id: message.id,
      title,
      text:
        `El apoyo social agregado (${apoyo?.valor ?? "DUKE"}) se lee junto al ` +
        `envejecimiento, la soledad posible y ${context.totalAssets} recursos ` +
        `comunitarios inventariados. La cuestión no es si hay red en abstracto, ` +
        `sino quién puede quedar fuera de los vínculos y capacidades disponibles.`,
      signal: joinLabels(
        [apoyo?.senal, agenda?.tema, activos],
        "apoyo social funcional, envejecimiento y soledad"
      ),
      source: humanSource(joinLabels(
        [apoyo?.fuente, context.totalAssets > 0 ? "Localiza Salud" : undefined],
        "DUKE + Localiza Salud"
      )),
      variant: "activo",
    };
  }

  // Atribución explícita: «Bienestar escolar» procede del IBSE (no de Localiza) y
  // «Capacidades comunitarias» de Localiza Salud (no del genérico "Perfil de Salud
  // Local"). El fallback posicional por índice atribuía mal ambas tarjetas.
  if (message.id === "bienestar-escolar") {
    const ibse = findSignalById(context.signals, "trazador-ibse-indice-total");
    return {
      id: message.id,
      title,
      text: message.texto,
      signal: ibse?.senal ?? "índice de bienestar socioemocional (IBSE)",
      source: humanSource(ibse?.fuente ?? "IBSE"),
      variant: "estudio",
    };
  }

  if (message.id === "capacidades") {
    return {
      id: message.id,
      title,
      text: message.texto,
      signal:
        context.totalAssets > 0
          ? `${context.totalAssets} recursos comunitarios`
          : "capacidades comunitarias",
      source: "Localiza Salud",
      variant: "activo",
    };
  }

  const signal = context.signals.find((candidate) =>
    includesAny(signalText(candidate), [message.id, title, message.texto])
  );
  return {
    id: message.id,
    title,
    text: message.texto,
    signal:
      signal?.senal ?? context.synthesis.senalesPrincipales[index]?.senal ?? message.id,
    source: humanSource(
      signal?.fuente ??
      context.synthesis.senalesPrincipales[index]?.fuente ??
      "Perfil de Salud Local"
    ),
    variant: signal !== undefined ? signalVariant(signal) : "estudio",
  };
}

function firstHumanOpenQuestion(answers: DiagnosticAnswers): string | undefined {
  return Object.values(answers.porEspacio)
    .flatMap((knowledge) => knowledge?.lagunas ?? [])
    .map((question) => question.formulacion)
    .find((question) => question.trim().length > 0);
}

function formatCount(
  count: number,
  singular: string,
  plural: string
): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function buildClosingColumns(input: {
  answers: DiagnosticAnswers;
  synthesis: ReturnType<typeof buildProfileSynthesis>;
  matrix: MatrizAnexo;
  territorialReadings: ProfileIntegratedEditorialReadingBlock[];
  communityKnowledgePending: boolean;
}): ProfileIntegratedEditorialClosingColumn[] {
  const { answers, synthesis, matrix, territorialReadings } = input;
  const sanitarySignal = synthesis.senalesPrincipales.find((row) =>
    row.grupo.includes("Informe")
  );
  const humanQuestion = firstHumanOpenQuestion(answers);
  const assetsText =
    answers.salutogenica.totalAssets > 0
      ? `${formatCount(answers.salutogenica.totalAssets, "recurso", "recursos")} de Localiza Salud ${answers.salutogenica.totalAssets === 1 ? "queda" : "quedan"} como capacidad potencial${validatedCount(answers)}, pendientes de acceso, uso y reconocimiento.`
      : "El expediente no incorpora todavía recursos de Localiza Salud para leer capacidades.";
  const tracerReferenceCount = answers.referencias.references.filter(
    (r) => r.tracerPriority !== undefined
  ).length;
  const complementaryStudiesText =
    tracerReferenceCount > 0
      ? `Los estudios complementarios aportan ${tracerReferenceCount} ${tracerReferenceCount === 1 ? "indicador trazador" : "indicadores trazadores"} para leer vida cotidiana, apoyo, hábitos y entorno con cautela de escala.`
      : answers.estudios.totalStudies > 0
        ? "Hay estudios complementarios incorporados, pero no aportan indicadores trazadores comparables destacados para esta lectura."
        : "No hay estudios complementarios incorporados en este expediente; el Perfil declara esa ausencia y no la convierte en evidencia.";

  return [
    {
      id: "sabemos",
      title: "Qué imagen puede sostenerse",
      items: unique([
        answers.sintesisTexto !== undefined
          ? `Síntesis técnica incorporada: ${shortText(answers.sintesisTexto, 240)}`
          : undefined,
        sanitarySignal !== undefined
          ? `El Informe de salud fija el hilo sanitario mediante presencia textual de ${sanitarySignal.senal}; no aporta por sí solo distribución interna.`
          : "El hilo sanitario necesita Informe de salud incorporado para sostener la apertura.",
        complementaryStudiesText,
      ].filter((item): item is string => item !== undefined)).slice(0, 3),
    },
    {
      id: "contrastar",
      title: "Qué hipótesis merecen contraste",
      items: unique(
        [
          humanQuestion !== undefined
            ? `Pregunta abierta del equipo: ${humanQuestion}`
            : undefined,
          ...territorialReadings.map((block) => block.groupMotorQuestion),
        ].filter((item): item is string => item !== undefined)
      )
        .slice(0, input.communityKnowledgePending ? 2 : 3)
        .concat(
          // Popay: mientras no haya material cualitativo ni deliberación
          // registrada, la experiencia del vecindario es conocimiento pendiente
          // de incorporación. No se inventa; se declara.
          input.communityKnowledgePending
            ? [
                "La experiencia del vecindario y del Grupo Motor está pendiente " +
                  "de incorporación: confirmará mecanismos, barreras, " +
                  "significados y acceso real. Es conocimiento pendiente, no " +
                  "ausencia de conocimiento.",
              ]
            : []
        ),
    },
    {
      id: "no-confundir",
      title: "Qué no debe confundirse",
      items: unique([
        "Las menciones del Informe son presencia textual y no prevalencia local.",
        `Las referencias provinciales, autonómicas o proxy contextualizan; no son medición ${answers.territorial.escalaFinaAdj}.`,
        assetsText,
        ...matrix.notasBloque,
      ]).slice(0, 3),
    },
  ];
}

function buildDiagnosticSynthesis(
  interpretation: IntegratedInterpretation
): ProfileIntegratedDiagnosticSynthesis {
  const statusCounts: Record<IntegratedInterpretationStatus, number> = {
    "integrated-interpretation": 0,
    "plausible-hypothesis": 0,
    "open-question": 0,
  };
  for (const unit of interpretation.units) {
    statusCounts[unit.epistemicStatus] += 1;
  }

  const localSignalIds = unique(
    interpretation.units.flatMap((unit) =>
      unit.localSignals.map((signal) => signal.id)
    )
  );
  const contextualSignalIds = unique(
    interpretation.units.flatMap((unit) =>
      unit.contextualSignals.map((signal) => signal.id)
    )
  );
  const topTitles = interpretation.units
    .slice(0, 3)
    .map((unit) => lowerFirst(unit.title));
  const integrated = statusCounts["integrated-interpretation"];
  const hypotheses = statusCounts["plausible-hypothesis"];
  const contrastQuestions = unique(
    interpretation.units.map((unit) => unit.question)
  ).slice(0, 4);
  // El recuento editorial describe la lista que el lector ve. El número de
  // unidades con estado open-question se conserva en statusCounts para la
  // trazabilidad técnica, pero no puede anunciar cinco preguntas si se muestran cuatro.
  const open = contrastQuestions.length;

  const thesis =
    interpretation.units.length > 0
      ? `La lectura disponible no se limita a contar menciones: organiza ${formatCount(interpretation.units.length, "hilo diagnóstico", "hilos diagnósticos")} cruzando agenda sanitaria, señales locales, contexto, incertidumbre de equidad y capacidades. El núcleo territorial se concentra en ${enumerarEjes(topTitles)}.`
      : "La base disponible todavía no permite construir hilos diagnósticos integrados; el Perfil conserva la agenda sanitaria de partida y declara la lectura territorial como pendiente.";
  const interpretiveWeight =
    `El peso interpretativo queda graduado: ${formatCount(integrated, "hilo", "hilos")} como interpretación integrada, ` +
    `${formatCount(hypotheses, "hipótesis plausible", "hipótesis plausibles")} y ${formatCount(open, "pregunta abierta", "preguntas abiertas")}. ` +
    `La síntesis usa ${formatCount(localSignalIds.length, "señal local", "señales locales")} y ` +
    `${formatCount(contextualSignalIds.length, "señal contextual", "señales contextuales")}, siempre con la escala declarada por cada fuente.`;
  const caution =
    `${interpretation.centralUncertainty} Las menciones del Informe orientan la agenda; no equivalen por sí solas a prevalencias locales ni a distribución interna.`;

  return {
    id: "diagnostic-synthesis",
    title: "Síntesis interpretativa del Perfil",
    thesis,
    interpretiveWeight,
    caution,
    contrastQuestions,
    traceability: {
      unitIds: interpretation.units.map((unit) => unit.id),
      localSignalIds,
      contextualSignalIds,
      statusCounts,
    },
  };
}

// ── Nivel 3 → bloque de lectura (la interpretación integrada gobierna N4) ──────

function variantForUnit(unit: IntegratedInterpretationUnit): EvidenceVariant {
  if (unit.localSignals.length > 0) return "estudio";
  if (unit.epistemicStatus === "open-question") return "equidad";
  if (unit.contextualSignals.length > 0) return "proxy";
  return "informe";
}

function interpretationUnitToReadingBlock(
  unit: IntegratedInterpretationUnit,
  visibleAssistanceUnitIds: ReadonlySet<string>,
  lex: TerritorialLexicon
): ProfileIntegratedEditorialReadingBlock {
  const principal = unit.localSignals[0];
  const signal =
    principal?.label ??
    (unit.sanitaryAgenda.topics[0] ?? "agenda del Informe de salud");
  const source =
    principal !== undefined
      ? `evidencia local + Informe de salud`
      : unit.contextualSignals.length > 0
        ? "Informe de salud + contexto territorial"
        : "Informe de salud";
  // Fallback neutral (Lote D, ajuste 3): «contexto provincial» solo se afirma
  // cuando una fuente real acredita origen provincial; no puede derivarse de la
  // ausencia de señal local.
  const scale = principal?.scale ?? "escala del Informe";
  return {
    id: unit.id,
    title: unit.title,
    signal,
    source,
    scale,
    reading: unit.reasoning,
    mechanism: unit.plausibleDeterminants[0] ?? "por contrastar con el territorio",
    exclusion: unit.inequalitiesOrUncertainties[0] ?? lex.sinDesagregacionInterna,
    groupMotorQuestion: unit.question,
    motorQuestion: unit.question,
    variant: variantForUnit(unit),
    epistemicStatus: unit.epistemicStatus,
    // Solo se muestra la pregunta de contraste si la unidad está en la selección
    // visible (auditoría 5D): las demás quedan en el modelo para el espacio técnico.
    clinicalAssistanceQuestion: visibleAssistanceUnitIds.has(unit.id)
      ? unit.clinicalAssistanceQuestions.find((q) => q.visibility === "profile")
          ?.question
      : undefined,
  };
}


/** «; N son activos validados» según la declaración de validación (Art. 9 bis). */
function validatedCount(answers: DiagnosticAnswers): string {
  const n = answers.puntoDePartida?.activosValidados ?? 0;
  return n === 0
    ? "; ninguno consta como activo validado"
    : `; ${n} ${n === 1 ? "consta como activo validado" : "constan como activos validados"}`;
}

export function buildProfileIntegratedEditorialView(
  answers: DiagnosticAnswers,
  opts: BuildProfileIntegratedEditorialViewOptions
): ProfileIntegratedEditorialView {
  const synthesis = buildProfileSynthesis(answers, {
    informeTitulo: opts.informeTitulo,
    scopeNoun: "territorio",
  });
  const visuals = buildDiagnosticVisuals(answers, {
    informeTitulo: opts.informeTitulo,
  });
  const matrix = buildMatrizAnexo(answers);
  const signals = buildIntegratedProfileSignals(answers);
  const usedSignals = new Set<string>();

  const overview = synthesis.mensajes.slice(0, 3).map((message, index) =>
    overviewFromMessage(message, index, {
      signals,
      visuals,
      synthesis,
      informeTitulo: opts.informeTitulo,
      totalAssets: answers.salutogenica.totalAssets,
      hasComplementaryStudies: (answers.estudios?.diagnosticBlocks.length ?? 0) > 0,
    })
  );

  // Nivel 3 gobierna la lectura principal: cada unidad de interpretación
  // integrada es un hilo territorial. El camino por READING_DEFINITIONS se
  // conserva SOLO como compatibilidad para expedientes sin Informe estructurado
  // (interpretación sin unidades), no como selección principal.
  const interpretation = buildIntegratedInterpretation(answers);
  // Selección visible de preguntas de contraste asistencial (auditoría 5D): de
  // todas las producidas, solo las marcadas "profile" y hasta el límite global.
  const visibleAssistanceUnitIds = new Set(
    selectVisibleUGCAssistanceQuestions(
      interpretation.units.flatMap((u) => u.clinicalAssistanceQuestions)
    ).map((q) => q.unitId)
  );
  const territorialReadings: ProfileIntegratedEditorialReadingBlock[] =
    interpretation.units.length > 0
      ? interpretation.units.map((unit) =>
          interpretationUnitToReadingBlock(
            unit,
            visibleAssistanceUnitIds,
            answers.territorial
          )
        )
      : READING_DEFINITIONS.flatMap((definition) => {
          const signal = pickSignal(signals, usedSignals, definition);
          if (signal === undefined) return [];
          usedSignals.add(signal.id);
          return [
            buildReadingBlock(
              definition,
              signal,
              pickAgenda(visuals.grupoMotorCards, definition),
              answers,
              assignHumanKnowledge(answers, READING_DEFINITIONS).get(
                definition.id
              ) ?? {}
            ),
          ];
        });
  const studiesSourceText =
    answers.estudios.totalStudies > 0
      ? ((estudios, trazadores) =>
          `${estudios} ${estudios === 1 ? "estudio" : "estudios"} y ${trazadores} ${trazadores === 1 ? "indicador trazador destacado" : "indicadores trazadores destacados"} (con valores comparables solo cuando existe referencia equivalente)`)(
          answers.estudios.totalStudies,
          visuals.tablaTrazadores.length
        )
      : "sin estudios complementarios incorporados; esta ausencia queda declarada como alcance del diagnóstico";
  const assetsSourceText =
    answers.salutogenica.totalAssets > 0
      ? `${formatCount(answers.salutogenica.totalAssets, "recurso", "recursos")} de Localiza Salud, inventariados como capacidades potenciales${validatedCount(answers)}`
      : "sin recursos de Localiza Salud incorporados todavía";

  const sourceBlocks: ProfileIntegratedEditorialSourceBlock[] = [
    {
      id: "informe",
      title: "Informe de salud",
      whatItAdds:
        answers.healthReport.present
          ? "agenda sanitaria de partida, temas tratados y trazabilidad textual del documento fuente"
          : "el expediente no dispone de un Informe de Salud procesado; una referencia documental sin texto no permite reconstruir su contenido",
      whatItDoesNotAllow:
        "No mide por sí solo prevalencia local ni distribución interna de desigualdad",
      variant: "informe",
    },
    {
      id: "estudios",
      title: "Estudios complementarios",
      whatItAdds: studiesSourceText,
      whatItDoesNotAllow:
        "No sustituyen la lectura municipal ni convierten una muestra o proxy en verdad territorial completa",
      variant: "estudio",
    },
    {
      id: "activos",
      title: "Activos y capacidades",
      whatItAdds: assetsSourceText,
      whatItDoesNotAllow:
        "No acreditan cobertura, uso efectivo ni acceso real sin contraste comunitario",
      variant: "activo",
    },
  ];

  const closing = buildClosingColumns({
    answers,
    synthesis,
    matrix,
    territorialReadings,
    // Popay: la validación comunitaria consta como pendiente mientras ninguna
    // señal la tenga resuelta (material cualitativo o deliberación registrada).
    communityKnowledgePending:
      signals.length > 0 &&
      signals.every((signal) => signal.validacionComunitariaPendiente),
  });

  return {
    header: {
      title: "Perfil de Salud Local",
      subtitle: "Lectura territorial del diagnóstico",
      territory: opts.territory,
      status: opts.status,
      scale: "escala territorial declarada por cada fuente",
      sources: unique([
        ...(answers.healthReport.present ? [opts.informeTitulo ?? "Informe de salud"] : []),
        ...synthesis.senalesPrincipales.map((row) => humanSource(row.fuente)),
      ]).slice(0, 6),
      generatedDate: opts.generatedDate,
    },
    overview,
    sourceBlocks,
    territorialReadings,
    interpretation,
    diagnosticSynthesis: buildDiagnosticSynthesis(interpretation),
    tracerTable: visuals.tablaTrazadores,
    groupMotorAgenda: visuals.grupoMotorCards,
    closing,
    technicalAnnex: {
      documentarySourceBlocks: buildDocumentarySourceBlocks(answers),
      title: "Lectura territorial ampliada y anexo técnico",
      summary:
        `${formatCount(visuals.tablaTrazadores.length, "trazador", "trazadores")}, ` +
        `${formatCount(matrix.filas.length, "fila de matriz", "filas de matriz")} y ` +
        `${formatCount(matrix.notasBloque.length, "nota metodológica común", "notas metodológicas comunes")}.`,
      tracerRows: visuals.tablaTrazadores,
      matrix: {
        ...matrix,
        filas: matrix.filas.map((f) => ({ ...f, fuente: humanSource(f.fuente) })),
      },
    },
  };
}

/** Search excerpts are technical evidence locators, never diagnostic prose. */
export function buildDocumentarySourceBlocks(answers: DiagnosticAnswers): ProfileIntegratedEditorialSourceBlock[] {
  const findings = answers.desigualdadTerritorial.documentaryFindings ?? [];
  return [...new Set(findings.map(finding => finding.documentId))].map(documentId => {
    const passages = findings.filter(finding => finding.documentId === documentId);
    const source = passages[0];
    return {
      id: `documento-territorial:${documentId}`,
      title: source.title,
      whatItAdds: passages.map(finding =>
        `Extracto indexado por «${finding.theme}»: «${finding.quote.trim()}» ` +
        `(caracteres ${finding.start + 1}–${finding.end})`
      ).join("\n\n"),
      whatItDoesNotAllow:
        `Fuente: ${source.sourceFileName ?? source.title}; documento ${documentId}. ` +
        `Escala declarada: ${source.scale === "unknown" ? "no declarada" : source.scale}. ` +
        `Año declarado en metadatos: ${source.referenceYear ?? "no consta"}. ` +
        "Fragmentos de búsqueda para localizar la fuente; pueden estar incompletos. " +
        "No constituyen una síntesis epidemiológica ni acreditan vigencia actual o causalidad local",
      variant: "equidad",
    };
  });
}
