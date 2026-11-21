import { useState } from "react";
import type { MunicipalityWorkspace } from "../../domain/workspace";
import { STRATEGIC_REFERENCES } from "../../application/strategic-reference-library";
import { createCleanWorkspaceExample, inspectWorkspaceSeparation } from "../../application/clean-workspace-example";
import { auditStrategicMigration } from "../../application/strategic-migration-audit";
import { normalizeKnownMunicipalDocumentKinds } from "../../application/workspace/normalizeKnownMunicipalDocuments";
import { createBackup, inspectBackup } from "../../infrastructure/recovery/browserRecovery";
import { bundledDocuments } from "./documentAccessUtils";
import "./StrategicReferenceLibrary.css";

/** Contenedor transversal de consulta. No atribuye sus documentos al municipio
 * ni los incorpora al motor de evidencia del diagnóstico. */
interface StrategicReferenceLibraryProps {
  workspace: MunicipalityWorkspace;
  onNormalizeLojaRemote?: (expectedWorkspace: MunicipalityWorkspace) => Promise<"updated" | "already-normalized">;
}

export function StrategicReferenceLibrary({workspace,onNormalizeLojaRemote}: StrategicReferenceLibraryProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [backupPreparedFor, setBackupPreparedFor] = useState<string | null>(null);
  const [backupConfirmed, setBackupConfirmed] = useState(false);
  const [backupNotices, setBackupNotices] = useState<string[]>([]);
  const [repairBusy, setRepairBusy] = useState(false);
  const [repairStatus, setRepairStatus] = useState("");
  const summary = inspectWorkspaceSeparation(workspace);
  const audit = auditStrategicMigration(workspace);
  const normalization = normalizeKnownMunicipalDocumentKinds(workspace);
  const canNormalizeLoja = workspace.municipality.identity.id === "loja" && normalization.changes.length === 1;
  const backupCurrent = backupPreparedFor === workspace.updatedAt;
  async function prepareLojaBackup() {
    setRepairBusy(true);
    setRepairStatus("Preparando copia de recuperación...");
    setBackupPreparedFor(null);
    setBackupConfirmed(false);
    try {
      const backup = await createBackup(workspace,bundledDocuments);
      await inspectBackup(JSON.stringify(backup));
      const blob = new Blob([JSON.stringify(backup)],{type:"application/json"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href=url;
      a.download=`COMPAS-LOJA-antes-normalizar-${workspace.updatedAt.replace(/[:.]/g,"-")}.compas.json`;
      a.click();
      window.setTimeout(()=>URL.revokeObjectURL(url),1000);
      setBackupPreparedFor(workspace.updatedAt);
      setBackupNotices(backup.payload.notices);
      setRepairStatus("La copia ha superado la comprobación de integridad. Comprueba que se ha descargado y revisa las limitaciones antes de continuar.");
    } catch(error) {
      setRepairStatus(`No se pudo preparar una copia verificable: ${error instanceof Error ? error.message : "error desconocido"}`);
    } finally {
      setRepairBusy(false);
    }
  }
  async function applyLojaCorrection() {
    if (!onNormalizeLojaRemote || !canNormalizeLoja || !backupCurrent || !backupConfirmed || repairBusy) return;
    if (!window.confirm("Se modificará únicamente el tipo documental del Plan de Acción histórico de Loja, tras comparar Firebase. ¿Has conservado la copia de recuperación?")) return;
    setRepairBusy(true);
    setRepairStatus("Comprobando la versión remota antes de guardar...");
    try {
      const result = await onNormalizeLojaRemote(workspace);
      setRepairStatus(result === "updated"
        ? "Corrección guardada y cotejada contra Firebase. Los originales y el resto de fichas permanecen intactos."
        : "Firebase ya tenía el tipo documental corregido. No se ha escrito nada.");
      setBackupPreparedFor(null);
      setBackupConfirmed(false);
    } catch(error) {
      setRepairStatus(`No se pudo completar la normalización: ${error instanceof Error ? error.message : "error desconocido"}. Conserva la copia.`);
    } finally {
      setRepairBusy(false);
    }
  }

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
        <p className="eyebrow">COMPÁS · Marco estratégico común</p>
        <h2 id="srl-title">Copias municipales de marcos estratégicos</h2>
      </div>
      <span className="srl__count">{STRATEGIC_REFERENCES.length} documentos comunes</span>
    </header>
    <p className="panel-note">El marco estratégico común se consulta en el acceso «Marco estratégico común» de Diagnóstico y es el mismo en todos los expedientes. Aquí se revisan las copias de esos marcos que algunos expedientes guardaron como documento propio; no se cuentan como evidencia de salud local ni se borran sin revisión.</p>
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
    {canNormalizeLoja && <details className="srl__references srl__repair" data-testid="loja-metadata-normalization">
      <summary>Normalizar la ficha histórica del Plan de Acción de Loja · revisión controlada</summary>
      <p>El documento de 2022 está registrado como «marco estratégico» pese a ser un Plan de Acción municipal. La operación propuesta corrige exclusivamente su tipo a «documentación territorial», y mantiene su clasificación como Plan de Acción, sus originales y todos los vínculos.</p>
      <p><strong>Documento:</strong> {normalization.changes[0]?.documentId} · <strong>Revisión:</strong> {workspace.updatedAt}</p>
      <p><strong>1.</strong> Preparar copia de recuperación y comprobar su integridad. Incluye los expedientes disponibles en este navegador y los originales accesibles, con avisos sobre posibles ausencias.</p>
      <button type="button" disabled={repairBusy} onClick={()=>void prepareLojaBackup()}>Descargar y comprobar copia previa</button>
      {backupCurrent && <>
        {backupNotices.length>0 && <details><summary>Limitaciones de originales en la copia · {backupNotices.length}</summary><ul>{backupNotices.map((notice,i)=><li key={i}>{notice}</li>)}</ul></details>}
        <label className="srl__ack"><input type="checkbox" checked={backupConfirmed} onChange={e=>setBackupConfirmed(e.target.checked)}/> He comprobado que la copia se ha descargado y he revisado sus limitaciones.</label>
        <p><strong>2.</strong> Cotejar el expediente completo con Firebase y guardar solo si coincide exactamente con esta revisión.</p>
        <button type="button" disabled={!backupConfirmed || !onNormalizeLojaRemote || repairBusy} onClick={()=>void applyLojaCorrection()}>Aplicar corrección en Firebase con control de versión</button>
      </>}
      {!onNormalizeLojaRemote && <p>Operación no disponible: necesitas una sesión con permiso de escritura y el expediente de Loja recuperado desde Firebase.</p>}
      {repairStatus && <p role="status" className="srl__warning">{repairStatus}</p>}
    </details>}
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
