import { useMemo, useState } from "react";
import type { MunicipalityWorkspace } from "../../domain/workspace";
import type { PSLCDocumentModel } from "../../application/psl-c-export";
import { compileInitialLocalHealthPlan } from "../../application/health-plan/compileInitialLocalHealthPlan";
import { downloadInitialLocalHealthPlan } from "../../application/health-plan/downloadInitialLocalHealthPlan";
import { DocumentModelViewer } from "./PSLCArtifactViewer";

export function InitialLocalHealthPlanPanel({ workspace, pslIsStale }: {
 workspace: MunicipalityWorkspace; pslIsStale: boolean;
}) {
 const ready = useMemo(() => compileInitialLocalHealthPlan(workspace, pslIsStale, ""), [workspace, pslIsStale]);
 const signature = JSON.stringify(ready);
 const [generated, setGenerated] = useState<{ signature: string; model: PSLCDocumentModel }>();
 const [error, setError] = useState("");
 const [busy, setBusy] = useState(false);
 const current = generated?.signature === signature ? generated.model : undefined;
 function generate() {
  const result = compileInitialLocalHealthPlan(workspace, pslIsStale);
  setError("");
  if (result.ok) setGenerated({signature, model: result.document});
  else setError(result.issues.join(" "));
 }
 async function download(format: "docx" | "pdf") {
  if (!current) return;
  setBusy(true); setError("");
  try { await downloadInitialLocalHealthPlan(current, format); }
  catch { setError("No se ha podido generar la descarga. Vuelve a intentarlo."); }
  finally { setBusy(false); }
 }
 return <section className="workspace-panel" aria-label="Compilación inicial del Plan Local de Salud">
  <h2>Compilación inicial del Plan Local de Salud</h2>
  <p>Reúne el Perfil externo o histórico incorporado (si existe), sus prioridades y la última versión validada del Plan de Acción. Las actuaciones pueden incorporarse después.</p>
  <p>Para incluir cambios recientes, valida y guarda sus versiones antes de generar el documento.</p>
  {ready.ok && <p role="status">Criterio de calidad «Perfil validado»: {ready.profileValidation.met ? "cumplido" : "no cumplido"}. {ready.profileValidation.detail}</p>}
  {!ready.ok && <ul>{ready.issues.map(issue => <li key={issue}>{issue}</li>)}</ul>}
  <button type="button" disabled={!ready.ok || busy} onClick={generate}>Generar borrador del Plan Local de Salud</button>
  {generated && !current && <p role="status">Han cambiado las versiones de origen. Genera de nuevo la compilación.</p>}
  {current && <>
   <button type="button" disabled={busy} onClick={() => void download("docx")}>Descargar borrador en Word</button>
   <button type="button" disabled={busy} onClick={() => void download("pdf")}>Descargar borrador en PDF</button>
   <DocumentModelViewer model={current} label="Borrador inicial del Plan Local de Salud" />
  </>}
  {error && <p role="alert">{error}</p>}
 </section>;
}
