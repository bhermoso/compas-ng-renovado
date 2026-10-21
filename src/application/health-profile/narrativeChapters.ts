/**
 * narrativeChapters
 *
 * Organización narrativa del Perfil Local de Salud por determinantes.
 * Funciones puras y testeables: reciben datos ya calculados y devuelven
 * los capítulos del borrador institucional del Perfil.
 *
 * Reglas de producto que este módulo garantiza:
 *  - El Perfil concluye y orienta, pero no decide (CONTRACT-LHPM v1.5): el
 *    cuerpo compilado no formula recomendaciones; las orientaciones técnicas
 *    entran por el menú elegible (Art. 16 ter) y ningún capítulo fija
 *    actuaciones operativas, programas ni objetivos estratégicos.
 *  - La evidencia se selecciona y comenta, no se vuelca íntegra.
 *  - Las ausencias (determinantes, desagregaciones) se declaran como
 *    incertidumbres del diagnóstico, nunca se rellenan con contenido inventado.
 *  - El vocabulario territorial procede del ámbito (distrito / municipio /
 *    ámbito territorial), nunca se presupone "municipio".
 *
 * La generación se gobierna por las preguntas-motor del contrato de escritura
 * (profileWritingContract.DIAGNOSTIC_ENGINE_QUESTIONS) y respeta sus
 * fronteras (checkProfileWritingContract): señal → mecanismo social plausible
 * → determinante → desigualdad → capacidad → pregunta de contraste →
 * conclusión sin recomendación.
 */

import type { DiagnosticAnswers, SpaceKnowledge } from "./diagnosticAnswers";
import type { IndicatorComparisonReference } from "./complementaryIndicatorReferences";
import { formatIndicatorValue } from "./complementaryIndicatorReferences";
import type { ProfileSpace } from "../../domain/health-profile";

export interface NarrativeChapter {
  numeral: string;
  title: string;
  content: string;
}

// ── Estructura institucional del Perfil ───────────────────────────────────────
// El documento narrativo del Perfil Local de Salud tiene SEIS capítulos
// canónicos. La portada, la trazabilidad, el cierre interpretativo, el estado
// del conocimiento (EKC), las cautelas y la priorización (preparación
// deliberativa) son BLOQUES INSTITUCIONALES NO CAPITULARES: acompañan al
// documento sin numerarse como capítulos. No existe un séptimo capítulo.

/**
 * Versión del generador narrativo. Se incrementa manualmente cuando cambia
 * la escritura sustantiva de los capítulos (contrato de escritura). Un PSL
 * validado con una versión anterior conserva su texto (no se sobrescribe),
 * pero la UI avisa de que la narrativa ha evolucionado y de cómo regenerar.
 */
export const NARRATIVE_GENERATOR_VERSION = "2026-07-09-contrato-escritura-1";

export const NARRATIVE_CHAPTER_TITLES = [
  "Alcance, fuentes y escala de la evidencia",
  "Contexto territorial y sociodemográfico",
  "Situación de salud y desigualdades",
  "Determinantes sociales, comunitarios y ambientales",
  "Activos, capacidades territoriales e incertidumbres",
  "Conclusiones técnicas para la priorización",
] as const;

export interface NarrativeChaptersInput {
  /** Sustantivo del ámbito: "distrito" | "municipio" | "ámbito territorial". */
  scopeNoun: string;
  /** Provincia del ámbito, para situarlo territorialmente. */
  province?: string;
  /** Cautelas metodológicas declaradas por los estudios (deduplicadas). */
  studyCautions: string[];
  /** Hay cautelas de escala provincial / proxy / origen externo. */
  hasProxyScale: boolean;

  healthReportTitle?: string;
  complementaryStudyCount: number;
  /** Títulos de la documentación territorial diagnóstica (p. ej., Informes Vigía). */
  territorialDocTitles: string[];

  ibse?: { meanTotal: number; nValid: number; isProxy: boolean };

  indicatorCount: number;
  /** Títulos de los indicadores disponibles (para selección comentada). */
  indicatorTitles: string[];
  determinantCount: number;
  determinantTitles: string[];
  assetCount: number;
  assetTitles: string[];
  /**
   * Subconjunto de assetTitles cuyos activos se identifican expresamente con
   * el ámbito (p. ej., contienen su nombre). Prioridad en la muestra del Cap. V.
   */
  scopeMatchedAssetTitles: string[];
  hasLocalizaAssets: boolean;
  qualitativeCount: number;
  cautionCount: number;

  longitudinalNote: string;

  tensionesEscaladas: number;
  tensionesNoEscaladas: number;
  conflictos: number;
  limitacionesDiagnosticas: string[];

  /** Títulos de áreas con evidencia suficiente (no huecos analíticos). */
  areasReales: string[];

  /**
   * Respuestas diagnósticas (capa de conocimiento). Opcional: sin ella, los
   * capítulos se generan solo desde la evidencia agregada.
   */
  answers?: DiagnosticAnswers;
}

// ── Conocimiento del técnico: redacción por espacio ──────────────────────────
// Prioridad epistémica: interpretación (afirmación con certeza) > hipótesis
// (explicación candidata) > laguna (incertidumbre declarada).

function redactarConocimiento(
  answers: DiagnosticAnswers | undefined,
  espacios: ProfileSpace[]
): string[] {
  if (!answers) return [];
  const partes: string[] = [];
  for (const espacio of espacios) {
    const k: SpaceKnowledge | undefined = answers.porEspacio[espacio];
    if (!k) continue;
    for (const i of k.interpretaciones) {
      partes.push(
        `Lectura del equipo técnico (certeza ${i.certeza}): ${i.enunciado}`
      );
    }
    for (const h of k.hipotesis) {
      const resolutoras =
        h.preguntasResolutoras.length > 0
          ? ` La resolverían: ${h.preguntasResolutoras.join("; ")}.`
          : "";
      partes.push(
        `Hipótesis diagnóstica del equipo (plausibilidad ${h.plausibilidad}, ` +
        `pendiente de confirmación): ${h.enunciado}.${resolutoras}`
      );
    }
  }
  return partes;
}

function redactarLagunas(answers: DiagnosticAnswers | undefined): string[] {
  if (!answers) return [];
  const lagunas = Object.values(answers.porEspacio)
    .flatMap((k) => k?.lagunas ?? [])
    .sort((a, b) => (a.urgencia === "alta" ? -1 : b.urgencia === "alta" ? 1 : 0));
  return lagunas
    .slice(0, MAX_EJEMPLOS)
    .map(
      (l) =>
        `Laguna de conocimiento declarada (urgencia ${l.urgencia}): ` +
        `${l.formulacion} Importa porque ${l.relevancia}`
    );
}


const MAX_EJEMPLOS = 5;

// ── Indicadores trazadores: citas con valor, referencia y cautela ─────────────

/** Cita narrativa de un indicador: etiqueta + valor formateado. */
function citar(ref: IndicatorComparisonReference): string {
  return `${ref.narrativeLabel} se sitúa en ${formatIndicatorValue(
    ref.territorialValue,
    ref.unit
  )}`;
}

/**
 * Trazadores agrupados por bloque, en el orden de los bloques diagnósticos.
 * Máximo 2 por bloque (prioridad 1 y 2), para citar sin listar los 23.
 */
function trazadoresPorBloque(
  answers: DiagnosticAnswers | undefined
): Array<{ blockTitle: string; items: IndicatorComparisonReference[] }> {
  if (!answers) return [];
  const refs = answers.referencias.references.filter(
    (r) => r.tracerPriority !== undefined && r.territorialValue !== undefined
  );
  const grupos: Array<{ blockTitle: string; items: IndicatorComparisonReference[] }> = [];
  for (const bloque of answers.estudios.diagnosticBlocks) {
    const items = refs
      .filter((r) => r.diagnosticBlockId === bloque.id)
      .sort((a, b) => (a.tracerPriority ?? 9) - (b.tracerPriority ?? 9))
      .slice(0, 2);
    if (items.length > 0) grupos.push({ blockTitle: bloque.title, items });
  }
  return grupos;
}

function muestra(titles: string[]): string {
  const seleccion = titles.slice(0, MAX_EJEMPLOS).join("; ");
  return titles.length > MAX_EJEMPLOS
    ? `${seleccion}; entre otros (${titles.length} en total)`
    : seleccion;
}

export function buildNarrativeChapters(input: NarrativeChaptersInput): NarrativeChapter[] {
  const { scopeNoun } = input;
  const chapters: NarrativeChapter[] = [];

  // ── I. Alcance, fuentes y escala de la evidencia ──────────────────────────
  {
    const fuentes: string[] = [];
    if (input.healthReportTitle) {
      fuentes.push(
        `«${input.healthReportTitle}» actúa como fuente diagnóstica primaria del territorio.`
      );
    }
    if (input.complementaryStudyCount > 0) {
      fuentes.push(
        `El diagnóstico se apoya en ${input.complementaryStudyCount} estudios ` +
        `complementarios y en ${input.assetCount} activos y recursos identificados.`
      );
    }
    if (input.territorialDocTitles.length > 0) {
      fuentes.push(
        `La documentación territorial diagnóstica incorpora: ${muestra(input.territorialDocTitles)}.`
      );
    }

    // El bloque de alcance es compacto: una cautela principal literal y el
    // resto sintetizado. El detalle instrumento a instrumento vive en los
    // paneles de cada estudio y en el capítulo IV del Perfil, no aquí.
    const alcance: string[] = ["Alcance y escala de la evidencia disponible."];
    if (input.hasProxyScale) {
      alcance.push(
        `Parte de la evidencia de los estudios complementarios procede de ámbitos ` +
        `más amplios que el ${scopeNoun} (escala provincial u origen externo) ` +
        `y se incorpora como contexto exploratorio para orientar la interpretación: ` +
        `no constituye estimación específica del ${scopeNoun} y queda ` +
        `pendiente de contraste territorial.`
      );
    }
    // Procedencia de las referencias comparativas: los estudios organizan los
    // instrumentos e indicadores; las referencias provincial y autonómica no
    // forman parte de ellos, proceden de cálculos derivados de microdatos EAS.
    if (input.answers?.referencias.references.some((r) => r.demoProxy)) {
      const prov = input.province ? ` de ${input.province}` : "";
      alcance.push(
        `Los estudios complementarios organizan los instrumentos e indicadores; ` +
        `las referencias comparativas provincial y autonómica no forman parte de ` +
        `esos estudios: proceden de cálculos derivados de microdatos EAS —o de un ` +
        `monitor provincial equivalente— y se incorporan como base de contraste. ` +
        `En la demostración actual, parte de los valores territoriales se usa como ` +
        `proxy contextual coincidente con la referencia provincial${prov}, con la ` +
        `cautela de escala ya declarada.`
      );
    }
    if (input.studyCautions.length > 0) {
      const principal =
        input.studyCautions.find((c) => /proxy|contexto exploratorio/i.test(c)) ??
        input.studyCautions[0];
      const restantes = input.studyCautions.filter((c) => c !== principal).length;
      alcance.push(`Cautela principal declarada por los estudios: ${principal}`);
      if (restantes > 0) {
        alcance.push(
          `Constan además ${restantes} cautelas metodológicas específicas de ` +
          `instrumento (muestras, recodificaciones y límites de cada escala), ` +
          `consultables en el panel de cada estudio.`
        );
      }
    }

    chapters.push({
      numeral: "I",
      title: NARRATIVE_CHAPTER_TITLES[0],
      content: [...fuentes, alcance.join(" ")].join("\n\n"),
    });
  }

  // ── II. Contexto territorial y sociodemográfico ───────────────────────────
  {
    const esDistrito = scopeNoun === "distrito";
    const provincia = input.province ? ` de la provincia de ${input.province}` : "";
    const partes: string[] = [
      esDistrito
        ? `La lectura se realiza a escala de distrito: un ámbito inframunicipal ` +
          `que se inscribe en su municipio matriz${provincia}. Buena parte del ` +
          `conocimiento oficial se produce a escala de ciudad, de zona básica de ` +
          `salud o de provincia, y desciende al distrito solo como contexto; esta ` +
          `asimetría de escalas condiciona todo el capítulo de situación de salud.`
        : `La lectura se realiza a escala de ${scopeNoun}${provincia}.`,
      `La caracterización sociodemográfica específica debe tomarse de la fuente ` +
      `diagnóstica primaria${
        input.healthReportTitle ? ` («${input.healthReportTitle}»)` : ""
      } y de las fuentes oficiales de referencia; este capítulo no la sustituye.`,
    ];
    if (input.territorialDocTitles.length > 0) {
      partes.push(
        `La documentación territorial disponible (${muestra(input.territorialDocTitles)}) ` +
        `aporta la mirada de zona básica de salud y de entorno urbano: es el material ` +
        `con mayor proximidad territorial al ${scopeNoun} y el punto de partida para ` +
        `contrastar la evidencia contextual de mayor escala.`
      );
    }
    // Lectura sustantiva del Informe de Salud: qué cubre (secciones parseadas).
    if (input.answers?.healthReport.present && input.answers.healthReport.temas.length > 0) {
      partes.push(
        `La fuente diagnóstica primaria cubre la base oficial del diagnóstico en: ` +
        `${input.answers.healthReport.temas.join("; ")}. Es la fuente que ` +
        `estructura la lectura de situación de este Perfil: fija la base ` +
        `sociodemográfica y epidemiológica sobre la que se interpretan las ` +
        `señales de los estudios complementarios. El documento queda preservado ` +
        `íntegro en el expediente; su lectura sanitaria sustantiva abre el ` +
        `capítulo siguiente.`
      );
    }
    // Contexto municipal BADEA/IECA verificado (capa no evidencial): dato de
    // escala municipal, etiquetado como contexto de referencia, nunca como
    // estimación del ámbito inframunicipal.
    const badea = input.answers?.badeaContexto;
    if (badea !== undefined) {
      const lineas = badea.indicadores
        .map((i) =>
          typeof i.valor === "number"
            ? `${i.indicador.toLowerCase()}: ${i.valor}${i.unidad === "%" ? " %" : ` ${i.unidad ?? ""}`}`
            : `${i.indicador.toLowerCase()}: «${i.valor}»`
        )
        .join("; ");
      partes.push(
        badea.esProxyMunicipioMatriz
          ? `Contexto municipal de referencia (BADEA/IECA, consulta ` +
            `${badea.indicadores[0]?.consulta ?? ""}, año ${badea.anio}): el ` +
            `municipio matriz, ${badea.territorio} (INE ${badea.codigoINE}), ` +
            `presenta ${lineas}. Es un dato de escala municipal incorporado ` +
            `como contexto de referencia: no constituye una estimación específica ` +
            `del ${scopeNoun} ni resuelve la falta de desagregación interna.`
          : `Contexto BADEA/IECA (consulta ` +
            `${badea.indicadores[0]?.consulta ?? ""}, año ${badea.anio}) para ` +
            `${badea.territorio} (INE ${badea.codigoINE}): ${lineas}. Dato de ` +
            `escala municipal, sin desagregación interna.`
      );
    }
    partes.push(...redactarConocimiento(input.answers, ["contexto-territorial"]));
    partes.push(input.longitudinalNote);

    chapters.push({
      numeral: "II",
      title: NARRATIVE_CHAPTER_TITLES[1],
      content: partes.join("\n\n"),
    });
  }

  // ── III. Situación de salud y desigualdades ───────────────────────────────
  {
    const partes: string[] = [];
    const estudios = input.answers?.estudios;
    const bloques = estudios?.diagnosticBlocks ?? [];
    // Hilo sanitario: el Informe de salud gobierna la lectura de situación.
    // Señales por PRESENCIA real en el cuerpo del Informe (nada inventado);
    // las magnitudes exactas quedan en el propio documento.
    const sanitaria = input.answers?.sanitaria;
    if (sanitaria?.present && sanitaria.senales.length > 0) {
      const dims = sanitaria.senales.map((s) => s.dimension);
      const destacadas = sanitaria.senales.slice(0, 2).map((s) => s.dimension);
      const extensionEstudios = bloques.length > 0
        ? ` Los estudios complementarios amplían este hilo hacia la vida ` +
          `cotidiana y el bienestar, sin sustituirlo.`
        : "";
      partes.push(
        `El ${input.healthReportTitle ?? "Informe de salud"} gobierna el hilo ` +
        `sanitario de este capítulo. Su análisis epidemiológico y de problemas ` +
        `de salud trata de forma sustantiva: ${dims.join("; ")} — con atención ` +
        `destacada a ${destacadas.join(" y a ")}. Esta es la fotografía ` +
        `sanitaria de partida del ${scopeNoun}; las magnitudes concretas ` +
        `constan en el propio Informe.${extensionEstudios}`
      );
    }
    if (bloques.length > 0) {
      // Contrato de escritura: la situación de salud se lee como expresión de
      // la vida cotidiana del territorio; los estudios son señales, no el
      // centro automático del Perfil.
      partes.push(
        `La situación de salud se lee aquí como expresión de la vida cotidiana ` +
        `del ${scopeNoun}: cómo se duerme y se descansa, cuánto apoyo cercano ` +
        `se tiene, cuánto se mueve la gente, qué se come y cómo se sienten sus ` +
        `escolares. Los estudios complementarios no son el centro del Perfil: ` +
        `son señales de esa vida cotidiana que la lectura interpreta.`
      );
      // Lectura sustantiva: los estudios no se cuentan, se leen por bloques.
      const ordinales = [
        "El primero",
        "el segundo",
        "el tercero",
        "el cuarto",
        "el quinto",
        "el sexto",
      ];
      const enumeracion = bloques
        .slice(0, ordinales.length)
        .map(
          (b, i) =>
            `${ordinales[i]} se refiere a ${b.title}, sostenido por ` +
            `${b.supportingStudies.join(", ")} (${b.supportingIndicators.length} ` +
            `indicadores)`
        )
        .join("; ");
      partes.push(
        `Los ${estudios!.totalStudies} estudios complementarios no aportan solo ` +
        `${estudios!.totalIndicators} indicadores aislados: organizan la lectura ` +
        `diagnóstica en ${bloques.length} bloques interpretables de salud y ` +
        `bienestar. ${enumeracion}. Estos bloques proceden de la evidencia ` +
        `contextual descrita en el capítulo I: describen patrones plausibles de ` +
        `salud y estilos de vida, pero no miden el ${scopeNoun} ni permiten ` +
        `inferencia directa sobre su población.` +
        (estudios!.unclassifiedIndicators.length > 0
          ? ` Quedan ${estudios!.unclassifiedIndicators.length} indicadores fuera ` +
            `de esta agrupación, consultables en el panel de cada estudio.`
          : "")
      );
      // Indicadores trazadores: qué aporta cada bloque, con valor citado,
      // referencia comparativa y cautela de procedencia.
      const trazadores = trazadoresPorBloque(input.answers);
      if (trazadores.length > 0) {
        const prov = input.province ? ` de ${input.province}` : "";
        partes.push(
          `Indicadores trazadores por bloque: ` +
          trazadores
            .map((g) => `en ${g.blockTitle}, ${g.items.map(citar).join(" y ")}`)
            .join("; ") +
          `. Cuando el instrumento procede de cálculos derivados de microdatos ` +
          `EAS o del monitor provincial, el valor territorial demo coincide con ` +
          `la referencia provincial${prov} (comportamiento demo/proxy): esta ` +
          `lectura remite a la cautela de escala del capítulo I y permite usar ` +
          `cada indicador como punto de contraste territorial. ` +
          `La referencia autonómica de Andalucía se incorpora cuando existe ` +
          `fixture EAS metodológicamente equivalente; en instrumentos sin ` +
          `referencia autonómica equivalente queda declarada como no disponible, ` +
          `sin inventarse dato. La trazabilidad completa de los ` +
          `${input.answers!.referencias.coverage.total} indicadores (valor, ` +
          `referencias, procedencia y cautelas) consta en el anexo técnico. ` +
          `Cada trazador abre una pregunta diagnóstica más que cierra un dato: ` +
          `¿qué condiciones de vida del ${scopeNoun} producen este patrón? Esa ` +
          `pregunta, y no la cifra aislada, es la que pasa a la interpretación.`
        );
      }
    } else if (input.indicatorCount > 0) {
      const seleccion = input.indicatorTitles.slice(0, 4);
      partes.push(
        `La evidencia cuantitativa disponible reúne ${input.indicatorCount} ` +
        `indicadores de salud y bienestar procedentes de los estudios complementarios.` +
        (seleccion.length > 0
          ? ` Entre las señales que ordenan la lectura: ${seleccion.join("; ")}` +
            (input.indicatorTitles.length > seleccion.length
              ? `; entre otras (${input.indicatorTitles.length} en total).`
              : ".") +
            ` Estas señales proceden de la evidencia contextual descrita en el ` +
            `capítulo I: orientan sobre patrones plausibles de salud y estilos de ` +
            `vida, pero no miden el ${scopeNoun} ni permiten inferencia directa ` +
            `sobre su población.`
          : "")
      );
    }
    if (input.ibse && Number.isFinite(input.ibse.meanTotal)) {
      const valorBase =
        `El bienestar socioemocional escolar (IBSE) se sitúa en ` +
        `${input.ibse.meanTotal.toFixed(1)} sobre 100 en una muestra de ` +
        `${input.ibse.nValid} escolares.`;
      partes.push(
        input.ibse.isProxy
          ? `${valorBase} Procede de evidencia contextual, incorporada como ` +
            `referencia exploratoria dentro de la cautela de escala del ` +
            `capítulo I.`
          : `${valorBase} Este dato debe interpretarse en relación con el contexto ` +
            `socioeconómico y los determinantes familiares y comunitarios del territorio.`
      );
    }
    // Señales que ordenan la situación de salud (desde la capa de respuestas).
    if ((input.answers?.senalesPresentes.length ?? 0) > 0) {
      partes.push(
        `El diagnóstico apunta a una situación de salud caracterizada, en la ` +
        `evidencia contextual disponible, por señales en: ` +
        `${input.answers!.senalesPresentes.join("; ")}. Estas señales dibujan un ` +
        `patrón de salud percibida, hábitos y bienestar que constituye el punto ` +
        `de partida de la interpretación, siempre dentro de la cautela de escala ` +
        `declarada en el capítulo I.`
      );
    }
    partes.push(...redactarConocimiento(input.answers, ["situacion-salud", "desigualdades"]));
    const desigualdadTerritorial = input.answers?.desigualdadTerritorial;
    if (desigualdadTerritorial?.available) {
      const fuentes = desigualdadTerritorial.sourceTitles.slice(0, 3).join("; ");
      const temas = desigualdadTerritorial.themes.slice(0, 4).join("; ");
      const eracis = desigualdadTerritorial.eracisContexto;
      const zonasEracis = eracis?.disadvantagedZones.join(", ");
      partes.push(
        `La desigualdad no queda reducida aquí a la falta de tablas desagregadas. ` +
        `La documentación territorial del expediente` +
        (fuentes.length > 0 ? ` (${fuentes})` : "") +
        ` aporta señales sobre ${temas || "vulnerabilidad social y territorio"}: ` +
        `barrios o núcleos, condiciones materiales, entorno urbano, participación ` +
        `y experiencia local aparecen como claves para interpretar la situación ` +
        `de salud. ` +
        (eracis !== undefined
          ? `${eracis.municipalityName} figura además en fuente oficial de la ` +
            `Junta de Andalucía como municipio con zona desfavorecida` +
            (zonasEracis ? ` (${zonasEracis})` : "") +
            `; este dato confirma que la desigualdad territorial es una fuente ` +
            `pertinente, aunque el diagnóstico local completo deba incorporarse ` +
            `al expediente para lectura completa. `
          : "") +
        `Lo que sigue faltando es la matriz cuantitativa fina: sexo, edad, renta, ` +
        `barrios y otros ejes no están armonizados en una serie interna comparable. ` +
        `Esa ausencia es una incertidumbre de equidad, no un indicio de equidad.`
      );
    } else {
      partes.push(
        `Con la evidencia disponible no es posible caracterizar desigualdades internas ` +
        `del ${scopeNoun}: los agregados no están desagregados por sexo, edad ni ` +
        `condición socioeconómica. Esta ausencia es una incertidumbre del diagnóstico, ` +
        `no un indicio de equidad.`
      );
    }

    chapters.push({
      numeral: "III",
      title: NARRATIVE_CHAPTER_TITLES[2],
      content: partes.join("\n\n"),
    });
  }

  // ── IV. Determinantes sociales, comunitarios y ambientales ────────────────
  {
    const partes: string[] = [];
    const territorialReading = input.answers?.desigualdadTerritorial;
    if (input.determinantCount > 0) {
      partes.push(
        `Se han documentado ${input.determinantCount} determinantes de la salud ` +
        `en el territorio; entre ellos: ${muestra(input.determinantTitles)}. ` +
        `Su interpretación corresponde al equipo técnico y al Grupo Motor en su ` +
        `contexto local.`
      );
    } else if (territorialReading?.available) {
      partes.push(
        `El repositorio no contiene todavía átomos específicos de tipo determinante, ` +
        `pero sí documentación territorial capaz de sostener una lectura de ` +
        `determinantes sociales. La diferencia es importante: el problema no es ` +
        `ausencia de contenido, sino falta de atomización fina de documentos que ya ` +
        `hablan del territorio, sus barrios, sus condiciones materiales y sus ` +
        `procesos participativos.`
      );
    } else {
      partes.push(
        `La base de evidencia actual no documenta determinantes sociales, ` +
        `comunitarios o ambientales específicos del ${scopeNoun} de forma directa. ` +
        `Esta carencia condiciona la lectura, pero no impide la interpretación: ` +
        `la epidemiología social permite formular hipótesis diagnósticas prudentes ` +
        `a partir del patrón de señales disponible.`
      );
    }

    // Lectura desde la epidemiología social: documentado / plausible /
    // no evaluable / a contrastar. Hipótesis, nunca causalidad demostrada.
    const lecturas = input.answers?.determinantes ?? [];
    const documentados = lecturas.filter((d) => d.kind === "documentado");
    const plausibles = lecturas.filter((d) => d.kind === "plausible");
    const aContrastar = lecturas.filter((d) => d.kind === "a-contrastar");
    const noEvaluables = lecturas.filter((d) => d.kind === "no-evaluable");
    if (documentados.length > 0) {
      partes.push(
        `Determinantes documentados por las fuentes del expediente: ` +
        documentados
          .map((d) => `${d.enunciado} (${d.base})`)
          .join("; ") +
        `. Esta lectura no convierte la documentación territorial en prueba ` +
        `causal, pero impide tratar como vacío lo que el expediente ya describe.`
      );
    }
    if (plausibles.length > 0) {
      partes.push(
        `Lectura desde la epidemiología social. La evidencia disponible sugiere, ` +
        `como hipótesis diagnósticas plausibles y pendientes de contraste, que en ` +
        `el patrón observado pueden estar operando como mecanismos sociales: ` +
        plausibles
          .map((d) => `${d.enunciado} (${d.base})`)
          .join("; ") +
        `. Ninguna de estas lecturas constituye causalidad demostrada: son ` +
        `hipótesis trazables, y el conocimiento experiencial del Grupo Motor y ` +
        `del vecindario —mecanismos, barreras, significados, accesibilidad ` +
        `real— es la fuente llamada a confirmarlas, matizarlas o desmentirlas.`
      );
      // Trazabilidad hipótesis ← bloques: qué bloque del capítulo III sostiene
      // cada hipótesis (vínculo por identidad textual del enunciado).
      const bloquesIV = input.answers?.estudios.diagnosticBlocks ?? [];
      const sustentos = plausibles
        .map((d) => {
          const soportes = bloquesIV
            .filter((b) => b.relatedDeterminantHypotheses.includes(d.enunciado))
            .map((b) => b.title);
          if (soportes.length === 0) return undefined;
          const sujeto =
            soportes.length > 1
              ? `los bloques de ${soportes.join(" y de ")} sostienen`
              : `el bloque de ${soportes[0]} sostiene`;
          return `${sujeto} la hipótesis sobre ${d.enunciado}`;
        })
        .filter((s): s is string => s !== undefined);
      if (sustentos.length > 0) {
        partes.push(
          `Los bloques diagnósticos del capítulo III sostienen esta lectura: ` +
          `${sustentos.join("; ")}. Son hipótesis plausibles, trazables y ` +
          `pendientes de contraste territorial.`
        );
      }
      // Anclaje a indicadores: cada hipótesis se apoya en trazadores citados
      // con su valor, no solo en el nombre del bloque.
      const refsIV = (input.answers?.referencias.references ?? []).filter(
        (r) => r.tracerPriority !== undefined && r.territorialValue !== undefined
      );
      const anclajes = plausibles
        .map((d) => {
          const bloquesHipotesis = bloquesIV
            .filter((b) => b.relatedDeterminantHypotheses.includes(d.enunciado))
            .map((b) => b.id);
          const trazadores = refsIV
            .filter((r) => bloquesHipotesis.includes(r.diagnosticBlockId))
            .sort((a, b) => (a.tracerPriority ?? 9) - (b.tracerPriority ?? 9))
            .slice(0, 3);
          if (trazadores.length === 0) return undefined;
          const corto = d.enunciado.split(" (")[0];
          return (
            `la hipótesis sobre ${corto} se ancla en ` +
            trazadores
              .map(
                (r) =>
                  `${r.narrativeLabel} ` +
                  `(${formatIndicatorValue(r.territorialValue, r.unit)})`
              )
              .join(", ")
          );
        })
        .filter((s): s is string => s !== undefined);
      if (anclajes.length > 0) {
        partes.push(
          `Las hipótesis quedan ancladas a indicadores trazadores concretos, no ` +
          `solo al nombre de los bloques: ${anclajes.join("; ")}. Los valores ` +
          `citados son referencia contextual con la cautela de escala del ` +
          `capítulo I: sostienen hipótesis plausibles pendientes de contraste, ` +
          `nunca causalidad demostrada.`
        );
      }
    }
    if (aContrastar.length > 0) {
      partes.push(
        `Determinantes a contrastar: ` +
        aContrastar.map((d) => `${d.enunciado} — ${d.base}`).join("; ") + `.`
      );
    }
    if (noEvaluables.length > 0) {
      partes.push(
        `Determinantes no evaluables con la evidencia actual: ` +
        noEvaluables
          .map((d) => `${d.enunciado} (${d.base})`)
          .join("; ") + `.`
      );
    }
    partes.push(...redactarConocimiento(input.answers, ["determinantes"]));
    if (input.limitacionesDiagnosticas.length > 0) {
      partes.push(input.limitacionesDiagnosticas.join(" "));
    }

    chapters.push({
      numeral: "IV",
      title: NARRATIVE_CHAPTER_TITLES[3],
      content: partes.join("\n\n"),
    });
  }

  // ── V. Activos, capacidades territoriales e incertidumbres ────────────────
  {
    const partes: string[] = [];
    if (input.assetCount > 0) {
      // Muestra curada: primero los activos que se identifican expresamente con
      // el ámbito; después, los del municipio matriz o del entorno funcional.
      const propios = input.scopeMatchedAssetTitles;
      const resto = input.assetTitles.filter((t) => !propios.includes(t));
      const ordenados = [...propios, ...resto];
      const seleccion = ordenados.slice(0, MAX_EJEMPLOS).join("; ");
      const sufijo =
        ordenados.length > MAX_EJEMPLOS
          ? `; entre otros (${ordenados.length} en total)`
          : "";
      const identificacion =
        propios.length > 0
          ? ` De ellos, ${propios.length} se identifican expresamente con el ` +
            `${scopeNoun}; el resto corresponde al municipio matriz o al entorno ` +
            `funcional, sin que el inventario permita atribuirlos con precisión.`
          : "";
      partes.push(
        `El territorio dispone de ${input.assetCount} activos y recursos para la ` +
        `salud identificados; entre ellos: ${seleccion}${sufijo}.${identificacion} ` +
        `La lectura salutogénica del territorio no se agota en sus déficits: ` +
        `estas capacidades son punto de partida del proceso comunitario.`
      );
      // Lectura salutogénica mínima: capacidades por ámbito, derivadas del
      // contenido real de los activos. Capacidades potenciales, no soluciones.
      const grupos = input.answers?.salutogenica.grupos ?? [];
      if (grupos.length > 0) {
        const top = grupos.slice(0, 4);
        partes.push(
          `La lectura salutogénica identifica concentraciones de capacidad ` +
          `comunitaria en: ` +
          top
            .map((g) => `${g.ambito} (${g.count} recursos; p. ej., ${g.ejemplos.join(", ")})`)
            .join("; ") +
          (grupos.length > top.length || (input.answers?.salutogenica.sinClasificar ?? 0) > 0
            ? `; junto a otros recursos de clasificación menos directa.`
            : `.`) +
          ` Estas concentraciones describen capacidades potenciales del tejido ` +
          `territorial —no prueban cobertura ni resultado— y dialogan con las ` +
          `hipótesis del capítulo IV: allí donde el patrón sugiere ejes de ` +
          `atención, el mapa de activos indica con qué capacidades podría ` +
          `trabajarse en la fase comunitaria.` +
          ((input.answers?.estudios.diagnosticBlocks.length ?? 0) > 0
            ? ` Esta concentración de activos dialoga también con los bloques ` +
              `diagnósticos del capítulo III, sin que ello pruebe capacidad ` +
              `suficiente ni cobertura territorial.`
            : "")
        );
      }
      if (input.hasLocalizaAssets) {
        partes.push(
          `Los activos proceden de la consulta de Localiza Salud. ` +
          `En un ámbito inframunicipal pueden incluir recursos del municipio matriz ` +
          `o del entorno funcional más amplio: requieren validación territorial ` +
          `antes de interpretarse como activos propios del ${scopeNoun}.`
        );
      }
      // Contrato de escritura: si un activo es capacidad real —accesible,
      // activa, conocida— solo puede confirmarlo el conocimiento comunitario.
      partes.push(
        `Si estos recursos son capacidades reales —accesibles, activas, ` +
        `conocidas por quienes los necesitan— es algo que solo el conocimiento ` +
        `comunitario puede confirmar: se presentan como capacidades potenciales, ` +
        `reconocidas o pendientes de validación, conectadas con los desafíos ` +
        `del capítulo IV.` +
        (input.qualitativeCount < 2
          ? ` La experiencia vivida del vecindario apenas está representada en ` +
            `el expediente (${input.qualitativeCount} elemento cualitativo): es ` +
            `conocimiento pendiente de incorporación —los mecanismos, barreras ` +
            `y significados que solo la comunidad puede aportar—, no un vacío ` +
            `del territorio.`
          : "")
      );
      partes.push(...redactarConocimiento(input.answers, ["activos"]));
    } else {
      partes.push(
        `No se han incorporado todavía activos ni capacidades comunitarias al ` +
        `diagnóstico del ${scopeNoun}.`
      );
    }

    const incertidumbres: string[] = [];
    if (input.cautionCount > 0) {
      incertidumbres.push(
        `${input.cautionCount} cautelas metodológicas condicionan la interpretación.`
      );
    }
    const noConvergentes = input.tensionesNoEscaladas + input.conflictos;
    if (noConvergentes > 0) {
      incertidumbres.push(
        `Las fuentes ofrecen lecturas no plenamente convergentes en ` +
        `${noConvergentes} aspecto(s), que señalan dónde el conocimiento ` +
        `disponible es más incierto.`
      );
    }
    if (input.hasProxyScale) {
      incertidumbres.push(
        `La escala de parte de la evidencia (contexto provincial u origen externo) ` +
        `es la principal incertidumbre del diagnóstico y queda pendiente de ` +
        `contraste territorial.`
      );
    }
    if (incertidumbres.length > 0) {
      partes.push(`Incertidumbres del diagnóstico. ${incertidumbres.join(" ")}`);
    }
    // Lagunas de conocimiento declaradas por el técnico: información positiva.
    partes.push(...redactarLagunas(input.answers));

    chapters.push({
      numeral: "V",
      title: NARRATIVE_CHAPTER_TITLES[4],
      content: partes.join("\n\n"),
    });
  }

  // ── VI. Conclusiones técnicas para la priorización ────────────────────────
  {
    const partes: string[] = [];

    // Síntesis del técnico, si existe: encabeza y modula el cierre diagnóstico.
    if (input.answers?.sintesisTexto) {
      partes.push(
        `Síntesis diagnóstica del equipo técnico. ${input.answers.sintesisTexto}`
      );
    }

    // Conclusión técnica generada: sustantiva, trazable y sin recomendaciones.
    const conclusion: string[] = [];
    if ((input.answers?.senalesPresentes.length ?? 0) > 0) {
      conclusion.push(
        `El diagnóstico apunta a un ${scopeNoun} cuya situación de salud, leída ` +
        `desde la evidencia contextual disponible, se ordena en torno a ` +
        `${input.answers!.senalesPresentes.slice(0, 4).join(", ")}` +
        `${input.answers!.senalesPresentes.length > 4 ? ", entre otras señales" : ""}.`
      );
    }
    const bloquesVI = input.answers?.estudios.diagnosticBlocks ?? [];
    if (bloquesVI.length > 0) {
      // Cita de un trazador principal por bloque: la conclusión se apoya en
      // indicadores concretos, siempre con la cautela de escala del capítulo I.
      const citasVI = trazadoresPorBloque(input.answers)
        .map((g) => g.items[0])
        .map(
          (r) =>
            `${r.narrativeLabel} ` +
            `(${formatIndicatorValue(r.territorialValue, r.unit)})`
        );
      conclusion.push(
        `La principal aportación de los estudios complementarios es ordenar el ` +
        `diagnóstico en bloques de salud y bienestar ` +
        `—${bloquesVI.map((b) => b.title).join("; ")}— que permiten pasar de ` +
        `indicadores dispersos a hipótesis contrastables` +
        (citasVI.length > 0
          ? `, apoyadas en indicadores trazadores concretos: ` +
            `${citasVI.join("; ")}, siempre dentro de la cautela de escala ` +
            `declarada en el capítulo I.`
          : `.`)
      );
    }
    const plausiblesVI = (input.answers?.determinantes ?? []).filter(
      (d) => d.kind === "plausible" || d.kind === "a-contrastar"
    );
    if (plausiblesVI.length > 0) {
      conclusion.push(
        `La lectura epidemiológico-social permite formular como hipótesis que ` +
        `en ese patrón pueden estar operando ` +
        plausiblesVI.slice(0, 3).map((d) => d.enunciado).join("; ") +
        `.`
      );
    }
    const gruposVI = input.answers?.salutogenica.grupos ?? [];
    if (gruposVI.length > 0) {
      conclusion.push(
        `Las capacidades territoriales se concentran en ` +
        gruposVI.slice(0, 3).map((g) => g.ambito).join(", ") +
        `, y constituyen la base salutogénica del proceso comunitario.`
      );
    }
    if (input.hasProxyScale) {
      conclusion.push(
        `La principal tensión interpretativa es de escala: buena parte de la ` +
        `evidencia es contextual (provincial u origen externo) y queda pendiente ` +
        `de contraste territorial.`
      );
    }
    if (conclusion.length > 0) {
      partes.push(conclusion.join(" "));
    }

    // Líneas prioritarias diagnósticas: ámbitos que pasan a deliberación.
    // Primero las candidaturas específicas del diagnóstico (hipótesis y
    // evidencia propia); las áreas técnicas genéricas cierran la lista y no
    // encabezan la deliberación.
    const lineas: string[] = [];
    for (const d of plausiblesVI.slice(0, 2)) {
      lineas.push(`contraste territorial de la hipótesis sobre ${d.enunciado}`);
    }
    if (input.hasProxyScale) {
      lineas.push(
        `construcción de evidencia propia del ${scopeNoun} que confirme o matice el patrón contextual`
      );
    }
    for (const area of input.areasReales) lineas.push(area);
    if (lineas.length > 0) {
      partes.push(
        `Ámbitos diagnósticos que pasan a deliberación como prioridades ` +
        `diagnósticas potenciales: ` +
        lineas.map((l, i) => `${i + 1}) ${l}`).join("; ") +
        `. Son candidaturas para la deliberación con el Grupo Motor, ` +
        `no decisiones definitivas.`
      );
    } else {
      partes.push(
        `La evidencia disponible no permite todavía formular candidaturas ` +
        `territoriales específicas: la deliberación con el Grupo Motor debe ` +
        `partir del contraste de la evidencia contextual y de la ampliación ` +
        `de la base diagnóstica propia del ${scopeNoun}.`
      );
    }
    if (input.tensionesEscaladas > 0) {
      partes.push(
        "El diagnóstico identifica aspectos del territorio donde las fuentes " +
        "disponibles ofrecen lecturas que conviene contrastar con el Grupo Motor " +
        "antes de trasladarlas a prioridades de planificación."
      );
    }
    // Preguntas de contraste territorial que los bloques dejan abiertas.
    const preguntasVI = input.answers?.estudios.contrastQuestions ?? [];
    if (preguntasVI.length > 0) {
      partes.push(
        `Preguntas de contraste territorial que el diagnóstico deja abiertas ` +
        `para la deliberación: ${preguntasVI.slice(0, 3).join(" ")}`
      );
    }
    partes.push(...redactarConocimiento(input.answers, ["sintesis", "preparacion-deliberativa"]));

    // Contrato de escritura: la deliberación produce conocimiento; el texto
    // anima a la acción futura sin anticiparla ni recomendarla.
    partes.push(
      `Este diagnóstico no es un expediente cerrado sino una lectura viva del ` +
      `territorio: cada hipótesis y cada pregunta abierta invitan a mirar de ` +
      `cerca la vida cotidiana del ${scopeNoun}. La deliberación que sigue es ` +
      `producción de conocimiento, no un trámite de validación: el Grupo Motor ` +
      `aporta lo que ningún dato contiene —cómo se viven los recursos, qué ` +
      `barreras operan, qué significan las señales— y prepara la acción futura ` +
      `sin anticiparla: las decisiones corresponden a la fase posterior de ` +
      `planificación.`
    );

    // Cierre único: frontera de fase y validación. (Única mención a la autoría
    // pendiente en todo el documento: el Grupo Motor valida y prioriza, no
    // redacta el diagnóstico desde cero.)
    partes.push(
      "Este capítulo cierra el diagnóstico: no formula recomendaciones, " +
      "actuaciones ni programas. La traducción a prioridades y acciones " +
      "corresponde a las fases posteriores del proceso de planificación. " +
      "Corresponde al equipo técnico validar, matizar y asumir la autoría de " +
      "esta síntesis; al Grupo Motor, contrastarla y priorizar."
    );

    chapters.push({
      numeral: "VI",
      title: NARRATIVE_CHAPTER_TITLES[5],
      content: partes.join("\n\n"),
    });
  }

  return chapters;
}

export function renderNarrativeChapters(chapters: NarrativeChapter[]): string {
  return chapters
    .map((c) => `${c.numeral}. ${c.title}\n\n${c.content}`)
    .join("\n\n\n");
}

/**
 * Operación inversa de renderNarrativeChapters: recupera los capítulos desde
 * el texto del documento (generado o de autoría humana que conserve la
 * estructura). Si el texto no tiene estructura de capítulos reconocible,
 * devuelve una lista vacía y quien llama debe usar el texto íntegro.
 */
export function parseNarrativeChapters(text: string): NarrativeChapter[] {
  const segments = text.split("\n\n\n");
  const chapters: NarrativeChapter[] = [];
  for (const segment of segments) {
    const headerEnd = segment.indexOf("\n\n");
    if (headerEnd === -1) return [];
    const header = segment.slice(0, headerEnd).trim();
    const match = /^([IVX]+)\.\s+(.+)$/.exec(header);
    if (match === null) return [];
    chapters.push({
      numeral: match[1],
      title: match[2],
      content: segment.slice(headerEnd + 2).trim(),
    });
  }
  return chapters.length >= 2 ? chapters : [];
}
