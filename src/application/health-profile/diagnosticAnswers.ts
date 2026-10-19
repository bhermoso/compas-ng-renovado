/**
 * diagnosticAnswers
 *
 * Capa pura de RESPUESTAS DIAGNÓSTICAS del Perfil Local de Salud.
 * Traduce la base disponible (espacio de conocimiento del técnico, Informe de
 * Salud parseado, señales de los estudios, activos y determinantes documentados)
 * en material sustantivo que los capítulos narrativos pueden redactar.
 *
 * Prioridad epistémica de cada respuesta:
 *   1. Interpretaciones activas del técnico (con certeza y trazabilidad).
 *   2. Hipótesis activas (explicaciones candidatas, nunca hechos).
 *   3. Lectura generada desde evidencia (señales, Informe, activos).
 *   4. Preguntas abiertas (lagunas positivas del conocimiento).
 *   5. Síntesis del técnico (modula el cierre; no sustituye el documento).
 *
 * Reglas:
 *   - El Perfil concluye, pero no recomienda: esta capa no formula actuaciones,
 *     programas ni líneas estratégicas.
 *   - La lectura epidemiológico-social produce determinantes PLAUSIBLES con
 *     cautela expresa, distinguiendo documentado / plausible / no evaluable /
 *     a contrastar. Nunca causalidad demostrada.
 *   - El Informe de Salud se lee (títulos y temas de sus secciones parseadas),
 *     no se atomiza ni se modifica (D-HR-01 intacta).
 */

import type { MunicipalityWorkspace } from "../../domain/workspace";
import type {
  PerfilLocalDeSalud,
  ProfileSpace,
  HealthProfileInterpretation,
  HealthProfileHypothesis,
  HealthProfileOpenQuestion,
} from "../../domain/health-profile";
import type { ComplementaryStudiesReading } from "./complementaryStudiesReading";
import {
  buildComplementaryStudiesReading,
  HIPOTESIS_PSICOSOCIAL,
  HIPOTESIS_ENTORNO_URBANO,
  HIPOTESIS_CONSUMOS,
} from "./complementaryStudiesReading";
import type { ComplementaryIndicatorReferencesReading } from "./complementaryIndicatorReferences";
import { buildIndicatorComparisonReferences } from "./complementaryIndicatorReferences";
import type { BadeaMunicipalContext } from "../badea";
import { getBadeaMunicipalContext } from "../badea";
import type { EracisMunicipalContext } from "../eracis";
import { getEracisMunicipalContext } from "../eracis";
import type { HealthReportSanitaryReading } from "./healthReportSanitaryReading";
import { buildHealthReportSanitaryReading } from "./healthReportSanitaryReading";
import type { UGCAssistanceQuestion } from "../ugc-clinical-assistance";
import {
  buildUGCClinicalAssistanceReading,
  buildUGCAssistanceQuestions,
} from "../ugc-clinical-assistance";
import { territorialLexicon, type TerritorialLexicon } from "./territorialGrammar";
import {
  buildAntecedents,
  excludeHistoricalSources,
  type CanonicalAntecedents,
} from "./antecedents";

// ── Tipos de la capa ──────────────────────────────────────────────────────────

export type DeterminantReadingKind =
  | "documentado"
  | "plausible"
  | "no-evaluable"
  | "a-contrastar";

export interface DiagnosticDeterminantReading {
  kind: DeterminantReadingKind;
  /** Enunciado del determinante, en lenguaje diagnóstico. */
  enunciado: string;
  /** Base que lo sustenta (señales, evidencia) o motivo de no evaluabilidad. */
  base: string;
}

export interface HealthReportReading {
  present: boolean;
  title?: string;
  /** Temas cubiertos por el Informe (títulos de secciones parseadas). */
  temas: string[];
}

export interface SalutogenicGroup {
  ambito: string;
  count: number;
  ejemplos: string[];
}

export interface SalutogenicReading {
  totalAssets: number;
  grupos: SalutogenicGroup[];
  sinClasificar: number;
}

export interface TerritorialInequalityReading {
  available: boolean;
  sourceTitles: string[];
  sourceCount: number;
  themes: string[];
  determinantStatements: string[];
  hasEracisOrPlizd: boolean;
  hasNeighbourhoodSignals: boolean;
  hasParticipatoryPrioritisation: boolean;
  cautions: string[];
  eracisContexto?: EracisMunicipalContext;
}

export interface SpaceKnowledge {
  interpretaciones: Array<{ enunciado: string; certeza: string; autorNombre: string }>;
  hipotesis: Array<{ enunciado: string; plausibilidad: string; preguntasResolutoras: string[] }>;
  lagunas: Array<{ formulacion: string; relevancia: string; urgencia: string }>;
}

export interface DiagnosticAnswers {
  /**
   * Fuentes de ciclos anteriores declarados por el equipo técnico. Ausente cuando
   * el expediente no declara ninguna: la ausencia deja el Perfil como estaba.
   */
  antecedentes?: CanonicalAntecedents;
  /** Conocimiento del técnico agrupado por espacio funcional. */
  porEspacio: Partial<Record<ProfileSpace, SpaceKnowledge>>;
  healthReport: HealthReportReading;
  /** Lectura epidemiológico-social de determinantes. */
  determinantes: DiagnosticDeterminantReading[];
  /** Señales presentes en la evidencia (para redactar la situación de salud). */
  senalesPresentes: string[];
  salutogenica: SalutogenicReading;
  /** Lectura sustantiva de los estudios complementarios (bloques diagnósticos). */
  estudios: ComplementaryStudiesReading;
  /** Referencias comparativas por indicador (valor demo, provincial, Andalucía). */
  referencias: ComplementaryIndicatorReferencesReading;
  /** Contexto municipal BADEA/IECA verificado, si existe para el ámbito. */
  badeaContexto?: BadeaMunicipalContext;
  /** Lectura de documentación territorial sobre desigualdades y determinantes. */
  desigualdadTerritorial: TerritorialInequalityReading;
  /** Contexto oficial ERACIS/PLIZD identificado, si existe para el ámbito. */
  eracisContexto?: EracisMunicipalContext;
  /** Hilo sanitario: lectura por presencia del cuerpo del Informe de salud. */
  sanitaria: HealthReportSanitaryReading;
  /**
   * Preguntas de contraste asistencial por UGC (N1b → N3), pre-construidas por la
   * capa intermedia `buildUGCAssistanceQuestions`. N3 las consume como preguntas
   * abiertas trazadas; NUNCA recorre las 384 señales directamente.
   */
  ugcAssistanceQuestions: UGCAssistanceQuestion[];
  /** Síntesis narrativa del técnico, si existe. */
  sintesisTexto?: string;
  /**
   * Léxico territorial derivado de la identidad del ámbito (municipio vs distrito
   * inframunicipal). Fuente única para adaptar las expresiones generadas de la
   * lectura sin sustituciones globales. Estructura transitoria (no persistida).
   */
  territorial: TerritorialLexicon;
}

export interface BuildDiagnosticAnswersInput {
  workspace: MunicipalityWorkspace;
  /** Determinantes documentados (títulos de átomos kind "determinant"). */
  determinantTitles: string[];
  /** Activos disponibles (título + contenido) para la lectura salutogénica. */
  assets: Array<{ title: string; content: string }>;
  /**
   * Títulos de los indicadores disponibles, para la lectura por bloques de los
   * estudios complementarios. Si no se pasan, se derivan del propio workspace.
   */
  indicatorTitles?: string[];
}

// ── Utilidades ────────────────────────────────────────────────────────────────

function normalize(value: string): string {
  const decomposed = value.normalize("NFD").toLowerCase();
  let out = "";
  for (let i = 0; i < decomposed.length; i++) {
    const code = decomposed.charCodeAt(i);
    const keep =
      (code >= 48 && code <= 57) || (code >= 97 && code <= 122) || code === 32;
    if (keep) out += decomposed[i];
  }
  return out;
}

function toSentenceCase(title: string): string {
  const clean = title.trim().replace(/\s+/g, " ");
  if (clean.length === 0) return clean;
  const lower = clean.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

// ── Lectura del Informe de Salud (sustantiva, sin atomizar) ──────────────────

const NON_THEMATIC_SECTION_RE = /portada|indice|índice|autores/i;

function readHealthReport(workspace: MunicipalityWorkspace): HealthReportReading {
  const hr = workspace.healthReport;
  if (!hr) return { present: false, temas: [] };
  const temas = (hr.sections ?? [])
    .filter((s) => s.title && !NON_THEMATIC_SECTION_RE.test(s.title))
    .map((s) => toSentenceCase(s.title))
    .slice(0, 6);
  return { present: true, title: hr.title, temas };
}

// ── Señales de los estudios y lectura epidemiológico-social ──────────────────

interface Senal {
  presente: boolean;
  etiqueta: string;
  claveDeterminante: string;
}

function detectarSenales(workspace: MunicipalityWorkspace): Senal[] {
  return [
    {
      presente: workspace.dukeStudy !== undefined,
      etiqueta: "apoyo social funcional",
      claveDeterminante: "redes",
    },
    {
      presente:
        workspace.ghq12Study !== undefined ||
        workspace.phq9Study !== undefined ||
        workspace.sf12Study !== undefined,
      etiqueta: "salud mental y salud percibida",
      claveDeterminante: "psicosocial",
    },
    {
      presente: workspace.suenoStudy !== undefined || workspace.psqiStudy !== undefined,
      etiqueta: "calidad y suficiencia del sueño",
      claveDeterminante: "psicosocial",
    },
    {
      presente: workspace.ipaqStudy !== undefined || workspace.sbqStudy !== undefined,
      etiqueta: "actividad física y sedentarismo",
      claveDeterminante: "entorno-urbano",
    },
    {
      presente:
        workspace.cageStudy !== undefined ||
        workspace.auditcStudy !== undefined ||
        workspace.fagerstromStudy !== undefined,
      etiqueta: "consumos de alcohol y tabaco",
      claveDeterminante: "consumos",
    },
    {
      presente: workspace.predimedStudy !== undefined,
      etiqueta: "alimentación",
      claveDeterminante: "entorno-alimentario",
    },
    {
      presente: workspace.ibseStudy !== undefined,
      etiqueta: "bienestar socioemocional escolar",
      claveDeterminante: "educativo-familiar",
    },
  ];
}

const TERRITORIAL_SOURCE_KINDS = new Set([
  "territorial-documentation",
  "complementary-study",
  "qualitative-material",
]);

interface TerritorialThemeRule {
  theme: string;
  determinantStatement: string;
  keywords: string[];
}

const TERRITORIAL_THEME_RULES: TerritorialThemeRule[] = [
  {
    theme: "vulnerabilidad social, barrios y desigualdad territorial",
    determinantStatement:
      "concentración territorial de vulnerabilidad social y exclusión",
    keywords: [
      "eracis",
      "plizd",
      "zona desfavorecida",
      "zonas desfavorecidas",
      "necesidades de transformacion social",
      "barrio",
      "barriada",
      "barriadas",
      "nucleos de poblacion",
      "exclusion social",
      "desigualdades sociales",
      "vulnerabilidad social",
    ],
  },
  {
    theme: "empleo, precariedad, renta y condiciones materiales de vida",
    determinantStatement:
      "empleo, precariedad, renta y condiciones materiales de vida",
    keywords: [
      "desempleo",
      "precariedad laboral",
      "paro registrado",
      "personas paradas",
      "renta",
      "ingreso minimo",
      "economia sumergida",
      "temporalidad",
    ],
  },
  {
    theme: "vivienda, espacio público, accesibilidad y entorno urbano",
    determinantStatement:
      "vivienda, espacio público, accesibilidad y entorno urbano",
    keywords: [
      "vivienda",
      "habitabilidad",
      "barreras arquitectonicas",
      "espacios verdes",
      "espacio publico",
      "limpieza",
      "iluminacion",
      "contaminacion",
      "ruidos",
      "accesibilidad",
      "entorno urbano",
      "medio rural",
    ],
  },
  {
    theme: "educación, infancia, juventud y trayectorias de aprendizaje",
    determinantStatement:
      "educación, infancia, juventud y trayectorias de aprendizaje",
    keywords: [
      "educacion",
      "absentismo",
      "acoso escolar",
      "centros educativos",
      "juventud",
      "jovenes",
      "formacion",
      "abandono escolar",
    ],
  },
  {
    theme: "redes familiares, salud mental, soledad y cuidados",
    determinantStatement:
      "redes de apoyo, salud mental, soledad y cuidados",
    keywords: [
      "salud emocional",
      "salud mental",
      "soledad",
      "aislamiento",
      "relaciones familiares",
      "cuidados",
      "personas mayores",
      "envejecimiento",
      "dependencia",
    ],
  },
  {
    theme: "participación ciudadana y priorización comunitaria",
    determinantStatement:
      "participación ciudadana y capacidad comunitaria",
    keywords: [
      "grupo motor",
      "priorizacion",
      "problemas priorizados",
      "cuestionario",
    ],
  },
];

function sourceTextForTerritorialReading(
  document: MunicipalityWorkspace["repository"]["documents"][number]
): string {
  return normalize(
    [
      document.title,
      document.sourceFileName ?? "",
      document.tags.join(" "),
      document.sourceText ?? "",
    ].join(" ")
  );
}

export function buildTerritorialInequalityReading(
  workspace: MunicipalityWorkspace
): TerritorialInequalityReading {
  const eracisContexto = getEracisMunicipalContext(
    workspace.municipality.identity.id
  );
  const candidateDocs = workspace.repository.documents.filter(
    (document) =>
      TERRITORIAL_SOURCE_KINDS.has(document.kind) &&
      (document.sourceText?.trim().length ?? 0) > 0
  );
  const sourceTitles = candidateDocs.map((document) => document.title);
  const texts = candidateDocs.map(sourceTextForTerritorialReading);
  const allText = texts.join(" ");

  const matchedRules = TERRITORIAL_THEME_RULES.filter((rule) =>
    rule.keywords.some((keyword) => allText.includes(normalize(keyword)))
  );
  const hasEracisOrPlizd =
    eracisContexto !== undefined ||
    ["eracis", "plizd", "zona desfavorecida", "zonas desfavorecidas"].some(
      (keyword) => allText.includes(normalize(keyword))
    );
  const hasNeighbourhoodSignals = [
    "barrio",
    "barriada",
    "barriadas",
    "nucleos de poblacion",
    "medio rural",
  ].some((keyword) => allText.includes(normalize(keyword)));
  const hasParticipatoryPrioritisation = [
    "priorizacion",
    "problemas priorizados",
    "grupo motor",
    "cuestionario",
  ].some((keyword) => allText.includes(normalize(keyword)));
  const hasMaterialInequalitySignals = [
    "desempleo",
    "precariedad laboral",
    "renta",
    "vivienda",
    "barreras arquitectonicas",
    "espacios verdes",
    "exclusion social",
    "desigualdades sociales",
    "vulnerabilidad social",
    "condiciones de vida",
  ].some((keyword) => allText.includes(normalize(keyword)));
  const available =
    hasEracisOrPlizd ||
    hasMaterialInequalitySignals ||
    hasParticipatoryPrioritisation;
  const activeRules = available ? matchedRules : [];

  const cautions = [
    "La documentación territorial no sustituye una desagregación cuantitativa por sexo, edad, renta u otros ejes de desigualdad.",
    "La lectura identifica determinantes y desigualdades plausibles o documentadas en el expediente; no atribuye causalidad sanitaria directa.",
  ];
  if (eracisContexto?.accessStatus === "listed-url-unreachable") {
    cautions.push(
      "El PLIZD/ERACIS consta en el listado oficial de la Junta, pero el PDF municipal enlazado no está incorporado como texto descargado al expediente."
    );
  }
  if (
    eracisContexto?.accessStatus === "officially-listed" &&
    eracisContexto.planUrl === undefined
  ) {
    cautions.push(
      "ERACIS/PLIZD consta como reconocimiento territorial oficial; el diagnóstico local completo no está incorporado como texto al expediente."
    );
  }

  return {
    available,
    sourceTitles,
    sourceCount: candidateDocs.length,
    themes: activeRules.map((rule) => rule.theme),
    determinantStatements: activeRules.map((rule) => rule.determinantStatement),
    hasEracisOrPlizd,
    hasNeighbourhoodSignals,
    hasParticipatoryPrioritisation,
    cautions,
    eracisContexto,
  };
}

/**
 * Lectura desde la epidemiología social: determinantes plausibles inferidos
 * con cautela del patrón de señales realmente presente. No afirma causalidad;
 * no recomienda; distingue documentado / plausible / no evaluable / a contrastar.
 */
export function inferSocialEpidemiologyDeterminants(
  workspace: MunicipalityWorkspace,
  determinantTitles: string[],
  salutogenica: SalutogenicReading,
  desigualdadTerritorial: TerritorialInequalityReading = buildTerritorialInequalityReading(
    workspace
  )
): DiagnosticDeterminantReading[] {
  const lecturas: DiagnosticDeterminantReading[] = [];
  const senales = detectarSenales(workspace).filter((s) => s.presente);
  const etiqueta = (clave: string): string[] =>
    senales.filter((s) => s.claveDeterminante === clave).map((s) => s.etiqueta);

  // 1. Documentados
  for (const titulo of determinantTitles.slice(0, 5)) {
    lecturas.push({
      kind: "documentado",
      enunciado: titulo,
      base: "determinante documentado directamente en la evidencia del repositorio",
    });
  }
  const fuentesTerritoriales = desigualdadTerritorial.sourceTitles
    .slice(0, 3)
    .join("; ");
  if (desigualdadTerritorial.hasEracisOrPlizd) {
    const zonasEracis =
      desigualdadTerritorial.eracisContexto?.disadvantagedZones.join(", ");
    lecturas.push({
      kind: "documentado",
      enunciado:
        "vulnerabilidad territorial reconocida por ERACIS/PLIZD como eje de desigualdad",
      base:
        desigualdadTerritorial.eracisContexto !== undefined
          ? `${desigualdadTerritorial.eracisContexto.municipalityName} figura en fuente oficial de la Junta de Andalucía como municipio con zona desfavorecida` +
            (zonasEracis ? ` (${zonasEracis})` : "") +
            `; el diagnóstico local completo debe incorporarse al expediente para lectura completa`
          : `señal ERACIS/PLIZD detectada en la documentación territorial del expediente (${fuentesTerritoriales})`,
    });
  }
  for (const statement of desigualdadTerritorial.determinantStatements.slice(0, 4)) {
    if (
      lecturas.some(
        (lectura) => normalize(lectura.enunciado) === normalize(statement)
      )
    ) {
      continue;
    }
    lecturas.push({
      kind: "documentado",
      enunciado: statement,
      base:
        fuentesTerritoriales.length > 0
          ? `documentación territorial o participativa del expediente: ${fuentesTerritoriales}`
          : "fuente territorial oficial identificada para el ámbito",
    });
  }

  // 2. Plausibles (solo si la señal correspondiente existe)
  const redes = etiqueta("redes");
  const psicosocial = etiqueta("psicosocial");
  if (redes.length > 0 || psicosocial.length > 0) {
    lecturas.push({
      kind: "plausible",
      enunciado: HIPOTESIS_PSICOSOCIAL,
      base:
        `patrón compatible con las señales de ${[...redes, ...psicosocial].join(", ")} ` +
        `presentes en la evidencia contextual`,
    });
  }
  const urbano = etiqueta("entorno-urbano");
  if (urbano.length > 0) {
    lecturas.push({
      kind: "plausible",
      enunciado: HIPOTESIS_ENTORNO_URBANO,
      base: `patrón compatible con las señales de ${urbano.join(", ")}`,
    });
  }
  const consumos = etiqueta("consumos");
  const alimentario = etiqueta("entorno-alimentario");
  if (consumos.length > 0 || alimentario.length > 0) {
    lecturas.push({
      kind: "plausible",
      enunciado: HIPOTESIS_CONSUMOS,
      base:
        `patrón compatible con las señales de ${[...consumos, ...alimentario].join(", ")}`,
    });
  }

  // 3. A contrastar: envejecimiento, si los activos lo sugieren
  const grupoMayores = salutogenica.grupos.find((g) =>
    g.ambito.includes("mayores")
  );
  if (grupoMayores !== undefined && grupoMayores.count >= 3) {
    lecturas.push({
      kind: "a-contrastar",
      enunciado:
        "envejecimiento y riesgo de soledad no deseada como eje territorial",
      base:
        `la concentración de activos orientados a personas mayores ` +
        `(${grupoMayores.count} recursos) sugiere un peso demográfico y ` +
        `comunitario de este eje que el Grupo Motor debe contrastar`,
    });
  }

  // 4. No evaluables con la evidencia disponible
  lecturas.push({
    kind: "no-evaluable",
    enunciado:
      desigualdadTerritorial.available
        ? "brechas cuantitativas internas por sexo, edad, renta u otros ejes"
        : "desigualdades internas por sexo, edad o condición socioeconómica",
    base:
      desigualdadTerritorial.available
        ? "la documentación territorial aporta señales de desigualdad y determinantes, pero no una matriz cuantitativa desagregada; esa ausencia no equivale a equidad"
        : "los agregados disponibles no están desagregados; la ausencia de dato " +
          "no equivale a ausencia de desigualdad",
  });
  if (
    !desigualdadTerritorial.themes.some((theme) =>
      /empleo|renta|vivienda|condiciones materiales/i.test(theme)
    )
  ) {
    lecturas.push({
      kind: "no-evaluable",
      enunciado: "condiciones materiales de vivienda, renta y empleo del ámbito",
      base:
        "no constan fuentes directas de escala suficiente en el expediente actual",
    });
  }

  return lecturas;
}

// ── Lectura salutogénica mínima ───────────────────────────────────────────────

const SALUTOGENIC_TAXONOMY: Array<{ ambito: string; claves: string[] }> = [
  { ambito: "personas mayores y envejecimiento activo", claves: ["mayores", "envejec", "jubil"] },
  { ambito: "salud mental y bienestar emocional", claves: ["salud mental", "psicolog", "emocional"] },
  { ambito: "prevención de adicciones y consumos", claves: ["adicc", "drogo", "alcohol", "tabaco", "proyecto hombre"] },
  { ambito: "tejido vecinal y participación comunitaria", claves: ["vecin", "particip", "comunitar", "asociacion cultural"] },
  { ambito: "vida activa y actividad física", claves: ["deport", "baile", "fisica", "swing"] },
  { ambito: "cuidados y atención sanitaria", claves: ["centro de salud", "hospital", "enfermer", "cardiac", "diabet", "pacientes", "sanitar", "cuidados"] },
  { ambito: "servicios sociales e inclusión", claves: ["servicios sociales", "inclusion", "cmss", "eracis", "vulnerab", "cruz roja"] },
  { ambito: "educación y promoción de la salud", claves: ["escuela", "educa", "formaci", "promocion de la salud", "prevencion"] },
];

export function buildSalutogenicReading(
  assets: Array<{ title: string; content: string }>
): SalutogenicReading {
  const grupos: SalutogenicGroup[] = SALUTOGENIC_TAXONOMY.map((g) => ({
    ambito: g.ambito,
    count: 0,
    ejemplos: [],
  }));
  let sinClasificar = 0;

  for (const asset of assets) {
    const texto = normalize(`${asset.title} ${asset.content}`);
    const grupo = SALUTOGENIC_TAXONOMY.findIndex((g) =>
      g.claves.some((clave) => texto.includes(normalize(clave)))
    );
    if (grupo === -1) {
      sinClasificar++;
      continue;
    }
    grupos[grupo].count++;
    if (grupos[grupo].ejemplos.length < 2) grupos[grupo].ejemplos.push(asset.title);
  }

  return {
    totalAssets: assets.length,
    grupos: grupos.filter((g) => g.count > 0).sort((a, b) => b.count - a.count),
    sinClasificar,
  };
}

// ── Conocimiento del técnico por espacio ──────────────────────────────────────

function knowledgeBySpace(
  perfil: PerfilLocalDeSalud | undefined
): Partial<Record<ProfileSpace, SpaceKnowledge>> {
  if (!perfil) return {};
  const resultado: Partial<Record<ProfileSpace, SpaceKnowledge>> = {};

  const ensure = (espacio: ProfileSpace): SpaceKnowledge => {
    if (!resultado[espacio]) {
      resultado[espacio] = { interpretaciones: [], hipotesis: [], lagunas: [] };
    }
    return resultado[espacio]!;
  };

  for (const i of perfil.interpretaciones.filter(
    (x: HealthProfileInterpretation) => x.status === "activa"
  )) {
    ensure(i.espacio).interpretaciones.push({
      enunciado: i.enunciado,
      certeza: i.certeza,
      autorNombre: i.autorNombre,
    });
  }
  for (const h of perfil.hipotesis.filter(
    (x: HealthProfileHypothesis) => x.status === "activa"
  )) {
    ensure(h.espacio).hipotesis.push({
      enunciado: h.enunciado,
      plausibilidad: h.plausibilidad,
      preguntasResolutoras: [...h.preguntasResolutoras],
    });
  }
  for (const q of perfil.preguntasAbiertas.filter(
    (x: HealthProfileOpenQuestion) => x.status === "abierta"
  )) {
    ensure(q.espacio).lagunas.push({
      formulacion: q.formulacion,
      relevancia: q.relevancia,
      urgencia: q.urgencia,
    });
  }
  return resultado;
}

// ── Punto de entrada ──────────────────────────────────────────────────────────

export function buildDiagnosticAnswers(
  input: BuildDiagnosticAnswersInput
): DiagnosticAnswers {
  // La lectura actual no usa las fuentes de ciclos anteriores; estas se presentan
  // aparte como antecedentes.
  const { workspace: fullWorkspace } = input;
  const workspace = excludeHistoricalSources(fullWorkspace);
  const antecedentes = buildAntecedents(
    fullWorkspace.repository.documents,
    fullWorkspace.evidenceStore.atoms,
    fullWorkspace.repository.conciliations
  );
  const salutogenica = buildSalutogenicReading(input.assets);
  const senalesPresentes = detectarSenales(workspace)
    .filter((s) => s.presente)
    .map((s) => s.etiqueta);
  const indicatorTitles =
    input.indicatorTitles ??
    workspace.evidenceStore.atoms
      .filter((a) => a.kind === "indicator")
      .map((a) => a.title);
  const desigualdadTerritorial = buildTerritorialInequalityReading(workspace);
  const eracisContexto = getEracisMunicipalContext(workspace.municipality.identity.id);

  return {
    ...(antecedentes !== undefined ? { antecedentes } : {}),
    porEspacio: knowledgeBySpace(workspace.perfilLocalDeSalud),
    healthReport: readHealthReport(workspace),
    determinantes: inferSocialEpidemiologyDeterminants(
      workspace,
      input.determinantTitles,
      salutogenica,
      desigualdadTerritorial
    ),
    senalesPresentes,
    salutogenica,
    estudios: buildComplementaryStudiesReading({ workspace, indicatorTitles }),
    referencias: buildIndicatorComparisonReferences({ workspace, indicatorTitles }),
    badeaContexto: getBadeaMunicipalContext(workspace.municipality.identity.id),
    desigualdadTerritorial,
    eracisContexto,
    sanitaria: buildHealthReportSanitaryReading(workspace.healthReport),
    ugcAssistanceQuestions: buildUGCAssistanceQuestions(
      buildUGCClinicalAssistanceReading(workspace)
    ),
    sintesisTexto: workspace.perfilLocalDeSalud?.sintesisTexto?.trim() || undefined,
    territorial: territorialLexicon(workspace.municipality.identity),
  };
}
