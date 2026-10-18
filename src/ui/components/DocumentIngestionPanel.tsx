import { DocumentFileUpload } from "./DocumentFileUpload";
import { FrameworkReference } from "./FrameworkReference";
import type {
  DocumentKind,
  MunicipalDocument,
} from "../../domain/repository";

interface DocumentKindOption {
  value: DocumentKind;
  label: string;
}

interface DocumentIngestionPanelProps {
  documentKinds: DocumentKindOption[];
  kind: DocumentKind;
  title: string;
  plainText: string;
  lastProcessedDocument: MunicipalDocument | null;
  atomsCreated?: number;
  isLoadingHealthReport?: boolean;
  healthReportMessage?: string | null;
  onKindChange: (kind: DocumentKind) => void;
  onTitleChange: (title: string) => void;
  onPlainTextChange: (plainText: string) => void;
  onProcessDocument: () => void;
  /** Registra el documento solo como referencia: sin texto y sin átomos de evidencia. */
  onRegisterReference?: () => void;
  onLoadHealthReport?: (file: File) => void;
  /** Carga de archivo DOCX/PDF para tipos documentales no-IS (strategic-framework, territorial-documentation, qualitative-material). */
  onLoadDocumentFile?: (file: File) => void;
  isLoadingDocumentFile?: boolean;
  documentFileMessage?: string | null;
}

export function DocumentIngestionPanel({
  documentKinds,
  kind,
  title,
  plainText,
  lastProcessedDocument,
  atomsCreated,
  isLoadingHealthReport,
  healthReportMessage,
  onKindChange,
  onTitleChange,
  onPlainTextChange,
  onProcessDocument,
  onRegisterReference,
  onLoadHealthReport,
  onLoadDocumentFile,
  isLoadingDocumentFile,
  documentFileMessage,
}: DocumentIngestionPanelProps) {
  const hasTitle = title.trim().length > 0;
  const hasText = plainText.trim().length > 0;
  const canSubmit = hasTitle && hasText;
  // Los tipos canónicos (activos, Localiza Salud) tienen una sola versión activa:
  // no se registran como referencia suelta.
  const canRegisterReference =
    onRegisterReference !== undefined && kind !== "community-asset" && kind !== "localiza-salud";

  const hint =
    !hasTitle && !hasText
      ? "Escribe un título y pega el texto del documento para poder registrarlo."
      : !hasTitle
      ? "Escribe un título para el documento."
      : "Pega el texto del documento en el área de abajo.";

  const isHealthReport = kind === "health-report";
  const isComplementaryStudy = kind === "complementary-study";
  const isStrategicFramework = kind === "strategic-framework";
  const isLocalizaSalud = kind === "localiza-salud";
  const isTerritorialDocumentation = kind === "territorial-documentation";
  const isQualitativeMaterial = kind === "qualitative-material";
  const isLongitudinalEvidence = kind === "longitudinal-evidence";
  const acceptsDocumentFile =
    isStrategicFramework || isTerritorialDocumentation || isQualitativeMaterial;
  const submissionHint = acceptsDocumentFile
    ? "La carga desde archivo se registra automáticamente. Este formulario solo se usa si prefieres pegar el contenido manualmente."
    : hint;

  return (
    <section className="workspace-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Añadir o sustituir fuentes</p>
          <h2>Incorporar nueva documentación</h2>
        </div>
        <p className="panel-note">
          Selecciona un archivo para registrarlo directamente o utiliza el
          formulario manual como alternativa. Los documentos con texto extraíble
          alimentan el análisis territorial con evidencias trazables.
        </p>
      </div>

      {isHealthReport ? (
        /* ── Carga del Informe de Salud (DOCX o PDF) ── */
        <div className="docx-upload">
          <select
            value={kind}
            onChange={(event) => onKindChange(event.target.value as DocumentKind)}
            className="docx-upload__kind"
          >
            {documentKinds.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <DocumentFileUpload id="hr-file-input" label="Cargar Informe de Salud (.docx / .doc / .pdf)" accept=".docx,.doc,.pdf" isLoading={isLoadingHealthReport === true} message={healthReportMessage} onFile={onLoadHealthReport} />
        </div>
      ) : isStrategicFramework ? (
        /* ── Carga de marcos estratégicos y normativos ── */
        <div className="docx-upload">
          <select
            value={kind}
            onChange={(event) => onKindChange(event.target.value as DocumentKind)}
            className="docx-upload__kind"
          >
            {documentKinds.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="ingestion-hint">
            Registra marcos estratégicos, planes normativos o guías metodológicas que
            orientan el diagnóstico y la planificación local de salud: <FrameworkReference name="epvsa" />, <FrameworkReference name="esca" />,
            <FrameworkReference name="mayores" /> u otros marcos programáticos autonómicos o estatales.
          </p>
          <p className="ingestion-hint">
            Estos marcos orientan el diagnóstico y la planificación participativa, pero
            no son datos poblacionales ni generan recomendaciones automáticas del Perfil.
            Su función es proporcionar el contexto normativo y estratégico que el equipo
            técnico debe tener presente al interpretar el territorio.
          </p>

          {/* Vía A: subir documento completo (DOCX y PDF → extraen texto cuando está disponible) */}
          <DocumentFileUpload id="sf-file-input" label="Subir documento (.docx o .pdf)" accept=".docx,.pdf" isLoading={isLoadingDocumentFile === true} message={documentFileMessage} onFile={onLoadDocumentFile} />

          {/* Vía B: pegar extracto analítico (genera prioridades estratégicas) */}
          <p className="ingestion-hint">
            Alternativa manual opcional: pega un extracto analítico (líneas de actuación, objetivos, principios rectores).
            Cada línea se registrará como prioridad estratégica de referencia trazable.
          </p>
          <textarea
            value={plainText}
            onChange={(event) => onPlainTextChange(event.target.value)}
            placeholder="Pega aquí el extracto del marco estratégico. Ejemplo: Línea 1 EPVSA — Alimentación saludable y actividad física."
            rows={6}
          />
          <div className="document-form">
            <input
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="Título del marco (ej. EPVSA 2024–2030, Guías RELAS, En Buena Edad…)"
            />
            <button
              type="button"
              onClick={onProcessDocument}
              disabled={!canSubmit}
              title={canSubmit ? undefined : submissionHint}
            >
              Registrar extracto
            </button>
            {canRegisterReference && (
              <button
                type="button"
                className="document-form__reference"
                onClick={onRegisterReference}
                disabled={!hasTitle}
                title="Registra el documento sin texto: no genera evidencia."
              >
                Registrar solo como referencia
              </button>
            )}
          </div>
          {!canSubmit && <p className="ingestion-hint">{submissionHint}</p>}
          {lastProcessedDocument && lastProcessedDocument.kind === "strategic-framework" && (
            <p className="panel-note">
              Último marco registrado:{" "}
              <strong>{lastProcessedDocument.title}</strong>
              {atomsCreated !== undefined && atomsCreated > 0 && (
                <> · <strong>{atomsCreated}</strong> prioridades estratégicas incorporadas</>
              )}
            </p>
          )}
        </div>
      ) : isComplementaryStudy ? (
        /* ── Orientación para Estudios Complementarios tipificados ── */
        <div className="docx-upload">
          <select
            value={kind}
            onChange={(event) => onKindChange(event.target.value as DocumentKind)}
            className="docx-upload__kind"
          >
            {documentKinds.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="ingestion-hint">
            Los instrumentos tipificados (IBSE, DUKE-EAS, PREDIMED-EAS, SF-12) se cargan
            mediante subida de CSV desde el panel <strong>«Estudios Complementarios»</strong>
            más abajo en esta misma página.
          </p>
          <p className="ingestion-hint">
            Usa esta opción sólo para registrar textuales complementarios genéricos (estudios
            publicados, informes de referencia, documentación de contexto) que no sean
            instrumentos EAS tipificados.
          </p>
          <textarea
            value={plainText}
            onChange={(event) => onPlainTextChange(event.target.value)}
            placeholder="Pega el contenido del documento complementario genérico (no instrumentos EAS)."
            rows={6}
          />
          <div className="document-form">
            <input
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="Título del documento o fuente (obligatorio)"
            />
            <button
              type="button"
              onClick={onProcessDocument}
              disabled={!canSubmit}
              title={canSubmit ? undefined : submissionHint}
            >
              Registrar documento
            </button>
            {canRegisterReference && (
              <button
                type="button"
                className="document-form__reference"
                onClick={onRegisterReference}
                disabled={!hasTitle}
                title="Registra el documento sin texto: no genera evidencia."
              >
                Registrar solo como referencia
              </button>
            )}
          </div>
          {!canSubmit && <p className="ingestion-hint">{submissionHint}</p>}
          {lastProcessedDocument && lastProcessedDocument.kind === "complementary-study" && (
            <p className="panel-note">
              Último documento registrado:{" "}
              <strong>{lastProcessedDocument.title}</strong>
              {atomsCreated !== undefined && atomsCreated > 0 && (
                <> · <strong>{atomsCreated}</strong> unidades de evidencia generadas</>
              )}
            </p>
          )}
        </div>
      ) : isLocalizaSalud ? (
        /* ── Carga de activos Localiza Salud ── */
        <div className="docx-upload">
          <select
            value={kind}
            onChange={(event) => onKindChange(event.target.value as DocumentKind)}
            className="docx-upload__kind"
          >
            {documentKinds.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="ingestion-hint">
            Pega el listado de activos copiado desde Localiza Salud.
            Formatos admitidos: <strong>Nombre | Descripción</strong> (recomendado)
            o copia directa tabulada desde la aplicación.
            Una línea por activo. Si ya existe un listado previo para este ámbito, será sustituido.
          </p>
          <p className="ingestion-hint">
            Ejemplo:{" "}
            <code>
              Centro de Salud Zaidín Sur | Atención primaria SAS — Distrito AP Granada-Metropolitano
            </code>
          </p>
          <p className="ingestion-hint">
            Los activos se incorporan como base de trabajo territorial.
            En ámbitos inframunicipales —distritos o barrios—, el copia-pega puede incluir
            recursos del municipio matriz o del entorno funcional más amplio.
            Requieren validación territorial antes de ser interpretados como activos propios del ámbito.
          </p>
          <textarea
            value={plainText}
            onChange={(event) => onPlainTextChange(event.target.value)}
            placeholder={
              "Centro Participación Activa Mayores Zaidín | Talleres deportivos y socioculturales para mayores\n" +
              "Cruz Roja Granada | Atención social y voluntariado\n" +
              "Unidad Salud Mental Comunitaria Zaidín | SAS — atención comunitaria en salud mental"
            }
            rows={7}
          />
          <div className="document-form">
            <input
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="Título del listado (ej. Localiza Salud — Granada-Zaidín 2023)"
            />
            <button
              type="button"
              onClick={onProcessDocument}
              disabled={!canSubmit}
              title={canSubmit ? undefined : submissionHint}
            >
              Registrar activos
            </button>
            {canRegisterReference && (
              <button
                type="button"
                className="document-form__reference"
                onClick={onRegisterReference}
                disabled={!hasTitle}
                title="Registra el documento sin texto: no genera evidencia."
              >
                Registrar solo como referencia
              </button>
            )}
          </div>
          {!canSubmit && <p className="ingestion-hint">{submissionHint}</p>}
          {lastProcessedDocument && lastProcessedDocument.kind === "localiza-salud" && (
            <p className="panel-note">
              Último listado registrado:{" "}
              <strong>{lastProcessedDocument.title}</strong>
              {atomsCreated !== undefined && atomsCreated > 0 && (
                <> · <strong>{atomsCreated}</strong> activos comunitarios incorporados</>
              )}
            </p>
          )}
        </div>
      ) : isTerritorialDocumentation ? (
        /* ── Documentación Territorial de Contexto ── */
        <div className="docx-upload">
          <select
            value={kind}
            onChange={(event) => onKindChange(event.target.value as DocumentKind)}
            className="docx-upload__kind"
          >
            {documentKinds.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="ingestion-hint">
            Registra documentación territorial de contexto: Informes Vigía de zona de salud,
            diagnósticos de barrio o distrito, informes municipales socioeconómicos, datos
            censales u cualquier fuente que contextualice el ámbito desde una perspectiva
            territorial. Cada línea o párrafo se incorporará como unidad de evidencia territorial.
          </p>
          <p className="ingestion-hint">
            Si la fuente cubre un ámbito más amplio que el municipio o distrito —provincial,
            comarcal o de zona de salud—, indícalo en el título para mantener la trazabilidad
            de escala.
          </p>

          {/* Vía A: subir documento DOCX/PDF */}
          <DocumentFileUpload id="td-file-input" label="Subir documento (.docx o .pdf)" accept=".docx,.pdf" isLoading={isLoadingDocumentFile === true} message={documentFileMessage} onFile={onLoadDocumentFile} />

          {/* Vía B: pegar texto */}
          <p className="ingestion-hint">Alternativa manual opcional: pega el contenido directamente:</p>
          <textarea
            value={plainText}
            onChange={(event) => onPlainTextChange(event.target.value)}
            placeholder={"Pega aquí el contenido del Informe Vigía, diagnóstico de barrio u otra fuente territorial.\nEjemplo: La zona básica de salud presenta una tasa de envejecimiento del 22 %, superior a la media provincial."}
            rows={7}
          />
          <div className="document-form">
            <input
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="Título y fuente (ej. Informe Vigía Zaidín Centro Este — 2023)"
            />
            <button
              type="button"
              onClick={onProcessDocument}
              disabled={!canSubmit}
              title={canSubmit ? undefined : submissionHint}
            >
              Registrar documentación
            </button>
            {canRegisterReference && (
              <button
                type="button"
                className="document-form__reference"
                onClick={onRegisterReference}
                disabled={!hasTitle}
                title="Registra el documento sin texto: no genera evidencia."
              >
                Registrar solo como referencia
              </button>
            )}
          </div>
          {!canSubmit && <p className="ingestion-hint">{submissionHint}</p>}
          {lastProcessedDocument && lastProcessedDocument.kind === "territorial-documentation" && (
            <p className="panel-note">
              Último documento registrado:{" "}
              <strong>{lastProcessedDocument.title}</strong>
              {atomsCreated !== undefined && atomsCreated > 0 && (
                <> · <strong>{atomsCreated}</strong> unidades de contexto territorial incorporadas</>
              )}
            </p>
          )}
        </div>
      ) : isQualitativeMaterial ? (
        /* ── Material Cualitativo y Participativo ── */
        <div className="docx-upload">
          <select
            value={kind}
            onChange={(event) => onKindChange(event.target.value as DocumentKind)}
            className="docx-upload__kind"
          >
            {documentKinds.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="ingestion-hint">
            Registra material cualitativo o participativo: actas del Grupo Motor, resultados
            de grupos focales, resúmenes de entrevistas comunitarias, formularios de necesidades
            sentidas u otros materiales de proceso que recogen la perspectiva ciudadana sobre
            el territorio y la salud.
          </p>
          <p className="ingestion-hint">
            Este material aporta un conocimiento del territorio que los datos estadísticos
            no pueden capturar. Antes de trasladarlo a prioridades o acciones, el equipo
            técnico debe establecer el alcance de representatividad y el grado de consenso
            del grupo participante.
          </p>

          {/* Vía A: subir documento DOCX/PDF */}
          <DocumentFileUpload id="qm-file-input" label="Subir acta o documento (.docx o .pdf)" accept=".docx,.pdf" isLoading={isLoadingDocumentFile === true} message={documentFileMessage} onFile={onLoadDocumentFile} />

          {/* Vía B: pegar texto */}
          <p className="ingestion-hint">Alternativa manual opcional: pega el contenido directamente:</p>
          <textarea
            value={plainText}
            onChange={(event) => onPlainTextChange(event.target.value)}
            placeholder={"Pega aquí el contenido del acta, formulario de necesidades sentidas, resumen de grupo focal…\nEjemplo: El grupo identificó el aislamiento de personas mayores como problema principal de salud en el barrio."}
            rows={7}
          />
          <div className="document-form">
            <input
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="Título y fuente (ej. Acta 1 Grupo Motor Granada-Zaidín — marzo 2024)"
            />
            <button
              type="button"
              onClick={onProcessDocument}
              disabled={!canSubmit}
              title={canSubmit ? undefined : submissionHint}
            >
              Registrar material cualitativo
            </button>
            {canRegisterReference && (
              <button
                type="button"
                className="document-form__reference"
                onClick={onRegisterReference}
                disabled={!hasTitle}
                title="Registra el documento sin texto: no genera evidencia."
              >
                Registrar solo como referencia
              </button>
            )}
          </div>
          {!canSubmit && <p className="ingestion-hint">{submissionHint}</p>}
          {lastProcessedDocument && lastProcessedDocument.kind === "qualitative-material" && (
            <p className="panel-note">
              Último material registrado:{" "}
              <strong>{lastProcessedDocument.title}</strong>
              {atomsCreated !== undefined && atomsCreated > 0 && (
                <> · <strong>{atomsCreated}</strong> hallazgos cualitativos incorporados</>
              )}
            </p>
          )}
        </div>
      ) : isLongitudinalEvidence ? (
        /* ── Evidencia longitudinal o comparativa entre ciclos ── */
        <div className="docx-upload">
          <select
            value={kind}
            onChange={(event) => onKindChange(event.target.value as DocumentKind)}
            className="docx-upload__kind"
          >
            {documentKinds.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="ingestion-hint">
            Registra evidencia comparativa entre ciclos de planificación: datos de series
            históricas, evolución de indicadores de salud en años anteriores, resultados de
            evaluaciones de planes previos u otra evidencia que permita trazar la evolución
            del territorio en el tiempo.
          </p>
          <p className="ingestion-hint">
            Esta categoría es especialmente útil en ciclos de actualización del Perfil,
            cuando existe un diagnóstico anterior con el que contrastar. En un primer ciclo
            sin datos previos, puede dejarse sin contenido o incorporarse solo si hay series
            históricas disponibles externas al proceso actual.
          </p>
          <textarea
            value={plainText}
            onChange={(event) => onPlainTextChange(event.target.value)}
            placeholder={"Pega aquí la evidencia comparativa o la serie histórica relevante.\nEjemplo: Tasa de mortalidad evitable 2018–2023 — Zona básica Zaidín Sur: evolución descendente del 12 % al 9 %."}
            rows={8}
          />
          <div className="document-form">
            <input
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="Título y período (ej. Evolución indicadores salud Zaidín 2018–2023)"
            />
            <button
              type="button"
              onClick={onProcessDocument}
              disabled={!canSubmit}
              title={canSubmit ? undefined : submissionHint}
            >
              Registrar evidencia longitudinal
            </button>
            {canRegisterReference && (
              <button
                type="button"
                className="document-form__reference"
                onClick={onRegisterReference}
                disabled={!hasTitle}
                title="Registra el documento sin texto: no genera evidencia."
              >
                Registrar solo como referencia
              </button>
            )}
          </div>
          {!canSubmit && <p className="ingestion-hint">{submissionHint}</p>}
          {lastProcessedDocument && lastProcessedDocument.kind === "longitudinal-evidence" && (
            <p className="panel-note">
              Última evidencia registrada:{" "}
              <strong>{lastProcessedDocument.title}</strong>
              {atomsCreated !== undefined && atomsCreated > 0 && (
                <> · <strong>{atomsCreated}</strong> snapshots longitudinales incorporados</>
              )}
            </p>
          )}
        </div>
      ) : (
        /* ── Ingesta de texto para otros tipos documentales ── */
        <>
          <textarea
            value={plainText}
            onChange={(event) => onPlainTextChange(event.target.value)}
            placeholder="Pega aquí el contenido del documento municipal. Cada párrafo o línea no vacía se convertirá en una unidad de evidencia estructurada."
            rows={9}
          />

          <div className="document-form">
            <select
              value={kind}
              onChange={(event) => onKindChange(event.target.value as DocumentKind)}
            >
              {documentKinds.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <input
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="Título del documento o fuente (obligatorio)"
            />

            <button
              type="button"
              onClick={onProcessDocument}
              disabled={!canSubmit}
              title={canSubmit ? undefined : submissionHint}
            >
              Registrar documento
            </button>
            {canRegisterReference && (
              <button
                type="button"
                className="document-form__reference"
                onClick={onRegisterReference}
                disabled={!hasTitle}
                title="Registra el documento sin texto: no genera evidencia."
              >
                Registrar solo como referencia
              </button>
            )}
          </div>

          {!canSubmit && (
            <p className="ingestion-hint">{hint}</p>
          )}

          {lastProcessedDocument && (
            <p className="panel-note">
              Último documento registrado:{" "}
              <strong>{lastProcessedDocument.title}</strong>
              {atomsCreated !== undefined && atomsCreated > 0 && (
                <> · <strong>{atomsCreated}</strong> unidades de evidencia generadas</>
              )}
            </p>
          )}
        </>
      )}
    </section>
  );
}
