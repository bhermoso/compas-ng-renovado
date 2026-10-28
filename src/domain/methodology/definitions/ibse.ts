import type { MethodologicalModule } from "../MethodologicalModule";

// Definición canónica del Índice de Bienestar Socioemocional (IBSE).
//
// Estado: "draft" — los textos oficiales de los 8 ítems no han sido contrastados
// con la fuente primaria (Bericat, 2014). La estructura de factores, el algoritmo
// y el adaptador REDCap sí están verificados contra la implementación en uso.
// El módulo no debe marcarse como "validated" hasta completar esa revisión.
//
// Nota sobre el algoritmo:
// El algoritmo canónico opera sobre respuestas individuales crudas (individual-responses).
// La implementación actual recibe puntuaciones ya calculadas por REDCap por participante
// (pre-aggregated), lo que es una limitación del adaptador, no del instrumento.

export const IBSE_MODULE: MethodologicalModule = {
  identity: {
    id: "ibse",
    version: "1.0.0",
    status: "draft",
    category: "validated-scale",
    name: "Índice de Bienestar Socioemocional",
    shortName: "IBSE",
    description:
      "Instrumento de medición del bienestar socioemocional mediante 8 ítems " +
      "agrupados en 4 factores y un índice total. Se aplica a la " +
      "población general, con muestras municipales de distintas edades.",
    purpose:
      "Evaluar el estado de bienestar subjetivo de la población participante en sus " +
      "dimensiones de vínculo, situación vital, control percibido y aspectos personales.",
    // El instrumento es de origen escolar, pero NO es exclusivamente escolar: una
    // muestra municipal puede incluir menores de 16 y personas de 16 o más. El
    // universo etario real lo declara el discriminador `sampleScope` de cada
    // IBSEStudy, no este campo. Una muestra de 16 o más comparte el universo
    // poblacional de referencia con la EAS (adultos ≥16), no sus datos ni su muestra.
    targetPopulation:
      "Población general; el universo de análisis depende de las edades incluidas en la muestra municipal",
    createdAt: "2026-06-22",
  },

  source: {
    authors: "Bericat, E.",
    year: 2014,
    notes:
      "Adaptación para uso en planificación local de salud en municipios andaluces. " +
      "La referencia bibliográfica completa debe completarse con los datos de la publicación original.",
  },

  // Ítems verificados contra el diccionario REDCap interno:
  // MonitorIBSEATARFE2026_DataDictionary_2026-06-20.csv
  // Pendiente aún el contraste bibliográfico completo con la fuente primaria Bericat (2014).
  items: [
    {
      id: "ibse_deprimido",
      text: "Deprimido/a",
      redcapFormField: {
        fieldName: "ibse_deprimido",
        formName: "monitor_ibse",
        fieldType: "radio",
        fieldLabel: "Deprimido/a",
        choicesOrCalculations: "1, En ningún momento o en casi ningún momento | 2, En algún momento | 3, Buena parte del tiempo | 4, Todo o casi todo el tiempo",
        required: true,
        questionNumber: "1",
      },
      dimensionId: "factor-vinculo",
      responseType: "likert",
      responseOptions: [
        { value: 1, label: "En ningún momento o en casi ningún momento" },
        { value: 2, label: "En algún momento" },
        { value: 3, label: "Buena parte del tiempo" },
        { value: 4, label: "Todo o casi todo el tiempo" },
      ],
      reverseScored: true,
    },
    {
      id: "ibse_feliz",
      text: "Feliz",
      redcapFormField: {
        fieldName: "ibse_feliz",
        formName: "monitor_ibse",
        fieldType: "radio",
        fieldLabel: "Feliz",
        choicesOrCalculations: "1, En ningún momento o en casi ningún momento | 2, En algún momento | 3, Buena parte del tiempo | 4, Todo o casi todo el tiempo",
        required: true,
        questionNumber: "2",
      },
      dimensionId: "factor-situacion",
      responseType: "likert",
      responseOptions: [
        { value: 1, label: "En ningún momento o en casi ningún momento" },
        { value: 2, label: "En algún momento" },
        { value: 3, label: "Buena parte del tiempo" },
        { value: 4, label: "Todo o casi todo el tiempo" },
      ],
    },
    {
      id: "ibse_solo",
      text: "Solo/a",
      redcapFormField: {
        fieldName: "ibse_solo",
        formName: "monitor_ibse",
        fieldType: "radio",
        fieldLabel: "Solo/a",
        choicesOrCalculations: "1, En ningún momento o en casi ningún momento | 2, En algún momento | 3, Buena parte del tiempo | 4, Todo o casi todo el tiempo",
        required: true,
        questionNumber: "3",
      },
      dimensionId: "factor-vinculo",
      responseType: "likert",
      responseOptions: [
        { value: 1, label: "En ningún momento o en casi ningún momento" },
        { value: 2, label: "En algún momento" },
        { value: 3, label: "Buena parte del tiempo" },
        { value: 4, label: "Todo o casi todo el tiempo" },
      ],
      reverseScored: true,
    },
    {
      id: "ibse_disfrutar",
      text: "Ha tenido la sensación de disfrutar de la vida",
      redcapFormField: {
        fieldName: "ibse_disfrutar",
        formName: "monitor_ibse",
        fieldType: "radio",
        fieldLabel: "Ha tenido la sensación de disfrutar de la vida",
        choicesOrCalculations: "1, En ningún momento o en casi ningún momento | 2, En algún momento | 3, Buena parte del tiempo | 4, Todo o casi todo el tiempo",
        required: true,
        questionNumber: "4",
      },
      dimensionId: "factor-situacion",
      responseType: "likert",
      responseOptions: [
        { value: 1, label: "En ningún momento o en casi ningún momento" },
        { value: 2, label: "En algún momento" },
        { value: 3, label: "Buena parte del tiempo" },
        { value: 4, label: "Todo o casi todo el tiempo" },
      ],
    },
    {
      id: "ibse_energia",
      text: "Rebosante de energía",
      redcapFormField: {
        fieldName: "ibse_energia",
        formName: "monitor_ibse",
        fieldType: "radio",
        fieldLabel: "Rebosante de energía",
        choicesOrCalculations: "1, En ningún momento o en casi ningún momento | 2, En algún momento | 3, Buena parte del tiempo | 4, Todo o casi todo el tiempo",
        required: true,
        questionNumber: "5",
      },
      dimensionId: "factor-control",
      responseType: "likert",
      responseOptions: [
        { value: 1, label: "En ningún momento o en casi ningún momento" },
        { value: 2, label: "En algún momento" },
        { value: 3, label: "Buena parte del tiempo" },
        { value: 4, label: "Todo o casi todo el tiempo" },
      ],
    },
    {
      id: "ibse_tranquilo",
      text: "Tranquilo/a y relajado/a",
      redcapFormField: {
        fieldName: "ibse_tranquilo",
        formName: "monitor_ibse",
        fieldType: "radio",
        fieldLabel: "Tranquilo/a y relajado/a",
        choicesOrCalculations: "1, En ningún momento o en casi ningún momento | 2, En algún momento | 3, Buena parte del tiempo | 4, Todo o casi todo el tiempo",
        required: true,
        questionNumber: "6",
      },
      dimensionId: "factor-control",
      responseType: "likert",
      responseOptions: [
        { value: 1, label: "En ningún momento o en casi ningún momento" },
        { value: 2, label: "En algún momento" },
        { value: 3, label: "Buena parte del tiempo" },
        { value: 4, label: "Todo o casi todo el tiempo" },
      ],
    },
    {
      id: "ibse_optimista",
      text: "Me he sido optimista respecto a mi futuro",
      redcapFormField: {
        fieldName: "ibse_optimista",
        formName: "monitor_ibse",
        fieldType: "radio",
        fieldLabel: "Me he sido optimista respecto a mi futuro",
        choicesOrCalculations: "1, Muy de acuerdo | 2, De acuerdo | 3, Ni de acuerdo ni en desacuerdo | 4, En desacuerdo | 5, Muy en desacuerdo",
        required: true,
        questionNumber: "7",
      },
      dimensionId: "factor-persona",
      responseType: "likert",
      responseOptions: [
        { value: 1, label: "Muy de acuerdo" },
        { value: 2, label: "De acuerdo" },
        { value: 3, label: "Ni de acuerdo ni en desacuerdo" },
        { value: 4, label: "En desacuerdo" },
        { value: 5, label: "Muy en desacuerdo" },
      ],
      reverseScored: true,
    },
    {
      id: "ibse_bienmismo",
      text: "Por lo general me he sentido bien conmigo mismo",
      redcapFormField: {
        fieldName: "ibse_bienmismo",
        formName: "monitor_ibse",
        fieldType: "radio",
        fieldLabel: "Por lo general me he sentido bien conmigo mismo",
        choicesOrCalculations: "1, Muy de acuerdo | 2, De acuerdo | 3, Ni de acuerdo ni en desacuerdo | 4, En desacuerdo | 5, Muy en desacuerdo",
        required: true,
        questionNumber: "8",
      },
      dimensionId: "factor-persona",
      responseType: "likert",
      responseOptions: [
        { value: 1, label: "Muy de acuerdo" },
        { value: 2, label: "De acuerdo" },
        { value: 3, label: "Ni de acuerdo ni en desacuerdo" },
        { value: 4, label: "En desacuerdo" },
        { value: 5, label: "Muy en desacuerdo" },
      ],
      reverseScored: true,
    },
  ],

  dimensions: [
    {
      id: "factor-vinculo",
      name: "Vínculo",
      description: "Dimensión que recoge el sentido de pertenencia y las relaciones afectivas de la persona.",
      itemIds: ["ibse_deprimido", "ibse_solo"],
      outputField: "meanFactorVinculo",
    },
    {
      id: "factor-situacion",
      name: "Situación",
      description: "Dimensión que evalúa la valoración de la situación vital actual de la persona.",
      itemIds: ["ibse_feliz", "ibse_disfrutar"],
      outputField: "meanFactorSituacion",
    },
    {
      id: "factor-control",
      name: "Control",
      description: "Dimensión que mide el sentido de control percibido sobre la propia vida.",
      itemIds: ["ibse_energia", "ibse_tranquilo"],
      outputField: "meanFactorControl",
    },
    {
      id: "factor-persona",
      name: "Persona",
      description: "Dimensión que recoge aspectos de la autopercepción y la identidad personal.",
      itemIds: ["ibse_optimista", "ibse_bienmismo"],
      outputField: "meanFactorPersona",
    },
    {
      id: "total",
      name: "Índice total",
      description: "Índice compuesto calculado como media de los 8 ítems del instrumento.",
      itemIds: [],
      outputField: "meanTotal",
      isComposite: true,
    },
  ],

  algorithm: {
    type: "item-mean",
    inputLevel: "individual-responses",
    steps: [
      {
        order: 1,
        description: "Administrar los 8 ítems del instrumento a cada participante en la escala de respuesta definida.",
      },
      {
        order: 2,
        description: "Calcular la puntuación de cada factor como la media de los 2 ítems que lo componen.",
      },
      {
        order: 3,
        description: "Calcular el índice total como la media de los 8 ítems.",
      },
      {
        order: 4,
        description: "Filtrar participantes: incluir solo registros con respuesta completa a todos los ítems.",
      },
      {
        order: 5,
        description:
          "Agregar al nivel municipal: calcular la media aritmética de cada puntuación de factor " +
          "e índice total sobre el conjunto de participantes válidos del municipio.",
      },
    ],
    aggregationLevel: "municipal",
    completionCriteria:
      "Registro completo: respuesta válida a los 8 ítems del instrumento.",
    notes:
      "La implementación actual recibe de REDCap puntuaciones de factor e índice ya calculadas " +
      "a nivel individual (pasos 2-3 ejecutados por REDCap). El parser realiza el filtrado " +
      "y la agregación municipal (pasos 4-5). Esta es una limitación del adaptador actual, " +
      "no del algoritmo canónico.",
  },

  interpretation: {
    scale: {
      min: 0,
      max: 100,
      direction: "higher-is-better",
    },
    // Umbrales heurísticos del sistema. No son normativos ni clínicos.
    // Definidos operativamente para orientar la lectura diagnóstica del técnico municipal.
    thresholds: [
      {
        min: 75,
        max: 100,
        label: "alto",
        description: "Nivel alto de bienestar socioemocional (≥75/100). Umbral heurístico del sistema.",
      },
      {
        min: 60,
        max: 74,
        label: "medio",
        description: "Nivel medio de bienestar socioemocional (60–74/100). Umbral heurístico del sistema.",
      },
      {
        min: 50,
        max: 59,
        label: "medio-bajo",
        description: "Nivel medio-bajo de bienestar socioemocional (50–59/100). Umbral heurístico del sistema.",
      },
      {
        min: 0,
        max: 49,
        label: "bajo",
        description: "Nivel bajo de bienestar socioemocional (<50/100). Umbral heurístico del sistema.",
      },
    ],
    referenceValues: {
      population: "Valores históricos de referencia IBSE para Andalucía y Granada (pendientes de validación de comparabilidad)",
      source: "Valores de referencia procedentes del COMPÁS histórico (monitor IBSE): " +
        "Andalucía ≈ 75.94 · Granada ≈ 81.78. Pendiente contraste con EAS oficial.",
    },
    contextualNotes: [
      "Escala 0–100. REDCap calcula los factores individuales (pre-aggregated); " +
      "el parser agrega al nivel municipal.",
      "Los umbrales (alto ≥75, medio 60–74, medio-bajo 50–59, bajo <50) son heurísticos " +
      "del sistema, NO normativos ni clínicos. No tienen validez científica independiente.",
      "Valores de referencia históricos (pendientes de contraste con EAS oficial): " +
      "Andalucía ≈ 75.94 · Granada ≈ 81.78.",
      "Los resultados son medias de la muestra disponible, no estimaciones poblacionales.",
      "La comparabilidad entre municipios y oleadas requiere homogeneidad metodológica.",
      "Una muestra inferior a 30 participantes válidos limita la fiabilidad.",
    ],
  },

  limitations: [
    "La interpretación de los resultados debe especificar las edades de la muestra y comprobar la comparabilidad de las referencias utilizadas.",
    "No permite análisis por subgrupos sin disponer de los registros individuales y tamaños suficientes.",
    "La comparación con otros municipios requiere que el proceso de administración sea metodológicamente equivalente.",
    "Los ítems específicos y sus opciones de respuesta deben contrastarse con la publicación original de Bericat (2014).",
  ],

  bibliography: [
    {
      authors: "Bericat, E.",
      year: 2014,
      notes: "Referencia bibliográfica completa pendiente de contraste con la fuente primaria.",
    },
  ],

  adapters: {
    redcap: {
      instrument: "monitor_ibse",
      completedColumn: "monitor_ibse_complete",
      completedValue: "2",
      columns: [
        {
          outputField: "meanTotal",
          redcapColumn: "ibse_total",
          isComputed: true,
          notes: "Puntuación total calculada por REDCap a nivel individual.",
        },
        {
          outputField: "meanFactorVinculo",
          redcapColumn: "ibse_factor_vinculo",
          isComputed: true,
        },
        {
          outputField: "meanFactorSituacion",
          redcapColumn: "ibse_factor_situacion",
          isComputed: true,
        },
        {
          outputField: "meanFactorControl",
          redcapColumn: "ibse_factor_control",
          isComputed: true,
        },
        {
          outputField: "meanFactorPersona",
          redcapColumn: "ibse_factor_persona",
          isComputed: true,
        },
      ],
      notes:
        "REDCap calcula las puntuaciones de factor e índice a nivel individual antes de la exportación. " +
        "El parser lee esas columnas calculadas y agrega al nivel municipal.",
    },
    // sav: pendiente de contraste con EAS_dif_Adultos.sav
  },

  institutionalNote: {
    diagnosticInterpretation:
      "El IBSE es un estudio de bienestar socioemocional de la " +
      "población participante, con datos propios recogidos mediante el " +
      "cuestionario REDCap municipal. Mide el bienestar subjetivo de las personas " +
      "en cuatro dimensiones: Vínculo (sentido de pertenencia y relaciones afectivas), " +
      "Situación (valoración de la propia vida), Control (sensación de control sobre " +
      "la propia vida) y Persona (autoestima e identidad personal). " +
      "El índice total resume estas cuatro dimensiones en una escala 0–100. " +
      "Cuando la dispersión interfactorial es alta (más de 20 puntos entre el factor " +
      "más alto y el más bajo), el índice total puede ocultar diferencias relevantes " +
      "entre dimensiones: en ese caso, el análisis por factor individual proporciona " +
      "información diagnóstica más precisa. El factor con menor puntuación señala " +
      "la dimensión de bienestar socioemocional con menor puntuación en la muestra.",

    implications: [
      "Análisis de los factores de bienestar socioemocional con menor puntuación, que señalan " +
      "las dimensiones con menor puntuación entre las personas participantes.",
      "Atención especial al Factor Vínculo (soledad, pertenencia): niveles bajos pueden " +
      "indicar dificultades de pertenencia, apoyo o relaciones sociales.",
      "Cuando la dispersión interfactorial supere los 20 puntos, analizar cada factor " +
      "de forma independiente antes de extraer conclusiones del índice total.",
      "Cruce con otros indicadores municipales pertinentes " +
      "cuando estén disponibles.",
      "Comparación con los valores de referencia disponibles (Andalucía ≈ 75.94, " +
      "Granada ≈ 81.78) para contextualizar el resultado del municipio, " +
      "manteniendo las cautelas sobre el origen de estos valores de referencia.",
    ],

    publicHealthApplication: {
      measures: [
        "Bienestar socioemocional subjetivo de las personas participantes en el municipio.",
        "Factor Vínculo: sentido de pertenencia y calidad de las relaciones afectivas.",
        "Factor Situación: valoración de la situación vital actual.",
        "Factor Control: sensación de control sobre la propia vida.",
        "Factor Persona: autoestima e identidad personal.",
        "Dispersión interfactorial: heterogeneidad entre dimensiones del bienestar.",
      ],
      doesNotMeasure: [
        "Salud mental clínica ni diagnósticos psicológicos o psiquiátricos.",
        "Rendimiento académico ni adaptación escolar objetiva.",
        "Clima escolar objetivo ni condiciones del entorno educativo.",
        "Contexto familiar, socioeconómico o cultural de las personas participantes.",
      ],
      contextualUse: [
        "Instrumento municipal de aplicación directa: los datos provienen del cuestionario " +
        "administrado a la muestra municipal, no de una encuesta provincial.",
        "Los resultados son comparables entre municipios que usen la misma versión del " +
        "cuestionario IBSE y el mismo protocolo de administración REDCap.",
        "Las comparativas con Andalucía y Granada (valores históricos) deben interpretarse " +
        "con cautela: proceden del monitor histórico COMPÁS, pendientes de contraste oficial.",
      ],
      commonMisinterpretations: [
        "IBSE bajo no equivale a enfermedad mental: mide bienestar subjetivo cotidiano " +
        "en la población estudiada, no psicopatología.",
        "El índice total puede ser engañoso cuando la dispersión interfactorial es alta: " +
        "siempre revisar los factores individuales cuando rango > 20 puntos.",
        "Los umbrales (alto ≥75, medio 60–74, medio-bajo 50–59, bajo <50) son heurísticos " +
        "del sistema, no normativos ni clínicos. No validan diagnósticos individuales.",
        "Los datos representan a quienes respondieron el cuestionario: " +
        "pueden no representar a toda la población del municipio.",
      ],
    },

    pslIntegration: {
      chapter: "Diagnóstico de Salud de la Población",
      determinants: [
        "Salud mental y bienestar",
        "Determinantes sociales del bienestar",
        "Relaciones y apoyo social",
      ],
      contribution:
        "El IBSE permite estudiar el bienestar socioemocional de la " +
        "población participante del municipio. Aporta información sobre el bienestar " +
        "socioemocional subjetivo de las personas, una dimensión habitualmente " +
        "sin cobertura en los datos epidemiológicos municipales estándar. " +
        "Sus resultados alimentan el diagnóstico de salud del Perfil, con especial " +
        "relevancia para identificar necesidades comunitarias de bienestar " +
        "y orientar propuestas de promoción de la salud mental en distintas edades.",
    },

    relatedInstrumentIds: ["sf12-eas", "sueno-eas"],
  },
};
