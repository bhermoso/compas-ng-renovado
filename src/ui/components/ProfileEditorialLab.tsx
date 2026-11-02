import { useMemo, useState } from "react";
import { parseProfileStructure } from "../../application/health-profile/profileStructure";
import type { ExternalHealthProfile } from "../../domain/health-profile/ExternalHealthProfile";
import "./ProfileEditorialLab.css";

type Score = "pendiente" | "mejora" | "similar" | "peor";
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
 const selected=chapters.find(c=>c.id===chapterId)??chapters[0];
 const original=selected?.paragraphs.join("\n\n")??"";
 const different=original.trim()!==alternative.trim();
 const matches=fragment.trim()?original.split(fragment).length-1:0;
 const revised=matches===1?original.replace(fragment,replacement):original;
 const minimallyChanged=matches===1&&replacement.trim()&&justification.trim();
 return <section className="pel" aria-label="Laboratorio editorial experimental">
   <header><p className="ep-eyebrow">EXPERIMENTO · SIN PUBLICACIÓN</p><h2>Laboratorio de elaboración</h2>
    <p>Compare un capítulo del perfil ya elaborado con una alternativa redactada y evaluada por el equipo. Esta herramienta no genera textos automáticamente ni modifica el perfil vigente.</p></header>
   <label className="pel-chapter">Capítulo de referencia
     <select value={selected?.id??""} onChange={e=>{setChapterId(e.target.value);setAlternative("");setScore("pendiente");setReason("");setFragment("");setReplacement("");setJustification("");}}>
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
     {matches===1&&<details><summary>Vista previa del capítulo con la sustitución</summary><div className="pel-original">{revised.split("\n\n").map((p,i)=><p key={i}>{p}</p>)}</div></details>}
     <button type="button" disabled={!minimallyChanged} onClick={()=>{
      const body=[`Perfil: ${profile.title}`,`Capítulo: ${selected.title}`,"REVISIÓN PUNTUAL EXPERIMENTAL · NO VALIDADA","","FRAGMENTO ORIGINAL",fragment,"","SUSTITUCIÓN PROPUESTA",replacement,"","JUSTIFICACIÓN Y VERIFICACIÓN",justification,"","CAPÍTULO EN VISTA PREVIA",revised].join("\n");
      const blob=new Blob([body],{type:"text/plain;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="revision-puntual-perfil.txt";a.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
     }}>Descargar propuesta de corrección puntual · TXT</button>
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
