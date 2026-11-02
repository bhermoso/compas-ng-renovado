import { useMemo, useState } from "react";
import { parseProfileStructure } from "../../application/health-profile/profileStructure";
import type { ExternalHealthProfile } from "../../domain/health-profile/ExternalHealthProfile";
import "./ProfileEditorialLab.css";

type Score = "pendiente" | "mejora" | "similar" | "peor";
type Decision = "pendiente" | "aceptada" | "rechazada" | "aplazada";
export function ProfileEditorialLab({ profile }: { profile: ExternalHealthProfile }) {
 const chapters=useMemo(()=>parseProfileStructure(profile.text).sections.filter(s=>s.paragraphs.length>0),[profile.text]);
 const [chapterId,setChapterId]=useState("");
 const [alternative,setAlternative]=useState("");
 const [score,setScore]=useState<Score>("pendiente");
 const [reason,setReason]=useState("");
 const [showOriginal,setShowOriginal]=useState(true);
 const [fragment,setFragment]=useState("");
 const [replacement,setReplacement]=useState("");
 const [justification,setJustification]=useState("");
 const [decision,setDecision]=useState<Decision>("pendiente");
 const [reviewer,setReviewer]=useState("");
 const [decisionReason,setDecisionReason]=useState("");
 const [evidence,setEvidence]=useState("");
 const selected=chapters.find(c=>c.id===chapterId)??chapters[0];
 const original=selected?.paragraphs.join("\n\n")??"";
 const different=original.trim()!==alternative.trim();
 const matches=fragment.trim()?original.split(fragment).length-1:0;
 const revised=matches===1?original.replace(fragment,replacement):original;
 const minimallyChanged=Boolean(matches===1&&replacement.trim()&&replacement!==fragment&&justification.trim());
 const decisionReady=Boolean(minimallyChanged&&evidence.trim()&&decision!=="pendiente"&&reviewer.trim()&&decisionReason.trim());
 return <section className="pel" aria-label="Laboratorio editorial experimental">
   <header><p className="ep-eyebrow">EXPERIMENTO · SIN PUBLICACIÓN</p><h2>Laboratorio de elaboración</h2>
    <p>Compare un capítulo del perfil ya elaborado con una alternativa redactada y evaluada por el equipo. Esta herramienta no genera textos automáticamente ni modifica el perfil vigente.</p></header>
   <label className="pel-chapter">Capítulo de referencia
     <select value={selected?.id??""} onChange={e=>{setChapterId(e.target.value);setAlternative("");setScore("pendiente");setReason("");setFragment("");setReplacement("");setJustification("");setEvidence("");setDecision("pendiente");setReviewer("");setDecisionReason("");}}>
       {chapters.map(s=><option key={s.id} value={s.id}>{s.title}</option>)}
     </select></label>
   {!selected?<p>No se reconocen capítulos con texto en esta revisión. El perfil externo sigue disponible sin cambios.</p>:<>
    <div className="pel-columns">
     <article><h3>Documento original</h3><p className="pel-meta">Referencia: {profile.title} · {profile.period||"Periodo no declarado"}</p>
      <button type="button" onClick={()=>setShowOriginal(v=>!v)}>{showOriginal?"Ocultar":"Mostrar"} capítulo de referencia</button>
      {showOriginal&&<div className="pel-original">{selected.paragraphs.map((p,i)=><p key={i}>{p}</p>)}</div>}</article>
     <article><h3>Versión experimental</h3><p className="pel-meta">Redacción manual, no validada</p>
      <textarea rows={16} value={alternative} onChange={e=>setAlternative(e.target.value)} placeholder="Escribe o pega una alternativa para compararla. No se guarda en Firebase." aria-label="Texto alternativo del capítulo" />
      <p className="pel-meta">{alternative.trim().length} caracteres · {different?"Texto diferente":"Sin cambios respecto al original"}</p>
     </article>
    </div>
    <section className="pel-evaluation" aria-label="Corrección puntual">
     <h3>Revisión mínima del texto</h3>
     <p>Señala un fragmento literal del documento y propón únicamente su sustitución. No se cambia el original ni se ejecuta ninguna modificación en Firebase.</p>
     <label>Fragmento exacto del original<textarea rows={3} value={fragment} onChange={e=>setFragment(e.target.value)} placeholder="Copia aquí una frase del capítulo original." /></label>
     <p className="pel-meta">{!fragment.trim()?"Selecciona una frase existente.":matches===1?"Coincidencia única: sustitución comprobable.":matches===0?"El fragmento no aparece exactamente en el capítulo.":`El fragmento aparece ${matches} veces; amplía la selección.`}</p>
     <label>Redacción alternativa de ese fragmento<textarea rows={3} value={replacement} onChange={e=>setReplacement(e.target.value)} placeholder="Reescribe solo la parte que necesita corrección." /></label>
     <label>Motivo técnico y referencia que debe comprobarse<textarea rows={3} value={justification} onChange={e=>setJustification(e.target.value)} placeholder="Describe el problema y la evidencia que sustenta el cambio." /></label>
     <label>Evidencia o fuente asociada<textarea rows={2} value={evidence} onChange={e=>setEvidence(e.target.value)} placeholder="Ej.: Informe epidemiológico [5], tabla 12. Pendiente de comprobar con el documento primario." /></label>
     <fieldset className="pel-decision"><legend>Decisión profesional sobre esta propuesta</legend>
      <div className="pel-options">{([["pendiente","Pendiente"],["aceptada","Aceptada para revisión"],["rechazada","Rechazada"],["aplazada","Aplazada"]] as const).map(([value,label])=><label key={value}><input type="radio" name="pel-decision" checked={decision===value} onChange={()=>setDecision(value)}/>{label}</label>)}</div>
      <label>Responsable de la valoración<input type="text" value={reviewer} onChange={e=>setReviewer(e.target.value)} placeholder="Nombre o identificación profesional" /></label>
      <label>Motivación de la decisión<textarea rows={3} value={decisionReason} onChange={e=>setDecisionReason(e.target.value)} placeholder="Explica por qué se acepta, rechaza o aplaza. Aceptar aquí no publica ningún cambio." /></label>
     </fieldset>
     {matches===1&&<details><summary>Vista previa del capítulo con la sustitución</summary><div className="pel-original">{revised.split("\n\n").map((p,i)=><p key={i}>{p}</p>)}</div></details>}
     <button type="button" disabled={!minimallyChanged} onClick={()=>{
      const body=[`Perfil: ${profile.title}`,`Capítulo: ${selected.title}`,"REVISIÓN PUNTUAL EXPERIMENTAL · NO VALIDADA","","FRAGMENTO ORIGINAL",fragment,"","SUSTITUCIÓN PROPUESTA",replacement,"","JUSTIFICACIÓN Y VERIFICACIÓN",justification,"","EVIDENCIA DECLARADA",evidence,"","DECISIÓN PROFESIONAL",decision,"Responsable",reviewer,"Motivación",decisionReason,"","CAPÍTULO EN VISTA PREVIA",revised].join("\n");
      const blob=new Blob([body],{type:"text/plain;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="revision-puntual-perfil.txt";a.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
     }}>Descargar propuesta de corrección puntual · TXT</button>
     <button type="button" disabled={!decisionReady} onClick={()=>{
      const record={kind:"compas-editorial-review",schemaVersion:1,profileId:profile.id,profileTitle:profile.title,chapterId:selected.id,chapterTitle:selected.title,originalFragment:fragment,replacement,justification,evidence,decision,reviewer,decisionReason,recordedAt:new Date().toISOString(),published:false,validatedProfile:false};
      const blob=new Blob([JSON.stringify(record,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="decision-editorial-perfil.json";a.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
     }}>Exportar decisión profesional · JSON</button>
     <p className="pel-note">La aceptación registra una decisión editorial, no modifica ni valida el perfil. El registro se descarga localmente; esta versión experimental no conserva historial en el servidor.</p>
    </section>
    <div className="pel-evaluation"><h3>Comparación de capítulos completos (opcional)</h3>
     <p>¿La alternativa mejora el capítulo original en rigor, narrativa, claridad y esfuerzo de revisión?</p>
     <div className="pel-options">{([["pendiente","Sin evaluar"],["mejora","Mejora"],["similar","Equivalente"],["peor","Peor"]] as const).map(([value,label])=><label key={value}><input type="radio" name="pel-score" checked={score===value} onChange={()=>setScore(value)}/>{label}</label>)}</div>
     <label>Razones y aspectos pendientes de comprobar<textarea rows={4} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Justifica la valoración; indica afirmaciones que necesiten evidencia." /></label>
     <button type="button" onClick={()=>{
       const body=["LABORATORIO DE PERFIL · EVALUACIÓN EXPERIMENTAL",`Perfil: ${profile.title}`,`Capítulo: ${selected.title}`,`Valoración: ${score}`,"","ORIGINAL",original,"","ALTERNATIVA",alternative,"","VALORACIÓN",reason].join("\n");
       const blob=new Blob([body],{type:"text/plain;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="comparacion-editorial-perfil.txt";a.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
     }} disabled={!alternative.trim()||score==="pendiente"||!reason.trim()}>Descargar comparación y evaluación · TXT</button>
     <p className="pel-note">Sesión temporal: los borradores de este laboratorio no se guardan ni se publican. Descarga la comparación si quieres conservarla.</p>
    </div>
   </>}
  </section>;
}
