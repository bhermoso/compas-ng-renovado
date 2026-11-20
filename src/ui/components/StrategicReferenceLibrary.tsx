import { useState } from "react";
import type { MunicipalityWorkspace } from "../../domain/workspace";
import { STRATEGIC_REFERENCES } from "../../application/strategic-reference-library";
import { createCleanWorkspaceExample, inspectWorkspaceSeparation } from "../../application/clean-workspace-example";
import { auditStrategicMigration } from "../../application/strategic-migration-audit";
import { documentAccessUrl } from "./documentAccessUtils";
import "./StrategicReferenceLibrary.css";

/** Contenedor transversal de consulta. No atribuye sus documentos al municipio
 * ni los incorpora al motor de evidencia del diagnóstico. */
export function StrategicReferenceLibrary({workspace}: {workspace: MunicipalityWorkspace}) {
  const [showPreview, setShowPreview] = useState(false);
  const summary = inspectWorkspaceSeparation(workspace);
  const audit = auditStrategicMigration(workspace);

  const downloadClean = () => {
    const example = createCleanWorkspaceExample(workspace);
    const blob = new Blob([JSON.stringify(example, null, 2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `COMPAS-ensayo-${summary.municipalityId}-limpio.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const downloadAudit = () => {
    const data = JSON.stringify(audit, null, 2);
    const url = URL.createObjectURL(new Blob([data], {type:"application/json"}));
    const link = document.createElement("a");
    link.href = url;
    link.download = `COMPAS-auditoria-estrategica-${summary.municipalityId}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return <section className="workspace-panel srl" aria-labelledby="srl-title">
    <header className="srl__head">
      <div>
        <p className="eyebrow">COMPÁS · Biblioteca compartida</p>
        <h2 id="srl-title">Documentación de referencia estratégica</h2>
      </div>
      <span className="srl__count">{STRATEGIC_REFERENCES.length} documentos comunes</span>
    </header>
    <p className="panel-note">Estos marcos son referencias para todos los ámbitos. No pertenecen a Atarfe, Loja ni a otro municipio y no se cuentan como evidencia de salud local. Su presencia no certifica vigencia ni aplicación institucional.</p>
    <details className="srl__references">
      <summary>Consultar biblioteca estratégica común · {STRATEGIC_REFERENCES.length} documentos</summary>
      <ul>
        {STRATEGIC_REFERENCES.map(item => {
          const url = documentAccessUrl(item.sourcePath);
          return <li key={item.id}>
            <span><strong>{item.title}</strong><small>Ámbito: Andalucía · {item.category === "plan" ? "Plan" : "Estrategia"}</small></span>
            {url ? <a href={url} target="_blank" rel="noopener noreferrer">Abrir PDF de referencia</a> : <span>Archivo no accesible</span>}
          </li>;
        })}
      </ul>
    </details>
    <details className="srl__references srl__migration" data-testid="strategic-migration-audit">
      <summary>Auditar duplicados estratégicos del expediente · {audit.totals.strategic} fichas</summary>
      <p>Inventario de solo lectura. Una coincidencia en la ruta de origen es un candidato de referencia, <strong>no una autorización para borrar</strong> ni una comprobación del original en Firebase.</p>
      <dl className="srl__totals">
        <div><dt>Referencia común exacta</dt><dd>{audit.totals.exactReference}</dd></div>
        <div><dt>Requiere revisión</dt><dd>{audit.totals.requiresReview}</dd></div>
        <div><dt>Ámbito municipal declarado</dt><dd>{audit.totals.municipal}</dd></div>
        <div><dt>Con relaciones</dt><dd>{audit.totals.withDependencies}</dd></div>
      </dl>
      {audit.records.length === 0 ? <p>Este expediente no contiene fichas clasificadas como marco estratégico.</p> :
        <div className="srl__audit-scroll"><table className="srl__audit-table">
          <thead><tr><th>Documento</th><th>Propuesta</th><th>Custodia y dependencias</th></tr></thead>
          <tbody>{audit.records.map(item => <tr key={item.documentId}>
            <th scope="row">{item.title}<small>ID: {item.documentId}</small><small>{item.reason}</small></th>
            <td>{item.disposition === "referencia-exacta" ? "Cotejar con referencia común" : item.disposition === "mantener-municipal" ? "Conservar en municipio" : "Clasificar manualmente"}</td>
            <td>{item.originalRegistered ? "Original registrado (sin cotejo remoto)" : "Sin original registrado"}<small>{item.evidenceLinks} evidencias · {item.conciliationLinks} conciliaciones · {item.assetValidationLinks} validaciones · {item.revisionLinks} vínculos de revisión</small><small>{item.sha256 ? "SHA-256 declarado: "+item.sha256.slice(0,12)+"…" : "Sin huella declarada"}</small></td>
          </tr>)}</tbody>
        </table></div>}
      <button type="button" onClick={downloadAudit}>Descargar inventario para revisión (JSON)</button>
      <p className="srl__warning">No se ha modificado ni movido ningún archivo. La clasificación es orientativa; los marcos territoriales y locales requieren revisión humana.</p>
    </details>
    <details className="srl__separation">
      <summary>Preparar un expediente de ensayo limpio · {workspace.municipality.identity.name}</summary>
      <p>La separación todavía no retira nada del expediente existente. Primero se identifican las referencias estratégicas que hoy están duplicadas y se conserva intacta la información municipal.</p>
      <button type="button" onClick={()=>setShowPreview(v=>!v)}>{showPreview ? "Ocultar inventario" : "Examinar contenido antes de separar"}</button>
      {showPreview && <div className="srl__preview">
        <p><strong>{summary.municipalDocuments}</strong> fichas municipales: {summary.strategicCopies} marcos estratégicos y {summary.diagnosticDocuments} documentos de otros tipos.</p>
        <p><strong>{summary.evidenceAtoms}</strong> evidencias · <strong>{summary.originals}</strong> originales registrados · <strong>{summary.profiles}</strong> versiones de Perfil · <strong>{summary.validatedPlans}</strong> planes validados.</p>
        {summary.strategicTitles.length>0 && <details><summary>Marcos estratégicos registrados en este municipio ({summary.strategicCopies})</summary><ul>{summary.strategicTitles.map((title,i)=><li key={i}>{title}</li>)}</ul></details>}
        <p>El ejemplo crea un ámbito independiente («ensayo-» + identificador municipal), con el mismo código INE y sin documentos, evidencias, versiones ni planes. El expediente real permanece intacto; no se escribe en Firebase.</p>
        <button type="button" onClick={downloadClean}>Descargar expediente de ensayo limpio</button>
        <p className="srl__warning">El JSON puede importarse desde «Conservar y recuperar el trabajo» como otro ámbito, sin sustituir Atarfe o Loja. Es una simulación, no un expediente observado. Antes de limpiar documentos reales, descarga una copia de recuperación con originales y compruébala.</p>
      </div>}
    </details>
  </section>;
}
