import type { ReactNode } from 'react';
import { DocumentReference } from "../Documentation";
import type { MunicipalityWorkspace } from "../../../domain/workspace";
import { getBadeaMunicipalContext } from "../../../application/badea";
import { buildTerritorialInequalityReading } from "../../../application/health-profile/diagnosticAnswers";

interface PerfilFuentesPanelProps {
  workspace: MunicipalityWorkspace;
  children?: ReactNode;
  onProcessReport?: () => void;
  processing?: boolean;
  message?: string | null;
}

type EstadoDimension = "cubierta" | "parcial" | "pendiente";

interface DimensionImpacto {
  dimension: string;
  estado: EstadoDimension;
  detalle: string;
}

const MARCA: Record<EstadoDimension, string> = {
  cubierta: "✓",
  parcial: "◐",
  pendiente: "○",
};

function contar(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

export function PerfilFuentesPanel({ workspace, children, onProcessReport, processing, message }: PerfilFuentesPanelProps) {
  const nombre = workspace.municipality.identity.name;
  const docs = workspace.repository.documents;
  const atoms = workspace.evidenceStore.atoms;

  // ── Señales reales del expediente (sin duplicar categorías de carga) ──────
  const territoriales = docs.filter(
    (d) => d.kind === "territorial-documentation"
  ).length;
  const marcos = docs.filter((d) => d.kind === "strategic-framework").length;
  const cualitativos = atoms.filter(
    (a) => a.kind === "qualitative-observation"
  ).length;
  const activos = atoms.filter(
    (a) => a.provenance.origin === "localiza-salud"
  ).length;
  const determinantes = atoms.filter((a) => a.kind === "determinant").length;
  const indicadores = atoms.filter((a) => a.kind === "indicator").length;
  const cautelas = atoms.filter(
    (a) => a.kind === "methodological-caution"
  ).length;
  const estudios = [
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
  const preguntasAbiertas =
    workspace.perfilLocalDeSalud?.preguntasAbiertas.filter(
      (q) => q.status === "abierta"
    ).length ?? 0;
  const tieneInforme = workspace.healthReport !== undefined;
  const desigualdadTerritorial = buildTerritorialInequalityReading(workspace);
  const fuentesTerritoriales = desigualdadTerritorial.sourceTitles
    .slice(0, 3)
    .join("; ");
  const temasTerritoriales = desigualdadTerritorial.themes
    .slice(0, 4)
    .join("; ");
  const estudiosDocumentales = docs.filter(
    (d) => d.kind === "complementary-study" && (d.sourceText?.trim().length ?? 0) > 0
  ).length;
  const detalleEstudios =
    estudios > 0
      ? `${estudios} ${estudios === 1 ? "estudio complementario estructurado" : "estudios complementarios estructurados"}`
      : `${estudiosDocumentales} ${
          estudiosDocumentales === 1
            ? "documento complementario con texto"
            : "documentos complementarios con texto"
        }`;

  // Contexto BADEA/IECA real (capa no evidencial, valores verificados).
  const badea = getBadeaMunicipalContext(workspace.municipality.identity.id);
  const BADEA_CANDIDATA = badea
    ? `Fuente BADEA/IECA: primer contexto incorporado (consulta 19824, ` +
      `${badea.territorio}, INE ${badea.codigoINE}, año ${badea.anio}; escala ` +
      `municipal${
        badea.esProxyMunicipioMatriz
          ? " — contexto de referencia del municipio matriz, no estimación distrital"
          : ""
      }). Indicadores específicos de esta dimensión siguen pendientes de carga ` +
      `por el cargador documental habitual.`
    : "Fuente candidata: BADEA/IECA — pendiente de carga por el cargador " +
      "documental habitual; no incorporada todavía.";

  // ── Dimensiones de impacto sobre el Perfil ────────────────────────────────
  const dimensiones: DimensionImpacto[] = [
    {
      dimension: "Situación de salud",
      estado:
        estudios > 0 || estudiosDocumentales > 0
          ? "parcial"
          : tieneInforme
            ? "parcial"
            : "pendiente",
      detalle:
        tieneInforme || estudios > 0 || estudiosDocumentales > 0
          ? `${tieneInforme ? "Informe de Salud" : "Sin Informe"} + ${detalleEstudios} ` +
            `con ${contar(indicadores, "indicador", "indicadores")}: ` +
            `fuentes disponibles para revisar la situación de salud y bienestar; su presencia no acredita cobertura completa.`
          : "Sin fuente diagnóstica primaria ni estudios todavía.",
    },
    {
      dimension: "Determinantes sociales",
      estado:
        determinantes > 0
          ? "cubierta"
          : desigualdadTerritorial.available
            ? "parcial"
            : "pendiente",
      detalle:
        determinantes > 0
          ? `${contar(determinantes, "determinante", "determinantes")} con evidencia directa.`
          : desigualdadTerritorial.available
            ? `La documentación territorial del expediente permite lectura de determinantes ` +
              `(${temasTerritoriales || "vulnerabilidad social y territorio"}). ` +
              `Fuentes leídas: ${fuentesTerritoriales || "fuente territorial oficial identificada"}.`
          : `Sin evidencia directa: la lectura se sostiene por hipótesis ` +
            `epidemiológico-sociales. ${BADEA_CANDIDATA}`,
    },
    {
      dimension: "Desigualdades",
      estado: desigualdadTerritorial.available ? "parcial" : "pendiente",
      detalle:
        desigualdadTerritorial.available
          ? `Hay señales territoriales de desigualdad en la documentación del expediente` +
            (desigualdadTerritorial.hasEracisOrPlizd
              ? ` y contexto oficial ERACIS/PLIZD identificado`
              : ``) +
            `. Falta todavía una matriz cuantitativa interna por sexo, edad, renta, barrio ` +
            `u otros ejes; esa ausencia se mantiene como incertidumbre de equidad.`
          : `Los agregados disponibles no están desagregados por sexo, edad ni ` +
            `condición socioeconómica: la ausencia consta como incertidumbre. ` +
            `${BADEA_CANDIDATA}`,
    },
    {
      dimension: "Activos y capacidades",
      estado: activos > 0 ? "cubierta" : "pendiente",
      detalle:
        activos > 0
          ? `${contar(activos, "recurso", "recursos")} de Localiza Salud; solo los validados cuentan como activos. ` +
            `Lectura salutogénica y validación territorial fina pendientes.`
          : `Sin recursos de Localiza Salud incorporados todavía; otras menciones de ` +
            `activos quedan como indicios hasta reconciliarse con la fuente principal.`,
    },
    {
      dimension: "Experiencia vivida / cualitativo",
      estado: cualitativos > 0 ? "parcial" : "pendiente",
      detalle:
        cualitativos > 0
          ? `${contar(cualitativos, "elemento cualitativo", "elementos cualitativos")}: base aún limitada para ` +
            `la perspectiva ciudadana.`
          : "Sin material cualitativo/participativo todavía.",
    },
    {
      dimension: "Incertidumbres",
      estado: cautelas > 0 ? "cubierta" : "pendiente",
      detalle:
        cautelas > 0
          ? `${contar(cautelas, "cautela metodológica declarada", "cautelas metodológicas declaradas")} (escala ` +
            `proxy/contextual incluida): alimentan las incertidumbres críticas ` +
            `del documento.`
          : "Sin cautelas registradas.",
    },
    {
      dimension: "Preguntas para el Grupo Motor",
      estado: preguntasAbiertas > 0 ? "parcial" : "pendiente",
      detalle:
        preguntasAbiertas > 0
          ? `${contar(preguntasAbiertas, "pregunta abierta", "preguntas abiertas")} del equipo técnico, ` +
            `además de las preguntas de contraste generadas por el diagnóstico.`
          : `El diagnóstico genera preguntas de contraste; el equipo puede ` +
            `añadir las suyas en el enriquecimiento interpretativo.`,
    },
    {
      dimension: "Anexo técnico / contexto",
      estado: territoriales > 0 || marcos > 0 || badea ? "cubierta" : "pendiente",
      detalle:
        (territoriales > 0 || marcos > 0
          ? `${contar(territoriales, "documento territorial de contexto", "documentos territoriales de contexto")} y ` +
            `${contar(marcos, "marco estratégico", "marcos estratégicos")} de referencia (los marcos son ` +
            `materiales para el Plan de Acción, no evidencia diagnóstica).`
          : "Sin documentación territorial de contexto todavía.") +
        (badea
          ? ` Contexto sociodemográfico BADEA/IECA incorporado: grado de ` +
            `urbanización de ${badea.territorio} (consulta 19824, ${badea.anio})` +
            `${
              badea.esProxyMunicipioMatriz
                ? ", como contexto del municipio matriz — no estimación distrital"
                : ""
            }.`
          : ""),
    },
  ];

  return (
    <section
      id="psl-enriquecimiento-fuentes"
      className="workspace-panel ekc-panel"
    >
      <p className="eyebrow">
        Espacio de trabajo del equipo técnico · {nombre} — no forma parte del
        documento institucional
      </p>
      <h2 className="ekc-panel__title">Enriquecimiento de fuentes del Perfil</h2>
      <p className="panel-note">
        Este bloque no carga documentos. Resume cómo las fuentes incorporadas al
        Repositorio documental enriquecen la lectura del Perfil y qué dimensiones
        siguen pendientes. Las nuevas fuentes se incorporan desde el
        selector/cargador documental habitual; procesarlas no valida las
        conclusiones del Perfil.
      </p>

      <div className="workspace-panel">
        <h3>Informe de Salud incorporado</h3>
        <p>{workspace.healthReport?.title ?? 'No hay un informe principal registrado.'}</p>
        <p>{workspace.healthReport?.body.charCount ? `Texto disponible: ${workspace.healthReport.body.charCount.toLocaleString('es-ES')} caracteres.` : 'No hay texto procesado del informe principal.'}</p>
        {workspace.healthReport && /\.pdf$/i.test(workspace.healthReport.sourceFileName) && onProcessReport && <button className="doc-repo__open" type="button" disabled={processing} onClick={onProcessReport}>{processing ? 'Procesando informe…' : 'Procesar el PDF ya incorporado'}</button>}
        {message && <p role="status">{message}</p>}
      </div>
      {children}

      <details><summary>Consultar las fuentes del expediente ({docs.length})</summary><ul>{docs.map(document => <li key={document.id}><DocumentReference documentId={document.id}>{document.title}</DocumentReference></li>)}</ul></details>

      <h3 className="ekc-panel__subtitle">
        Dimensiones diagnósticas del Perfil: cobertura actual
      </h3>
      <ul className="pslc-salidas__items">
        {dimensiones.map((d) => (
          <li
            key={d.dimension}
            className={
              d.estado === "pendiente"
                ? "pslc-salidas__item"
                : "pslc-salidas__item pslc-salidas__item--ok"
            }
          >
            <span aria-hidden="true">{MARCA[d.estado]}</span>{" "}
            <strong>{d.dimension}</strong> — {d.estado}. {d.detalle}
          </li>
        ))}
      </ul>
      <p className="panel-note">
        La cobertura de dimensiones es orientativa y no condiciona la
        compilación del PSL-C: el documento se compila con la base disponible y
        declara sus incertidumbres.
      </p>
    </section>
  );
}
