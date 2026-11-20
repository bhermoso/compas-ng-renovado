import { useState } from "react";
import type { MunicipalityWorkspace } from "../../domain/workspace";
import { STRATEGIC_REFERENCES } from "../../application/strategic-reference-library";
import { createCleanWorkspaceExample, inspectWorkspaceSeparation } from "../../application/clean-workspace-example";
import { documentAccessUrl } from "./documentAccessUtils";
import "./StrategicReferenceLibrary.css";

/** Contenedor transversal de consulta. No atribuye sus documentos al municipio
 * ni los incorpora al motor de evidencia del diagnóstico. */
export function StrategicReferenceLibrary({workspace}: {workspace: MunicipalityWorkspace}) {
  const [showPreview, setShowPreview] = useState(false);
  const summary = inspectWorkspaceSeparation(workspace);

  const downloadClean = () => {
    const example = createCleanWorkspaceExample(workspace);
    const blob = new Blob([JSON.stringify(example, null, 2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `COMPAS-${summary.municipalityId}-ENSAYO-LIMPIO-NO-IMPORTAR-EN-EXPEDIENTE-ACTIVO.json`;
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
    <details className="srl__separation">
      <summary>Preparar un expediente de ensayo limpio · {workspace.municipality.identity.name}</summary>
      <p>La separación todavía no retira nada del expediente existente. Primero se identifican las referencias estratégicas que hoy están duplicadas y se conserva intacta la información municipal.</p>
      <button type="button" onClick={()=>setShowPreview(v=>!v)}>{showPreview ? "Ocultar inventario" : "Examinar contenido antes de separar"}</button>
      {showPreview && <div className="srl__preview">
        <p><strong>{summary.municipalDocuments}</strong> fichas municipales: {summary.strategicCopies} marcos estratégicos y {summary.diagnosticDocuments} documentos de otros tipos.</p>
        <p><strong>{summary.evidenceAtoms}</strong> evidencias · <strong>{summary.originals}</strong> originales registrados · <strong>{summary.profiles}</strong> versiones de Perfil · <strong>{summary.validatedPlans}</strong> planes validados.</p>
        {summary.strategicTitles.length>0 && <details><summary>Marcos estratégicos registrados en este municipio ({summary.strategicCopies})</summary><ul>{summary.strategicTitles.map((title,i)=><li key={i}>{title}</li>)}</ul></details>}
        <p>El ejemplo limpio contiene únicamente la identidad del municipio y las colecciones vacías de documentos y evidencias. No sustituye al expediente real, no elimina sus datos y no modifica Firebase.</p>
        <button type="button" onClick={downloadClean}>Descargar ejemplo limpio en JSON (uso aislado)</button>
        <p className="srl__warning">No importes este JSON sobre el expediente activo: úsalo solo en un entorno de ensayo separado. Antes de una migración real, descarga y verifica una copia de recuperación con los originales.</p>
      </div>}
    </details>
  </section>;
}
