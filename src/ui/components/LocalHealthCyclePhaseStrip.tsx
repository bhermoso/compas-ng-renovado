/* Franja de 5 fases del ciclo metodológico COMPÁS.
   Objeto distinto del ciclo institucional de planificación (LocalHealthPlanningCycle, §9). */

interface MethodologyPhase {
  num: number;
  title: string;
  description: string;
  colorVar: string;
}

const METHODOLOGY_PHASES: MethodologyPhase[] = [
  {
    num: 1,
    title: "Analizar",
    description:
      "Perfil territorial, determinantes sociales, desigualdades e interpretación ecosocial",
    colorVar: "--azul",
  },
  {
    num: 2,
    title: "Priorizar",
    description:
      "Deliberación comunitaria, activos para la salud y convergencia con evidencia técnica",
    colorVar: "--cyan",
  },
  {
    num: 3,
    title: "Planificar",
    description:
      "Plan local trazable: objetivos, actores, intersectorialidad y capacidad institucional",
    colorVar: "--verde",
  },
  {
    num: 4,
    title: "Ejecutar",
    description:
      "Organización territorial de actuaciones, coordinación intersectorial y trazabilidad de implementación",
    colorVar: "--amarillo",
  },
  {
    num: 5,
    title: "Evaluar",
    description:
      "Aprendizaje territorial acumulativo, memoria institucional y renovación del ciclo",
    colorVar: "--rojo",
  },
];

export function LocalHealthCyclePhaseStrip() {
  return (
    <div className="lhcps">
      {METHODOLOGY_PHASES.map((phase) => (
        <div
          key={phase.num}
          className="lhcps__phase"
          style={{ borderTopColor: `var(${phase.colorVar})` }}
        >
          <span className="lhcps__num">{phase.num}</span>
          <span className="lhcps__title">{phase.title}</span>
          <span className="lhcps__desc">{phase.description}</span>
        </div>
      ))}
    </div>
  );
}
