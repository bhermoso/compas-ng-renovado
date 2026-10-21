import { conciliationParagraph } from "../../application/health-profile/antecedents";
import type {
  ProfileIntegratedEditorialView,
  CanonicalEditorialView,
  CanonicalAuthoredClosing,
  CanonicalInstitutionalBoundary,
} from "../../application/health-profile";

interface ProfileIntegratedEditorialPreviewProps {
  /**
   * GOV-SALIDA-01: la vista canónica sellada (`CanonicalEditorialView`) es
   * lectura editorial pura y NO lleva anexo técnico (vive en el hermano
   * `technicalSpace`). El borrador prevalidación conserva la forma antigua
   * (`ProfileIntegratedEditorialView`), cuyo anexo se sigue mostrando aquí.
   */
  view: ProfileIntegratedEditorialView | CanonicalEditorialView;
  /**
   * Declaración digna de lectura territorial pendiente (Paso 4). Solo se muestra
   * cuando el documento no tiene hilos territoriales (`readingStatus:
   * "prioritization-pending"`, p. ej. Zagra). Es un enunciado de pendencia
   * (Popay), no una lectura fabricada.
   */
  pendingReadingNotice?: string;
  /**
   * Cierre de autoría humana (`cierreInterpretativo`) para el BORRADOR vivo
   * (vista legacy). La vista canónica sellada ya lo lleva en `view.humanClosing`
   * y prevalece; esta prop solo sirve al borrador, para que el autor vea su
   * cierre en vivo antes de compilar (Art. 16: la autoría humana vive en el
   * cierre). Mismo origen y función (`buildAuthoredClosing`) que la canónica, así
   * que su contenido coincide con el que mostrará el documento sellado.
   */
  humanClosing?: CanonicalAuthoredClosing | null;
  /**
   * Frontera institucional para el BORRADOR vivo (vista legacy). La vista
   * canónica sellada ya la lleva en `view.institutionalBoundary` y prevalece;
   * esta prop solo sirve al borrador. El enunciado de frontera es fijo (el Perfil
   * concluye, no recomienda); candidaturas y consenso reflejan en vivo la
   * priorización (`buildInstitutionalBoundary(psl.priorizacion)`). Mismo origen y
   * función que la canónica → espejo exacto del documento sellado.
   */
  institutionalBoundary?: CanonicalInstitutionalBoundary | null;
}

function variantClass(variant: string): string {
  return "pie-variant pie-variant--" + variant;
}

// Etiqueta legible del estatus del cruce (Nivel 3), visible junto al hilo.
const EPISTEMIC_LABEL: Record<string, string> = {
  "integrated-interpretation": "Interpretación integrada",
  "plausible-hypothesis": "Hipótesis plausible",
  "open-question": "Pregunta abierta",
};

export function ProfileIntegratedEditorialPreview({
  view,
  pendingReadingNotice,
  humanClosing,
  institutionalBoundary,
}: ProfileIntegratedEditorialPreviewProps) {
  // Fuente única del cierre humano y de la frontera: la vista canónica sellada
  // los lleva en sí misma; el borrador vivo (vista legacy) los recibe por prop.
  // Se rinden una sola vez, con el mismo marcado, de modo que la vista canónica
  // queda byte a byte igual.
  const isCanonical = "institutionalBoundary" in view;
  const resolvedHumanClosing: CanonicalAuthoredClosing | null = isCanonical
    ? view.humanClosing
    : humanClosing ?? null;
  const resolvedBoundary: CanonicalInstitutionalBoundary | null = isCanonical
    ? view.institutionalBoundary
    : institutionalBoundary ?? null;
  // Declaración de lectura territorial pendiente (regla N+1): la vista canónica
  // la lleva en sí misma; el borrador vivo la recibe por prop (fallback). Se
  // rinde como SECCIÓN propia (abajo), no como nota dentro de la lectura integrada.
  const resolvedPendingDeclaration: string | null = isCanonical
    ? view.pendingDeclaration
    : pendingReadingNotice ?? null;
  return (
    <section className="pie-doc workspace-panel" aria-labelledby="pie-title">

      {/* ── Apertura documental ─────────────────────────────────────────── */}
      <header className="pie-doc-open">
        <div className="pie-doc-open__identity">
          <p className="pie-doc-open__meta">
            {view.header.territory} · {view.header.status}
            {view.header.generatedDate !== undefined
              ? " · " + view.header.generatedDate
              : ""}
          </p>
          <h2 id="pie-title" className="pie-doc-open__title">
            {view.header.title}
          </h2>
          <p className="pie-doc-open__subtitle">{view.header.subtitle}</p>
        </div>
        <div className="pie-doc-open__sources" aria-label="Fuentes principales">
          {view.header.sources.map((source) => (
            <span key={source}>{source}</span>
          ))}
        </div>
        <p className="pie-doc-open__scale">{view.header.scale}</p>
      </header>

      {/* ── Imagen general ──────────────────────────────────────────────── */}
      <section className="pie-doc-section" aria-labelledby="pie-overview-title">
        <h3 id="pie-overview-title" className="pie-section__title">
          Imagen general
        </h3>
        <div className="pie-overview">
          {view.overview.map((message) => (
            <article key={message.id} className="pie-overview__item">
              <div className="pie-overview__head">
                <span className={variantClass(message.variant)} aria-hidden="true" />
                <strong className="pie-overview__label">{message.title}</strong>
              </div>
              <p className="pie-overview__body">{message.text}</p>
              <p className="pie-overview__source">{message.source}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Señales principales por fuente ──────────────────────────────── */}
      <section className="pie-doc-section" aria-labelledby="pie-sources-title">
        <h3 id="pie-sources-title" className="pie-section__title">
          Señales principales por fuente
        </h3>
        <div className="pie-base-doc">
          {view.sourceBlocks.map((block) => (
            <div key={block.id} className="pie-base-doc__entry">
              <span className={variantClass(block.variant)} aria-hidden="true" />
              <div className="pie-base-doc__body">
                <strong className="pie-base-doc__name">{block.title}</strong>
                <span className="pie-base-doc__adds"> — {block.whatItAdds}.</span>
                <span className="pie-base-doc__limit"> {block.whatItDoesNotAllow}.</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Señales sanitarias del Informe de salud (ranking de peso textual) ──
          Visualización de la lectura presente SOLO en la vista canónica sellada
          (`view.informeSignalRanking`), en paridad de PRESENCIA con el proyector
          (DOCX/PDF/visor), que ya la emite (Art. 17 bis). Reutiliza la gramática
          visual existente (`pv-bar__*`, `pslc-viewer__ranking*`); sin CSS nuevo.
          El borrador legacy no lleva este campo y no la muestra. */}
      {"informeSignalRanking" in view && view.informeSignalRanking !== null ? (
        <section
          className="pie-doc-section"
          aria-labelledby="pie-informe-ranking-title"
        >
          <h3 id="pie-informe-ranking-title" className="pie-section__title">
            Señales sanitarias del Informe de salud
          </h3>
          <div className="pslc-viewer__ranking">
            {view.informeSignalRanking.items.map((item) => (
              <div key={item.etiqueta} className="pslc-viewer__ranking-fila">
                <span className="pslc-viewer__ranking-etiqueta">
                  {item.etiqueta}
                </span>
                <span className="pv-bar__pista">
                  <span
                    className="pv-bar__relleno pv--informe"
                    style={{
                      width: `${Math.max(
                        4,
                        (item.valor / Math.max(1, item.max)) * 100
                      )}%`,
                    }}
                  />
                </span>
                <span className="pslc-viewer__ranking-valor">{item.valor}</span>
              </div>
            ))}
          </div>
          <p className="pie-hilo__context">
            {view.informeSignalRanking.unidad}.{" "}
            {view.informeSignalRanking.caption}
          </p>
        </section>
      ) : null}

      {/* ── Lectura territorial pendiente (regla N+1) ──────────────────────
          Cuando no hay lectura territorial atomizada, la pendencia (Popay) se
          declara como SECCIÓN propia en posición canónica —igual que el proyector
          (DOCX/PDF/visor)—, no como nota dentro de la lectura integrada. Canónica:
          `view.pendingDeclaration`; borrador: prop de fallback. Reutiliza `.pie-*`;
          sin CSS nuevo. */}
      {resolvedPendingDeclaration !== null ? (
        <section className="pie-doc-section" aria-labelledby="pie-pending-title">
          <h3 id="pie-pending-title" className="pie-section__title">
            Lectura territorial pendiente
          </h3>
          <p className="pie-agenda-intro">{resolvedPendingDeclaration}</p>
        </section>
      ) : null}

      {/* ── Lectura por tema ───────────────────────────────────────────────
          Unidades derivadas del expediente (capacidad, voz e Informe). Solo
          cuando alguna fuente sostiene un tema, como el proyector. */}
      {"readingUnits" in view && view.readingUnits !== undefined ? (
        <section className="pie-doc-section" aria-labelledby="pie-reading-units-title">
          <h3 id="pie-reading-units-title" className="pie-section__title">
            {view.readingUnits.title}
          </h3>
          <p className="pie-agenda-intro">{view.readingUnits.intro}</p>
          {view.readingUnits.units.map((unit) => (
            <article key={unit.topicId} className="pie-hilo">
              <header className="pie-hilo__header">
                <h4 className="pie-hilo__title">{unit.label}</h4>
              </header>
              {unit.lines.map((line) => (
                <p key={line} className="pie-hilo__reading">{line}</p>
              ))}
              <p className="pie-hilo__context">{unit.crossingStatement}</p>
            </article>
          ))}
          {view.readingUnits.gaps.map((gap) => (
            <p key={gap} className="pie-hilo__context">{gap}</p>
          ))}
        </section>
      ) : null}

      {/* ── Lectura integrada del territorio ────────────────────────────────
          Solo cuando hay hilos territoriales, como el proyector: en el caso
          pendiente se rinde «Lectura territorial pendiente» en su lugar (no un
          cajón vacío). El aviso de no exhaustividad acompaña a la lectura, así
          que vive con ella. */}
      {view.territorialReadings.length > 0 ? (
        <section className="pie-doc-section" aria-labelledby="pie-reading-title">
          <h3 id="pie-reading-title" className="pie-section__title">
            Lectura integrada del territorio
          </h3>
          {/* Advertencia de no exhaustividad: una sola vez, no por hilo.
              Reutiliza la clase de nota existente (sin añadir CSS). */}
          <p className="pie-agenda-intro">
            {view.interpretation.nonExhaustiveNotice}
          </p>
          {view.territorialReadings.map((block) => (
            <article
              key={block.id}
              className="pie-hilo"
              aria-labelledby={`pie-h-${block.id}`}
            >
              <header className="pie-hilo__header">
                <span className={variantClass(block.variant)} aria-hidden="true" />
                <h4 id={`pie-h-${block.id}`} className="pie-hilo__title">
                  {block.title}
                </h4>
                {block.epistemicStatus !== undefined ? (
                  <span className="pie-hilo__status">
                    {EPISTEMIC_LABEL[block.epistemicStatus] ?? block.epistemicStatus}
                  </span>
                ) : null}
              </header>
              <p className="pie-hilo__signal">{block.signal}</p>
              {/* La lectura integrada (Nivel 3) cruza agenda sanitaria, señales
                  locales, contexto, mecanismo plausible, desigualdad y capacidad
                  como razonamiento continuo, no como lista de campos. */}
              <p className="pie-hilo__reading">{block.reading}</p>
              <p className="pie-hilo__context">{block.source} · {block.scale}</p>
              <p className="pie-hilo__question">{block.groupMotorQuestion}</p>
              {/* Contraste asistencial (N1b): pregunta abierta SECUNDARia a la
                  pregunta principal del hilo (jerarquía editorial, auditoría 5D).
                  Reutiliza la clase de contexto —peso visual menor— sin CSS nuevo;
                  una sola por hilo, sin listas de indicadores. */}
              {block.clinicalAssistanceQuestion !== undefined ? (
                <p className="pie-hilo__context">
                  <strong>Contraste asistencial: </strong>
                  {block.clinicalAssistanceQuestion}
                </p>
              ) : null}
            </article>
          ))}
        </section>
      ) : null}

      {/* ── Antecedentes de ciclos anteriores ───────────────────────────────
          Solo cuando el equipo técnico ha declarado fuentes históricas, como el
          proyector. No forman parte de la lectura actual. */}
      {"antecedents" in view && view.antecedents !== undefined ? (
        <section className="pie-doc-section" aria-labelledby="pie-antecedents-title">
          <h3 id="pie-antecedents-title" className="pie-section__title">
            {view.antecedents.title}
          </h3>
          <p className="pie-agenda-intro">{view.antecedents.temporalCaution}</p>
          {view.antecedents.sources.map((source) => (
            <article key={source.documentId} className="pie-hilo">
              <header className="pie-hilo__header">
                <h4 className="pie-hilo__title">{source.title}</h4>
                <span className="pie-hilo__status">{source.cycleLabel}</span>
              </header>
              {source.items.map((item) => (
                <p key={item} className="pie-hilo__reading">{item}</p>
              ))}
              {source.gaps.map((gap) => (
                <p key={gap} className="pie-hilo__context">{gap}</p>
              ))}
            </article>
          ))}
          {view.antecedents.conciliations?.map((c) => (
            <p key={c.id} className="pie-hilo__context">{conciliationParagraph(c)}</p>
          ))}
        </section>
      ) : null}

      {/* ── Síntesis interpretativa ────────────────────────────────────────
          Capa conclusiva derivada de los hilos N3: declara tesis, peso,
          cautela y preguntas de contraste. No formula medidas ni sustituye la
          deliberación posterior. */}
      {view.diagnosticSynthesis !== null ? (
        <section
          className="pie-doc-section"
          aria-labelledby="pie-diagnostic-synthesis-title"
        >
          <h3 id="pie-diagnostic-synthesis-title" className="pie-section__title">
            {view.diagnosticSynthesis.title}
          </h3>
          <p className="pie-hilo__reading">{view.diagnosticSynthesis.thesis}</p>
          <p className="pie-hilo__reading">
            {view.diagnosticSynthesis.interpretiveWeight}
          </p>
          <p className="pie-hilo__context">{view.diagnosticSynthesis.caution}</p>
          {view.diagnosticSynthesis.contrastQuestions.length > 0 ? (
            <ul className="pie-cierre__items">
              {view.diagnosticSynthesis.contrastQuestions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {/* ── Indicadores trazadores ──────────────────────────────────────── */}
      {view.tracerTable.length > 0 && (
        <section className="pie-doc-section" aria-labelledby="pie-tracer-title">
          <h3 id="pie-tracer-title" className="pie-section__title">
            Indicadores trazadores: valores y referencias
          </h3>
          <div className="pie-table-wrap">
            <table className="pie-table">
              <caption className="pie-table__caption">
                Valores por bloque temático con referencias provinciales y autonómicas.
                Los valores «proxy contextual» son datos de ámbito provincial usados como referencia de contexto.
              </caption>
              <thead>
                <tr>
                  <th>Bloque</th>
                  <th>Indicador</th>
                  <th>Valor</th>
                  <th>Ref. Granada</th>
                  <th>Ref. Andalucía</th>
                  <th>Escala</th>
                  <th>Lectura</th>
                </tr>
              </thead>
              <tbody>
                {view.tracerTable.map((row) => (
                  <tr key={row.bloque + row.indicador}>
                    <td>{row.bloque}</td>
                    <td>{row.indicador}</td>
                    <td className="pie-table__value">{row.valor}</td>
                    <td>{row.refGranada}</td>
                    <td>{row.refAndalucia}</td>
                    <td>{row.escala}</td>
                    <td>{row.lectura}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Señales principales para deliberación ─────────────────────────────
          Visualización de la lectura presente SOLO en la vista canónica sellada
          (`view.principalSignals`), en paridad de PRESENCIA con el proyector, que
          ya la emite (Art. 17 bis). Reutiliza `pslc-viewer__senales`; sin CSS
          nuevo. El borrador legacy no lleva este campo y no la muestra. */}
      {"principalSignals" in view && view.principalSignals.length > 0 ? (
        <section
          className="pie-doc-section"
          aria-labelledby="pie-principal-signals-title"
        >
          <h3 id="pie-principal-signals-title" className="pie-section__title">
            Señales principales para deliberación
          </h3>
          <ul className="pslc-viewer__senales">
            {view.principalSignals.map((senal) => (
              <li key={senal.grupo + senal.senal}>
                <strong>{senal.grupo}</strong> — {senal.senal} ({senal.fuente}).{" "}
                <em>{senal.pregunta}</em>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* ── Agenda del Grupo Motor ───────────────────────────────────────── */}
      {view.groupMotorAgenda.length > 0 && (
        <section className="pie-doc-section" aria-labelledby="pie-agenda-title">
          <h3 id="pie-agenda-title" className="pie-section__title">
            Qué debe discutir el Grupo Motor
          </h3>
          <p className="pie-agenda-intro">
            Cuestiones para contrastar con la experiencia territorial. El Grupo
            Motor delibera; no recibe prioridades cerradas.
          </p>
          <ol className="pie-delibera">
            {view.groupMotorAgenda.map((card) => (
              <li key={card.id} className="pie-delibera__item">
                <div className="pie-delibera__head">
                  <span className={variantClass(card.variant)} aria-hidden="true" />
                  <strong className="pie-delibera__tema">{card.tema}</strong>
                </div>
                <p className="pie-delibera__senal">{card.senal}</p>
                <p className="pie-delibera__tension">
                  <span className="pie-delibera__mechanism-label">Tensión: </span>
                  {card.mecanismo}
                  {" — "}
                  <span className="pie-delibera__oculto-label">Quién puede quedar fuera: </span>
                  {card.oculto}
                </p>
                <p className="pie-delibera__pregunta">{card.pregunta}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* ── Cierre de la lectura (columnas generadas) ──────────────────────
          El título canónico de estas columnas es «Cierre de la lectura»; el
          rótulo «Cierre interpretativo» queda reservado para el cierre de
          autoría humana (abajo), en paridad con el proyector DOCX/PDF/visor. */}
      <section className="pie-doc-section" aria-labelledby="pie-closing-title">
        <h3 id="pie-closing-title" className="pie-section__title">
          Cierre de la lectura
        </h3>
        <div className="pie-cierre">
          {view.closing.map((column) => (
            <div key={column.id} className="pie-cierre__bloque">
              <h4 className="pie-cierre__titulo">{column.title}</h4>
              <ul className="pie-cierre__items">
                {column.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── Cierre interpretativo (autoría humana) ──────────────────────────
          Cierra la cadena editorial —evidencia → lectura → conclusiones— con la
          voz humana. Se rinde para la vista canónica sellada (`view.humanClosing`)
          Y para el borrador vivo (prop `humanClosing`, desde `psl.cierreInterpretativo`),
          con el mismo marcado: el autor ve su cierre en vivo antes de compilar y
          el documento no diverge (Art. 16 / Art. 17 bis). Reutiliza clases
          `.pie-*`; sin CSS nuevo. */}
      {resolvedHumanClosing !== null ? (
        <section
          className="pie-doc-section"
          aria-labelledby="pie-human-closing-title"
        >
          <h3 id="pie-human-closing-title" className="pie-section__title">
            Cierre interpretativo
          </h3>
          {resolvedHumanClosing.content
            .split("\n\n")
            .map((p) => p.trim())
            .filter((p) => p.length > 0)
            .map((paragraph) => (
              <p key={paragraph} className="pie-hilo__reading">
                {paragraph}
              </p>
            ))}
        </section>
      ) : null}

      {/* ── Frontera institucional ───────────────────────────────────────────
          Cierra la cadena editorial: el Perfil concluye, no recomienda (Art. 16 bis).
          Se rinde para la vista canónica sellada (`view.institutionalBoundary`) Y
          para el borrador vivo (prop `institutionalBoundary`, desde
          `buildInstitutionalBoundary(psl.priorizacion)`), con el mismo marcado: el
          enunciado de frontera es fijo; candidaturas y consenso reflejan en vivo la
          priorización. El borrador anticipa el documento sellado sin divergir
          (Art. 17 bis). El enunciado nombra el «Plan de Acción» para demarcar que
          el Perfil NO lo hace: es demarcación institucional, no prosa editorial. */}
      {resolvedBoundary !== null ? (
        <section
          className="pie-doc-section"
          aria-labelledby="pie-frontier-title"
        >
          <h3 id="pie-frontier-title" className="pie-section__title">
            Frontera institucional
          </h3>
          <p className="pie-hilo__reading">{resolvedBoundary.statement}</p>
          {resolvedBoundary.candidaturas.length > 0 ? (
            <>
              <p className="pie-agenda-intro">
                El documento deja preparadas{" "}
                {resolvedBoundary.candidaturas.length} candidatura(s)
                técnica(s) para la deliberación posterior:
              </p>
              <ul className="pie-cierre__items">
                {resolvedBoundary.candidaturas.map((candidatura) => (
                  <li key={candidatura}>{candidatura}</li>
                ))}
              </ul>
            </>
          ) : null}
          <p className="pie-hilo__context">
            Consenso del Grupo Motor documentado:{" "}
            {resolvedBoundary.consensoDocumentado ? "sí" : "no disponible"}.
          </p>
        </section>
      ) : null}

      {/* ── Lectura territorial ampliada y anexo técnico (colapsado) ──────
          Solo en el borrador prevalidación (forma antigua). La vista canónica
          sellada es lectura pura: su material técnico vive en `technicalSpace`,
          fuera de este componente editorial. */}
      {"technicalAnnex" in view ? (
        <details className="pie-annex">
          <summary>{view.technicalAnnex.title}</summary>
          <p>{view.technicalAnnex.summary}</p>
          <div className="pie-annex__notes">
            {view.technicalAnnex.matrix.notasBloque.map((note) => (
              <p key={note}>{note}</p>
            ))}
          </div>
          <div className="pie-table-wrap">
            <table className="pie-table pie-table--annex">
              <thead>
                <tr>
                  <th>Señal</th>
                  <th>Fuente</th>
                  <th>Escala</th>
                  <th>Mecanismo</th>
                  <th>Pregunta</th>
                </tr>
              </thead>
              <tbody>
                {view.technicalAnnex.matrix.filas.map((row) => (
                  <tr key={row.senal + row.fuente}>
                    <td>{row.senal}</td>
                    <td>{row.fuente}</td>
                    <td>{row.escala}</td>
                    <td>{row.mecanismo}</td>
                    <td>{row.pregunta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}
    </section>
  );
}
