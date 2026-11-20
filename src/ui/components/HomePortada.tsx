import { InstitutionalLogoBand } from "./InstitutionalLogoBand";
import "./HomePortada.css";

/**
 * Portada de COMPÁS en una sola pantalla.
 *
 * Todo el contenido de la portada (identidad, logos, finalidad, ciclo de
 * planificación con los documentos que entran y salen en cada fase, y nota
 * sobre las decisiones) cabe en el alto de la ventana sin desplazamiento,
 * desde 1280 × 720. Las fases explican el proceso sin duplicar la navegación principal; el estado
 * del expediente se consulta en el resumen desplegable de la cabecera.
 */

type HomeTarget = "repositorio" | "psl" | "priorizacion" | "plan" | "plan-local" | "agenda" | "evaluacion";

interface Phase {
  n: string;
  verb: string;
  desc: string;
  docLabel: "Entra" | "Decide" | "Sale";
  doc: string;
  target: HomeTarget;
}

const PHASES: Phase[] = [
  { n: "01", verb: "Diagnosticar", desc: "Informe de salud, estudios y activos, organizados y analizados.", docLabel: "Entra", doc: "Informe de salud y estudios", target: "repositorio" },
  { n: "02", verb: "Perfilar", desc: "Perfil hecho fuera de COMPÁS, incorporado y revisado por el equipo.", docLabel: "Entra", doc: "Perfil de Salud Local", target: "psl" },
  { n: "03", verb: "Priorizar", desc: "Selección técnica y participativa de las áreas de actuación.", docLabel: "Decide", doc: "Grupo Motor y ciudadanía", target: "priorizacion" },
  { n: "04", verb: "Planificar", desc: "Líneas estratégicas, objetivos e indicadores trazados al diagnóstico.", docLabel: "Sale", doc: "Plan de Acción", target: "plan" },
  { n: "05", verb: "Implantar", desc: "Actuaciones por entorno con responsable, plazo y recurso.", docLabel: "Sale", doc: "Agendas anuales", target: "agenda" },
  { n: "06", verb: "Evaluar", desc: "Cumplimiento, resultados y recomendaciones para el ciclo siguiente.", docLabel: "Sale", doc: "Informe de evaluación", target: "evaluacion" },
];

interface HomePortadaProps {
  onNavigate: (view: HomeTarget) => void;
  municipality: { name: string; province?: string; ineCode?: string };
  onChangeMunicipality: () => void;
}
export function HomePortada(_props: HomePortadaProps) {
  return (
    <div className="hp" aria-label="Portada de COMPÁS">
      <header className="hp-cover">
        <div className="hp-cover__context">
          <p className="hp-cover__chain">
            Marco RELAS · Planificación Local de Salud · Salud pública municipal · Andalucía
          </p>

        </div>
        <div className="hp-cover__brand">
          <h1 className="home-cover__wordmark hp-cover__wordmark">COMPÁS</h1>
          <hr className="home-cover__rule hp-cover__rule" />
          <p className="hp-cover__subtitle">Herramienta en desarrollo para la planificación local en salud</p>
        </div>
        <div className="hp-cover__side">
          <InstitutionalLogoBand
            variant="cover"
            ids={["consejeria", "distrito-sanitario", "relas", "violencia-genero", "rasselh"]}
          />
          <p className="hp-cover__mission">
            Prototipo para elaborar Planes Locales de Salud municipales con el marco RELAS y la
            experiencia de COMPÁS. No está desplegado oficialmente.
          </p>
        </div>
      </header>

      <section className="hp-cycle" aria-labelledby="hp-cycle-title">
        <h2 id="hp-cycle-title" className="hp-cycle__title">El ciclo de planificación local en salud</h2>
        <ol className="hp-cycle__phases">
          {PHASES.map((p, i) => (
            <li key={p.n} className={`hp-phase hp-phase--${i + 1}`}>
              <div className="hp-phase__btn">
                <span className="hp-phase__head">
                  <span className="hp-phase__n">{p.n}</span>
                  <span className="hp-phase__verb">{p.verb}</span>
                </span>
                <span className="hp-phase__desc">{p.desc}</span>
                <span className="hp-phase__doc">
                  <span className="hp-phase__doc-label">{p.docLabel}</span> {p.doc}
                </span>
              </div>
            </li>
          ))}
        </ol>
        <div className="hp-cycle__plan">
          <div className="hp-cycle__plan-btn">
            <strong>Plan Local de Salud</strong>
            <span>compila el Perfil, el Plan de Acción y las agendas anuales</span>
          </div>
        </div>
      </section>

      <p className="hp-note">
        Las decisiones corresponden al equipo técnico, a la ciudadanía y a la autoridad competente;
        COMPÁS organiza la información y apoya el proceso.
      </p>
    </div>
  );
}
