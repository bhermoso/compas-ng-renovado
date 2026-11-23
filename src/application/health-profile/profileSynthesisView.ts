/**
 * profileSynthesisView
 *
 * «Salud en síntesis»: la primera lectura visual del Perfil en pantalla.
 * Capa PURA que convierte las señales integradas en (a) mensajes
 * sustantivos con lenguaje institucional y humano, y (b) una tabla compacta
 * de señales principales para deliberación. La matriz epistemológica
 * completa queda para el anexo, con notas de bloque en lugar de cautelas
 * repetidas fila a fila.
 *
 * Regla editorial (contrato anti-plantilla, testeable):
 *   - La sección cuenta algo sobre la salud del territorio ANTES de
 *     explicar limitaciones metodológicas.
 *   - Ninguna fórmula de cautela se repite más de una vez en la sección
 *     principal; las cautelas comunes van en UNA nota de escala.
 *   - Sin recomendaciones, sin causalidad fuerte, sin tono de plantilla.
 */

import type { DiagnosticAnswers } from "./diagnosticAnswers";
import { formatIndicatorValue } from "./complementaryIndicatorReferences";
import { buildIntegratedProfileSignals } from "./integratedProfileSignals";
import type { CausalStatus } from "./profileScientificFramework";

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface SynthesisMessage {
  id: string;
  texto: string;
}

export interface SenalPrincipalRow {
  grupo: string;
  senal: string;
  fuente: string;
  escala: string;
  lectura: string;
  pregunta: string;
}

export interface ProfileSynthesis {
  titulo: "Salud en síntesis";
  mensajes: SynthesisMessage[];
  senalesPrincipales: SenalPrincipalRow[];
  /** Única nota de escala de la sección (las cautelas no se repiten por fila). */
  notaEscala: string;
}

export interface BuildProfileSynthesisOptions {
  /** Denominación institucional del Informe (p. ej. «Informe de salud de Atarfe»). */
  informeTitulo?: string;
  /** Sustantivo del ámbito; por defecto, «territorio». */
  scopeNoun?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function ref(answers: DiagnosticAnswers, id: string) {
  return answers.referencias.references.find(
    (r) => r.indicatorId === id && r.territorialValue !== undefined
  );
}

function fmt(answers: DiagnosticAnswers, id: string): string | undefined {
  const r = ref(answers, id);
  return r ? formatIndicatorValue(r.territorialValue, r.unit) : undefined;
}

// ── Mensajes de síntesis ──────────────────────────────────────────────────────

export function buildProfileSynthesis(
  answers: DiagnosticAnswers,
  opts: BuildProfileSynthesisOptions = {}
): ProfileSynthesis {
  const scope = opts.scopeNoun ?? "territorio";
  const informe = opts.informeTitulo ?? "el Informe de salud";
  const mensajes: SynthesisMessage[] = [];

  // 1. Hilo sanitario primero: qué dice la fuente primaria (regla editorial).
  const dims = answers.sanitaria.senales.map((s) => s.dimension);
  if (answers.sanitaria.present && dims.length >= 3) {
    mensajes.push({
      id: "hilo-sanitario",
      texto:
        `${informe} marca la agenda sanitaria de partida: ${dims[0]}, ` +
        `${dims[1]} y ${dims[2]} concentran su atención, con las magnitudes ` +
        `recogidas en el propio documento.`,
    });
  }

  // 2. Vida cotidiana: descanso y movimiento (valores reales de la muestra).
  const sueno = fmt(answers, "sueno-insuficiente");
  const inactividad = fmt(answers, "ipaq-inactividad");
  if (sueno !== undefined && inactividad !== undefined) {
    mensajes.push({
      id: "vida-cotidiana",
      texto:
        `En la vida cotidiana, dos señales piden mirada: un ${sueno} de la ` +
        `muestra duerme menos de lo recomendado y un ${inactividad} declara ` +
        `inactividad en su tiempo libre.`,
    });
  }

  // 3. Apoyo social y envejecimiento (dato + eje a contrastar + capacidad).
  const duke = fmt(answers, "duke-apoyo-global");
  const envejecimiento = answers.determinantes.find(
    (d) => d.kind === "a-contrastar"
  );
  if (duke !== undefined && envejecimiento !== undefined) {
    mensajes.push({
      id: "apoyo-envejecimiento",
      texto:
        `El apoyo social funcional medio es alto (${duke}); aun así, el ` +
        `envejecimiento y la soledad no deseada emergen como eje a ` +
        `contrastar — y es también donde más capacidad comunitaria se ` +
        `concentra.`,
    });
  }

  // 4. Bienestar positivo: los escolares.
  const ibse = fmt(answers, "ibse-indice-total");
  if (ibse !== undefined) {
    mensajes.push({
      id: "bienestar-escolar",
      texto:
        `El bienestar socioemocional escolar se sitúa en ${ibse}: los ` +
        `escolares aportan una de las pocas medidas de bienestar positivo ` +
        `del expediente.`,
    });
  }

  // 5. Capacidades: el territorio no parte de cero.
  const grupos = answers.salutogenica.grupos.slice(0, 3).map((g) => g.ambito);
  if (answers.salutogenica.totalAssets > 0 && grupos.length > 0) {
    mensajes.push({
      id: "capacidades",
      texto:
        `El ${scope} no parte de cero: ${answers.salutogenica.totalAssets} ` +
        `recursos comunitarios, con concentraciones en ${grupos.join(", ")}.`,
    });
  }

  // 6. Cierre: la pregunta de equidad (única mención metodológica, al final).
  mensajes.push({
    id: "equidad-abierta",
    texto:
      `Lo que aún no vemos: cómo se reparte esta salud dentro del ${scope}. ` +
      `Sin desagregación por sexo, edad o renta, la equidad es la gran ` +
      `pregunta que queda abierta para el Grupo Motor.`,
  });

  // ── Señales principales para deliberación (agrupadas, no las 19) ──────────
  const senalesPrincipales: SenalPrincipalRow[] = [];
  const bloque = (id: string) =>
    answers.estudios.diagnosticBlocks.find((b) => b.id === id);

  if (answers.sanitaria.present && dims.length >= 2) {
    senalesPrincipales.push({
      grupo: "Situación sanitaria (Informe)",
      senal: `${dims[0]} · ${dims[1]}`,
      fuente: informe,
      escala: "ámbito del Informe",
      lectura:
        "agenda de partida del diagnóstico; magnitudes en el propio Informe",
      pregunta: `¿Cómo se expresan ${dims[0]} y ${dims[1]} en la vida del barrio?`,
    });
  }

  // IBSE — señal principal SOLO cuando es medición LOCAL del ámbito (Lote A / F4):
  // el IBSE municipal (p. ej. Atarfe) es un +1 propio y debe figurar como fuente y
  // como señal principal de la lectura; el monitor provincial usado como proxy
  // (sin escala municipal declarada) permanece como contexto y NO se añade aquí.
  const ibseRefPrincipal = ref(answers, "ibse-indice-total");
  if (ibseRefPrincipal !== undefined && ibseRefPrincipal.esLocal) {
    const ibseBlock = bloque("bienestar-socioemocional-escolar");
    senalesPrincipales.push({
      grupo: "Bienestar socioemocional (IBSE)",
      senal: ibseBlock?.title ?? "bienestar socioemocional",
      fuente: "IBSE",
      escala: "muestra local municipal",
      lectura: `${ibseRefPrincipal.narrativeLabel.replace(/^el |^la |^los |^las /, "")}: ${formatIndicatorValue(ibseRefPrincipal.territorialValue, ibseRefPrincipal.unit)}`,
      pregunta:
        ibseBlock?.contrastQuestions[0] ??
        "¿Cómo se vive el bienestar socioemocional en la vida cotidiana del ámbito?",
    });
  }

  const filaDeBloque = (
    blockId: string,
    grupo: string,
    tracerIds: string[],
    escala: string
  ) => {
    const b = bloque(blockId);
    if (!b) return;
    const partes = tracerIds
      .map((id) => {
        const r = ref(answers, id);
        return r
          ? `${r.narrativeLabel.replace(/^el |^la |^los |^las /, "")}: ${formatIndicatorValue(r.territorialValue, r.unit)}`
          : undefined;
      })
      .filter((x): x is string => x !== undefined);
    if (partes.length === 0) return;
    senalesPrincipales.push({
      grupo,
      senal: b.title,
      fuente: b.supportingStudies.join(" · "),
      escala,
      lectura: partes.join("; "),
      pregunta: b.contrastQuestions[0] ?? "",
    });
  };

  filaDeBloque(
    "salud-mental-sueno-malestar",
    "Salud mental, sueño y malestar",
    ["sf12-mcs", "sueno-insuficiente"],
    "contexto provincial (proxy)"
  );
  filaDeBloque(
    "apoyo-social-vinculo-comunitario",
    "Apoyo social y vínculo",
    ["duke-apoyo-global"],
    "contexto provincial (proxy)"
  );
  filaDeBloque(
    "actividad-fisica-sedentarismo-entorno",
    "Actividad física y entorno",
    ["ipaq-inactividad", "sbq-sedentario"],
    "contexto provincial y muestra local"
  );
  filaDeBloque(
    "consumos-alimentacion-habitos",
    "Consumos y alimentación",
    ["predimed-adherencia", "auditc-positivo"],
    "contexto provincial y muestra local"
  );

  if (answers.salutogenica.totalAssets > 0) {
    senalesPrincipales.push({
      grupo: "Activos y capacidades",
      senal: `${answers.salutogenica.totalAssets} recursos comunitarios`,
      fuente: "Localiza Salud",
      escala: "inventario municipal",
      lectura: `concentraciones en ${grupos.join(", ")}`,
      pregunta:
        "¿Cuáles de estos recursos funcionan hoy como capacidades reales, accesibles y conocidas?",
    });
  }

  return {
    titulo: "Salud en síntesis",
    mensajes,
    senalesPrincipales,
    notaEscala:
      "Nota de escala: los valores de los estudios proceden de ámbito " +
      "provincial o de muestras locales usados como contexto; la cautela " +
      "completa consta en el capítulo I del documento.",
  };
}

// ── Matriz completa para el anexo (sin repetición mecánica) ──────────────────

export interface MatrizAnexoFila {
  senal: string;
  fuente: string;
  escala: string;
  mecanismo: string;
  estatusCausal: CausalStatus;
  pregunta: string;
  /** Solo cuando difiere de la nota de bloque. */
  desigualdad?: string;
  activoCapacidad?: string;
}

export interface MatrizAnexo {
  filas: MatrizAnexoFila[];
  /** Cautelas comunes a todas las filas, declaradas UNA vez. */
  notasBloque: string[];
}

export function buildMatrizAnexo(answers: DiagnosticAnswers): MatrizAnexo {
  const signals = buildIntegratedProfileSignals(answers);
  const notasBloque: string[] = [];

  // Nota de bloque: desigualdad, si es homogénea en todas las señales.
  const desigualdades = new Set(signals.map((s) => s.desigualdad.nota));
  const desigualdadHomogenea = desigualdades.size === 1;
  if (desigualdadHomogenea && signals.length > 0) {
    notasBloque.push(
      `Distribución y desigualdad (todas las señales): desconocida — ` +
        `${signals[0].desigualdad.nota}.`
    );
  }
  // Nota de bloque: validación comunitaria (Popay), si es homogénea.
  if (signals.every((s) => s.validacionComunitariaPendiente)) {
    notasBloque.push(
      "Validación comunitaria (todas las señales): pendiente — el " +
        "conocimiento del vecindario y del Grupo Motor confirmará mecanismos, " +
        "barreras, significados y acceso real."
    );
  }

  const filas: MatrizAnexoFila[] = signals.map((s) => ({
    senal: s.senal,
    fuente: s.fuente,
    escala: s.escala,
    mecanismo: s.mecanismoPlausible ?? "sin mecanismo formulado todavía",
    estatusCausal: s.estatusCausal,
    pregunta: s.preguntaGrupoMotor,
    ...(desigualdadHomogenea ? {} : { desigualdad: s.desigualdad.nota }),
    ...(s.activoRelacionado !== undefined
      ? { activoCapacidad: s.activoRelacionado }
      : {}),
  }));

  return { filas, notasBloque };
}

// ── Contrato anti-plantilla (testeable) ───────────────────────────────────────

export interface AntiTemplateViolation {
  id: string;
  detalle: string;
}

const FORMULAS_CAUTELA = [
  "pendiente de validación comunitaria",
  "no constituye una estimación",
  "requiere contraste territorial",
];

const ARRANQUE_METODOLOGICO_RE =
  /^(cautela|la escala|metodol|nota de escala|proxy|sin datos|limitaci)/i;

const PROHIBIDO_RE =
  /se recomienda|recomendamos|debe implantarse|programa de|objetivo estrat[ée]gico|actuaciones previstas|plan de acci[óo]n/i;

export function checkSynthesisAntiTemplate(
  synthesis: ProfileSynthesis
): AntiTemplateViolation[] {
  const violations: AntiTemplateViolation[] = [];
  const textoPrincipal = [
    ...synthesis.mensajes.map((m) => m.texto),
    ...synthesis.senalesPrincipales.flatMap((r) => [
      r.lectura,
      r.pregunta,
      r.escala,
    ]),
  ].join("\n");

  for (const formula of FORMULAS_CAUTELA) {
    const n = textoPrincipal.split(formula).length - 1;
    if (n > 1) {
      violations.push({
        id: "cautela-repetida",
        detalle: `«${formula}» aparece ${n} veces en la sección principal (máx. 1).`,
      });
    }
  }

  const primero = synthesis.mensajes[0]?.texto ?? "";
  if (ARRANQUE_METODOLOGICO_RE.test(primero)) {
    violations.push({
      id: "apertura-metodologica",
      detalle: "La sección principal no puede abrir con metodología o cautelas.",
    });
  }

  if (PROHIBIDO_RE.test(textoPrincipal)) {
    violations.push({
      id: "frontera",
      detalle:
        "Recomendaciones, actuaciones, objetivos o Plan de Acción detectados.",
    });
  }

  const lecturas = synthesis.senalesPrincipales.map((r) => r.lectura);
  if (new Set(lecturas).size !== lecturas.length) {
    violations.push({
      id: "lectura-duplicada",
      detalle: "Dos filas comparten exactamente la misma lectura (tono plantilla).",
    });
  }
  const preguntas = synthesis.senalesPrincipales.map((r) => r.pregunta);
  if (new Set(preguntas).size !== preguntas.length) {
    violations.push({
      id: "pregunta-duplicada",
      detalle: "Dos filas comparten exactamente la misma pregunta (tono plantilla).",
    });
  }

  return violations;
}
