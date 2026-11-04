import { useState } from "react";
import { institutionalHealthReportTitle } from "../../application/health-profile";
import type { HealthReportDocument, HealthReportSection } from "../../domain/health-report";
import type { MunicipalDocumentRepository } from '../../domain/repository';
import { DocumentAccess } from './DocumentAccess.tsx';
import { DocumentReference } from './Documentation';

interface HealthReportViewerProps {
  healthReport?: HealthReportDocument;
  repository?: MunicipalDocumentRepository;
}

export function HealthReportViewer({ healthReport, repository }: HealthReportViewerProps) {
  const [open, setOpen] = useState(false);

  const loaded = healthReport !== undefined;
  const sourceDocument = repository?.documents.find(d => d.id === healthReport?.linkedDocumentId);

  const toggleRow = (
    <button
      type="button"
      className="fde-source-toggle"
      onClick={() => setOpen((o) => !o)}
      aria-expanded={open}
    >
      <span
        className={`ec-instrument__dot${loaded ? " ec-instrument__dot--loaded" : ""}`}
      />
      <span className="fde-source-toggle__name">Informe de Salud</span>
      <span className="fde-source-toggle__subtitle">Fuente diagnóstica primaria</span>
      <span className="fde-source-toggle__status">
        {healthReport ? institutionalHealthReportTitle(healthReport.municipalityId, healthReport.title) : "Sin informe"}
      </span>
      <span className="fde-source-toggle__arrow">{open ? "▲" : "▼"}</span>
    </button>
  );

  if (!healthReport) {
    return (
      <section className="workspace-panel fde-source-panel">
        {toggleRow}
        {open && (
          <div className="fde-source-body">
            <div className="panel-header" style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}>
              <div>
                <p className="eyebrow">Informe de Salud · Fuente primaria</p>
                <h2>Informe de Situación de Salud</h2>
              </div>
              <p className="panel-note">
                Cuando se registre el Informe de Salud se podrá consultar su archivo
                original, si está disponible, y el texto que se haya conservado.
              </p>
            </div>
            <p className="empty-state">
              No hay ningún Informe de Salud cargado en este espacio de trabajo.
            </p>
          </div>


        )}
      </section>
    );
  }

  const authors = [...healthReport.authors].sort(
    (a, b) => a.signatureOrder - b.signatureOrder
  );

  return (
    <section className="workspace-panel hr-viewer fde-source-panel">
      {toggleRow}
      {open && (
        <>
          {/* Encabezado institucional */}
          <div className="hr-viewer__header">
            <div>
              <p className="eyebrow">Informe de Salud · Fuente primaria</p>
              <h2 className="hr-viewer__title"><DocumentReference documentId={healthReport.linkedDocumentId}>{institutionalHealthReportTitle(healthReport.municipalityId, healthReport.title)}</DocumentReference></h2>
            </div>
            <div className="hr-viewer__meta">
              <span className="panel-note">
                Fichero: <strong>{healthReport.sourceFileName}</strong>
              </span>
              {healthReport.reportingPeriod && (
                <span className="panel-note">
                  Período: <strong>{healthReport.reportingPeriod}</strong>
                </span>
              )}
              {healthReport.body.format === "html" && (
                <span className="panel-note">
                  {healthReport.sections.length} sección(es)
                  {" · "}
                  {healthReport.body.charCount.toLocaleString("es-ES")} caracteres
                  {healthReport.body.tableCount !== undefined &&
                    ` · ${healthReport.body.tableCount} tabla(s)`}
                </span>
              )}
            </div>
          </div>

          <div className="hr-viewer__source-access">
            <h3>Documento fuente</h3>
            <p><strong>Título registrado:</strong> <DocumentReference documentId={healthReport.linkedDocumentId}>{healthReport.title}</DocumentReference></p>
            {sourceDocument ? <DocumentAccess key={sourceDocument.id} document={sourceDocument} /> : <p>No se ha localizado el registro documental vinculado a este informe.</p>}
            {healthReport.body.format === 'html' && <p><strong>Vista convertida del Word.</strong> Las imágenes, gráficos y el formato pueden no haberse conservado. Consulta el archivo original para comprobarlos.</p>}
            {/estilo[_ ]Atarfe/i.test(healthReport.sourceFileName) && <p><strong>Versión adaptada.</strong> Este registro procede de «{healthReport.sourceFileName}». No acredita la conservación del PDF original del distrito.</p>}
          </div>

          {/* Autoría institucional — solo para DOCX con autoría registrada */}
          {authors.length > 0 && (
            <div className="hr-viewer__authors">
              <p className="hr-viewer__section-label">Autoría</p>
              <ul className="hr-viewer__authors-list">
                {authors.map((author) => (
                  <li key={author.signatureOrder} className="hr-viewer__author-entry">
                    <strong>{author.name}</strong>
                    {author.role && <span>{author.role}</span>}
                    {author.organisation && <span>{author.organisation}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Índice de secciones — solo para DOCX */}
          {healthReport.body.format === "html" && healthReport.sections.length > 0 && (
            <nav className="hr-viewer__toc" aria-label="Índice del informe">
              <p className="hr-viewer__section-label">Índice</p>
              <ol className="hr-viewer__toc-list">
                {healthReport.sections.map((section) => (
                  <li key={`${section.key}-${section.sortOrder}`}>
                    <a href={`#hr-section-${section.key}-${section.sortOrder}`}>{section.title}</a>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          {/* Contenido — DOCX con vista formateada o PDF preservado */}
          {healthReport.body.format === "html" ? (
            <div className="hr-viewer__sections">
              {healthReport.sections.map((section) => (
                <ReportSection key={`${section.key}-${section.sortOrder}`} section={section} />
              ))}
            </div>
          ) : (
            <div className="hr-viewer__section-ocr-notice">
              <p className="hr-viewer__section-ocr-label">Informe registrado en PDF</p>
              <p className="hr-viewer__section-ocr-note">
                Documento PDF cargado como fuente diagnóstica primaria.
                La disponibilidad del original se indica en «Documento fuente».
                No se ha convertido en evidencia estructurada ni se ha usado para generar análisis automático.
              </p>
              <p className="hr-viewer__section-ocr-note">
                Archivo de referencia:{" "}
                <strong>{healthReport.sourceFileName}</strong>
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function ReportSection({ section }: { section: HealthReportSection }) {
  return (
    <article id={`hr-section-${section.key}-${section.sortOrder}`} className="hr-viewer__section">
      <h3 className="hr-viewer__section-title">{section.title}</h3>
      {section.bodyHtml ? (
        // bodyHtml proviene exclusivamente de Mammoth sobre el DOCX local del
        // Informe de Salud municipal (fuente controlada). No se aplica
        // sanitización adicional en esta intervención.
        <div
          className="hr-viewer__section-html"
          dangerouslySetInnerHTML={{ __html: section.bodyHtml }}
        />
      ) : (
        <div className="hr-viewer__section-ocr-notice">
          <p className="hr-viewer__section-ocr-label">Vista de sección no disponible</p>
          <p className="hr-viewer__section-ocr-note">
            Esta sección no dispone de vista formateada.
            Para consultar el contenido, abre el documento fuente.
          </p>
        </div>
      )}
    </article>
  );
}
