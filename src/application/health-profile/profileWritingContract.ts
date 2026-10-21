/**
 * profileWritingContract
 *
 * Contrato de escritura del Perfil Local de Salud (versión operativa de
 * docs/architecture/PROFILE-WRITING-CONTRACT.md). Pequeño y puro: constantes
 * y un verificador de fronteras que los tests y la narrativa pueden usar.
 *
 * Fórmula de escritura: señal de salud → mecanismo social plausible →
 * determinante → desigualdad (observable o no) → activo/capacidad →
 * pregunta de contraste comunitario → conclusión diagnóstica sin
 * recomendación.
 */

// ── Contrato autorial transversal ───────────────────────────────────────────
// Aplicación operativa de docs/contracts/CONTRACT-AUTHORIAL-STYLE.md.
// Estas reglas ordenan el razonamiento; las fronteras específicas del Perfil
// siguen prevaleciendo sobre cualquier preferencia general de voz.

export const AUTHORIAL_REASONING_SEQUENCE = [
  "identificar el problema concreto",
  "examinar los supuestos",
  "distinguir hechos, inferencias, hipótesis y decisiones",
  "localizar la tensión o insuficiencia explicativa",
  "precisar las distinciones conceptuales necesarias",
  "contrastar la evidencia",
  "establecer qué aprenderá el lector",
  "redactar con naturalidad y revisar la fuerza de cada afirmación",
] as const;

export const AUTHORIAL_EDITORIAL_CRITERIA = [
  "la evidencia puede corregir la interpretación y no se limita a ilustrarla",
  "las oposiciones proceden del objeto y no de una plantilla retórica",
  "cada concepto cumple una función analítica necesaria",
  "la originalidad se demuestra y no se proclama",
  "la prosa evita burocracia, grandilocuencia y abstracciones prescindibles",
  "los datos, citas y textos finales aprobados conservan su formulación",
] as const;

// ── Dimensiones obligatorias de lectura ───────────────────────────────────────

export const PROFILE_READING_DIMENSIONS = [
  "situación de salud",
  "condiciones de vida y determinantes",
  "desigualdades visibles o no visibles",
  "activos y capacidades",
  "experiencia y contraste comunitario",
  "incertidumbres",
  "preguntas para la deliberación",
] as const;

// ── Preguntas-motor de la narrativa (Tarea 5 del encargo) ─────────────────────
// La generación narrativa se gobierna por estas preguntas; no es necesario
// que el documento sea un índice de preguntas, pero cada una debe tener
// respuesta o ausencia declarada en el texto.

export const DIAGNOSTIC_ENGINE_QUESTIONS = [
  "¿Qué imagen de situación de salud ofrece el expediente?",
  "¿Qué aporta el Informe de Salud?",
  "¿Qué añaden los estudios complementarios?",
  "¿Qué señales convergen?",
  "¿Qué condiciones de vida podrían estar detrás?",
  "¿Qué desigualdades no podemos ver todavía?",
  "¿Qué activos pueden ser capacidades reales?",
  "¿Qué sabe o debe contrastar la comunidad?",
  "¿Qué queda preparado para deliberar?",
] as const;

// ── Fronteras: expresiones prohibidas en el documento del Perfil ──────────────
// Patrones conservadores: cazan afirmaciones prescriptivas o causales, no
// sus negaciones legítimas («no formula recomendaciones…»).

export interface WritingContractViolation {
  id: string;
  motivo: string;
  match: string;
}

const FORBIDDEN_WRITING_PATTERNS: Array<{
  id: string;
  motivo: string;
  pattern: RegExp;
}> = [
  {
    id: "recomendacion",
    motivo:
      "El cuerpo compilado del Perfil no recomienda: las orientaciones técnicas entran solo por el menú elegible, con autoría y fecha (Art. 16 ter, CONTRACT-LHPM v1.5).",
    pattern:
      /se recomienda|recomendamos|es recomendable|debe implantarse|debe ponerse en marcha|proponemos|se propone implantar/i,
  },
  {
    id: "actuacion-programa",
    motivo:
      "Las actuaciones operativas, los programas y los objetivos estratégicos pertenecen al Plan de Acción (Art. 3, CONTRACT-LHPM v1.5).",
    pattern:
      /programa de intervención|actuaciones previstas|objetivo estratégico|línea estratégica|objetivo operativo|cartera de servicios propuesta/i,
  },
  {
    id: "causalidad-falsa",
    motivo:
      "Toda relación entre determinante y problema es una hipótesis con fuente y grado de sustento declarados; la causalidad solo se afirma si la fuente citada la demuestra (Art. 8 bis).",
    pattern:
      /demuestra que|queda demostrado|causa directa|relación causal confirmada|prueba de forma concluyente/i,
  },
];

/** Devuelve las violaciones de frontera encontradas en el texto (vacío = OK). */
export function checkProfileWritingContract(
  texto: string
): WritingContractViolation[] {
  const violations: WritingContractViolation[] = [];
  for (const regla of FORBIDDEN_WRITING_PATTERNS) {
    const match = texto.match(regla.pattern);
    if (match !== null) {
      violations.push({ id: regla.id, motivo: regla.motivo, match: match[0] });
    }
  }
  return violations;
}

// ── Principio de primacía local ───────────────────────────────────────────────
// El Perfil comenta primero la evidencia local o directamente incorporada al
// proceso; las fuentes externas o de escala superior solo contextualizan,
// comparan o ayudan a formular hipótesis, con cautela de escala, y nunca son
// la historia principal.

export const LOCAL_PRIMACY_RULE =
  "El Perfil comenta primero la evidencia local o directamente incorporada " +
  "al proceso —Informe de Salud, estudios complementarios, documentación " +
  "territorial, activos, material cualitativo, priorización y contraste " +
  "comunitario cuando existan—. Las fuentes externas o de escala superior " +
  "—BADEA/IECA, EAS, Andalucía, provincia, municipio matriz usado como " +
  "proxy— solo contextualizan, comparan o ayudan a formular hipótesis, y " +
  "deben aparecer con cautela de escala. No pueden convertirse en la " +
  "historia principal del Perfil.";

/** Matiz de objeto de la primacía local: el Perfil mantiene el hilo sanitario. */
export const SANITARY_THREAD_RULE =
  "El Informe de Salud mantiene el objeto salud del Perfil (situación " +
  "epidemiológica, problemas de salud, factores de riesgo); los estudios " +
  "complementarios amplían el hilo sanitario hacia bienestar, hábitos y vida " +
  "cotidiana; BADEA/IECA contextualiza determinantes y desigualdades. El " +
  "Perfil no debe convertirse ni en informe epidemiológico estrecho ni en " +
  "informe social general.";

// ── Criterios positivos (verificables sobre el texto generado) ───────────────

export const POSITIVE_WRITING_CRITERIA = [
  "prioritizesLocalEvidence: comenta primero la evidencia local del proceso; el contexto externo (BADEA/IECA, EAS, proxy del municipio matriz) contextualiza sin protagonizar",
  "conecta señales con mecanismos sociales plausibles",
  "formula preguntas de contraste comunitario",
  "diferencia evidencia directa, proxy/contexto y ausencia de dato",
  "interpreta los activos como capacidades potenciales conectadas con desafíos",
  "reconoce la experiencia comunitaria como conocimiento (pendiente de incorporación si no hay material cualitativo)",
] as const;
