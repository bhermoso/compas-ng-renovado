import { useState } from "react";
import type { ExternalProfileLibrary } from "../../domain/health-profile/ExternalHealthProfile";

type CheckResult = { kind: "match"; names: string[] } | { kind: "absent" } | { kind: "error"; message: string };

/** Read-only: compares the selected PDF bytes with attachments already loaded in this municipality. */
export function ProfileOriginalVerifier({ library }: { library: ExternalProfileLibrary }) {
 const [result,setResult]=useState<CheckResult>();
 const [checking,setChecking]=useState(false);
 const pdfs=library.attachments.filter(a=>a.mimeType==="application/pdf" || /\.pdf$/i.test(a.name));
 async function check(file?: File) {
  setResult(undefined);
  if(!file)return;
  if(!/\.pdf$/i.test(file.name) && file.type!=="application/pdf") {setResult({kind:"error",message:"Selecciona un documento PDF."});return;}
  setChecking(true);
  try {
   const digest=await crypto.subtle.digest("SHA-256",await file.arrayBuffer());
   const hex=Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,"0")).join("");
   const matches=pdfs.filter(a=>a.sha256.toLowerCase()===hex);
   if(matches.length) {
    const names=matches.flatMap(a=>library.profiles.filter(p=>p.attachmentIds.includes(a.id)).map(p=>p.title+" · "+a.name));
    setResult({kind:"match",names:names.length?names:[matches[0].name+" (sin versión vinculada)"]});
   } else setResult({kind:"absent"});
  } catch {setResult({kind:"error",message:"No ha sido posible leer este PDF para compararlo."});}
  finally {setChecking(false);}
 }
 return <section className="ep-original-check" aria-label="Comprobar PDF original en el expediente">
  <h3>Comprobar si el PDF original ya está guardado</h3>
  <p>En este expediente figuran <strong>{library.profiles.length} versiones externas</strong> y <strong>{pdfs.length} PDF originales adjuntos</strong>. Los perfiles anteriores generados en COMPÁS se conservan por otra vía.</p>
  <label className="ep-original-check__input">Seleccionar PDF para cotejar su contenido exacto
   <input type="file" accept=".pdf,application/pdf" disabled={checking} onChange={e=>void check(e.currentTarget.files?.[0])}/>
  </label>
  {checking&&<p role="status">Comparando huella digital del archivo…</p>}
  {result?.kind==="match"&&<p role="status"><strong>Coincidencia exacta.</strong> Este PDF ya está asociado a la biblioteca de perfiles externos del expediente: {result.names.join("; ")}.</p>}
  {result?.kind==="absent"&&<p role="status"><strong>No hay coincidencia exacta</strong> entre este PDF y los originales PDF de las versiones externas cargadas. Esto no descarta que exista una copia distinta, un documento Word o un perfil generado anteriormente en COMPÁS.</p>}
  {result?.kind==="error"&&<p role="alert">{result.message}</p>}
  <p className="ep-help">Esta comprobación solo lee el archivo seleccionado y los registros ya cargados. No sube archivos, no guarda datos y no modifica ninguna versión.</p>
 </section>;
}
