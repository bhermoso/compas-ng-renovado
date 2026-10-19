import {useEffect,useMemo,useState} from 'react';
import {allMunicipalities,availableMunicipalities,buildSpace,districtsOf,groupSpaces,municipalityDisplayName,spaceAlreadyExists,SPACE_TYPE_LABEL,type SpaceInput} from '../../application/territory/territorialSpaceForm';
import type {RelasClient} from '../../infrastructure/relas/RelasClient';
import {accessError,createTerritorialAccount,createTerritorialSpace,listTerritorialSpaces,listManagedAccounts,saveManagedAccess,type ManagedAccount,type NewAccount,type TerritorialSpace} from '../../infrastructure/relas/AdminAccounts';
const project='https://console.firebase.google.com/project/compas-98dd7';
export default function AdministrationPanel({client,onOpenApp,onOpenScope}:{client:RelasClient;onOpenApp:()=>void;onOpenScope:(scope:string)=>void}) {
 const [selectedScope,setSelectedScope]=useState('granada-zaidin');
 const [spaces,setSpaces]=useState<TerritorialSpace[]>([]);
 const [spaceType,setSpaceType]=useState<TerritorialSpace['type']>('municipio');const [ineCode,setIneCode]=useState('');const [districtName,setDistrictName]=useState('');const [mancName,setMancName]=useState('');
 const pending=useMemo(()=>availableMunicipalities(spaces),[spaces]);const everyMunicipality=useMemo(()=>allMunicipalities(),[]);
 const input:SpaceInput|undefined=spaceType==='municipio'?(ineCode?{kind:'municipio',ineCode}:undefined):spaceType==='distrito-municipal'?(ineCode?{kind:'distrito-municipal',ineCode,districtName}:undefined):{kind:'mancomunidad',name:mancName};
 const candidate=input?buildSpace(input):undefined;const duplicate=!!candidate&&spaceAlreadyExists(spaces,candidate);const knownDistricts=spaceType==='distrito-municipal'&&ineCode?districtsOf(spaces,ineCode):[];
 const [email,setEmail]=useState('');const [role,setRole]=useState<'coordinator'|'reader'>('coordinator');
 const [accounts,setAccounts]=useState<ManagedAccount[]>([]);const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
 const [created,setCreated]=useState<(NewAccount&{scope:string;role:'coordinator'|'reader';granted:boolean})>();
 const accessUrl=new URL('?vista=relas-zaidin',window.location.href).href;
 useEffect(()=>{let live=true;void Promise.all([listManagedAccounts(client),listTerritorialSpaces(client)]).then(([rows,territories])=>{if(live){setAccounts(rows);setSpaces(territories);if(territories.length&&!territories.some(s=>s.id==='granada-zaidin'))setSelectedScope(territories[0].id);}}).catch(e=>{if(live)setMessage(accessError(e));});return()=>{live=false;};},[client]);
 async function grant(account:NewAccount&{scope:string;role:'coordinator'|'reader'}) {
  const managed={uid:account.uid,email:account.email,scope:account.scope,role:account.role,active:true};
  await saveManagedAccess(client,managed);
  setCreated({...account,granted:true});setAccounts(rows=>[...rows.filter(a=>a.uid!==managed.uid),managed]);setMessage('Acceso territorial concedido. Entrega el correo y la contraseña generada a la persona responsable.');
 }
 async function changeAccess(account:ManagedAccount) {
  setBusy(true);setMessage('');
  try {const next={...account,active:!account.active};await saveManagedAccess(client,next);setAccounts(rows=>rows.map(a=>a.uid===next.uid?next:a));setMessage(next.active?'Acceso reactivado.':'Acceso retirado. Los documentos y el historial se conservan.');}
  catch(e){setMessage(accessError(e));}finally{setBusy(false);}
 }
 return <>
  <div className="admin-banner"><strong>Administración general</strong><p>Tú conservas el control de todos los planes. Los accesos de cada responsable no pueden modificar tu cuenta ni tus permisos.</p></div>
  <section className="admin-section"><h2>Espacios territoriales</h2><p>Crea un espacio independiente para cada municipio, mancomunidad o distrito municipal. Tú puedes acceder a todos. Cada responsable recibe únicamente el ámbito que le asignes.</p>
   {groupSpaces(spaces).map(g=><div key={g.type}><h3>{g.label} ({g.spaces.length})</h3><ul>{g.spaces.map(x=><li key={x.id}><strong>{x.name}</strong> · <code>{x.id}</code></li>)}</ul></div>)}
   <form onSubmit={async e=>{e.preventDefault();if(!candidate||duplicate)return;setBusy(true);setMessage('Creando espacio…');try{await createTerritorialSpace(client,candidate);setSpaces(rows=>[...rows,candidate]);setSelectedScope(candidate.id);setIneCode('');setDistrictName('');setMancName('');setMessage('Espacio territorial creado. Ya aparece en todos los desplegables y puedes asignar su responsable.');}catch(error){setMessage(accessError(error));}finally{setBusy(false);}}}>
    <label>Tipo de ámbito<select disabled={busy} value={spaceType} onChange={e=>{setSpaceType(e.target.value as typeof spaceType);setIneCode('');setDistrictName('');setMancName('');}}>{(Object.keys(SPACE_TYPE_LABEL) as TerritorialSpace['type'][]).map(t=><option key={t} value={t}>{SPACE_TYPE_LABEL[t]}</option>)}</select></label>
    {spaceType==='municipio'&&<label>Municipio de Granada ({pending.length} sin espacio)<select disabled={busy} value={ineCode} onChange={e=>setIneCode(e.target.value)}><option value="">Elige un municipio</option>{pending.map(m=><option key={m.ineCode} value={m.ineCode}>{municipalityDisplayName(m.ineName)}</option>)}</select></label>}
    {spaceType==='distrito-municipal'&&<><label>Municipio al que pertenece<select disabled={busy} value={ineCode} onChange={e=>setIneCode(e.target.value)}><option value="">Elige un municipio</option>{everyMunicipality.map(m=><option key={m.ineCode} value={m.ineCode}>{municipalityDisplayName(m.ineName)}</option>)}</select></label>
     {knownDistricts.length>0&&<p>Distritos ya creados: {knownDistricts.map(d=>d.name).join(', ')}.</p>}
     <label>Nombre del distrito<input disabled={busy||!ineCode} maxLength={120} value={districtName} onChange={e=>setDistrictName(e.target.value)}/></label></>}
    {spaceType==='mancomunidad'&&<label>Nombre de la mancomunidad<input disabled={busy} maxLength={200} value={mancName} onChange={e=>setMancName(e.target.value)}/></label>}
    {candidate&&<p>Se creará: <strong>{candidate.name}</strong> · identificador <code>{candidate.id}</code>{duplicate&&<> · <strong>ya existe</strong></>}</p>}
    <button disabled={busy||!candidate||duplicate}>Crear espacio territorial</button>
   </form>
  </section>
  <section className="admin-section"><h2>Crear acceso para un plan de salud</h2><p>Indica el correo de la persona responsable y su plan. COMPAS creará una contraseña aleatoria y la mostrará una sola vez. Para entrar, la persona usará como usuario ese correo y como contraseña la contraseña generada que le entregues. La cuenta de coordinación podrá consultar y editar su borrador compartido; sus cambios quedarán como propuestas pendientes de revisión administrativa.</p>
   <form onSubmit={async e=>{e.preventDefault();setBusy(true);setMessage('Creando cuenta…');try{const account={...await createTerritorialAccount(client,email),scope:selectedScope,role};setCreated({...account,granted:false});await grant(account);}catch(error){setMessage(accessError(error));}finally{setBusy(false);}}}>
    <label>Plan de salud<select disabled={busy||!!created} value={selectedScope} onChange={e=>setSelectedScope(e.target.value)}>{spaces.length===0&&<option value="">Crea primero el espacio territorial</option>}{groupSpaces(spaces).map(g=><optgroup key={g.type} label={g.label}>{g.spaces.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</optgroup>)}</select></label>
    <label>Usuario: correo de la persona responsable<input disabled={busy||!!created} required type="email" autoComplete="off" value={email} onChange={e=>setEmail(e.target.value)}/></label>
    <label>Permiso<select disabled={busy||!!created} value={role} onChange={e=>setRole(e.target.value as typeof role)}><option value="coordinator">Coordinación: consultar y editar borradores</option><option value="reader">Consulta: solo lectura</option></select></label>
    <button disabled={busy||!!created||!email||!spaces.some(s=>s.id===selectedScope)}>Crear usuario, contraseña y acceso</button>
   </form>
   {created&&<section className="admin-credentials" aria-label="Credenciales de la nueva cuenta"><h3>{created.granted?'Acceso preparado':'Cuenta creada: permiso pendiente'}</h3>
    <p>{created.granted?'Guarda y entrega estas credenciales ahora: la contraseña generada solo se muestra durante esta sesión.':'No entregues todavía estas credenciales. La cuenta existe, pero falta confirmar la asignación territorial.'}</p>
    <p>Usuario (correo): <strong>{created.email}</strong></p><label>Contraseña generada<input readOnly value={created.password}/></label>
    <p>Entrada del equipo: <a href={accessUrl}>{accessUrl}</a></p><p>Plan: <strong>{created.scope}</strong> · {created.role==='coordinator'?'Coordinación':'Consulta'}</p>
    {!created.granted?<button disabled={busy} onClick={async()=>{setBusy(true);try{await grant(created);}catch(e){setMessage(accessError(e));}finally{setBusy(false);}}}>Reintentar asignación</button>:<button onClick={()=>{setCreated(undefined);setEmail('');}}>He guardado las credenciales</button>}
   </section>}
   {message&&<p role="status">{message}</p>}
  </section>
  <section className="admin-section"><h2>Accesos gestionados desde este panel</h2><p>Retirar un acceso bloquea sus datos compartidos; no borra el trabajo realizado ni afecta a tu administración general.</p>
   {accounts.length===0?<p>No hay altas registradas desde el panel. Las asignaciones anteriores siguen en Firebase.</p>:<ul className="admin-accounts">{accounts.map(a=><li key={a.uid}><strong>{a.email}</strong><p>{a.scope} · {a.role==='coordinator'?'Coordinación':'Consulta'} · {a.active?'Activo':'Retirado'}</p><button disabled={busy} onClick={()=>void changeAccess(a)}>{a.active?'Retirar acceso':'Reactivar acceso'}</button></li>)}</ul>}
  </section>
  <section className="admin-section"><h2>Trabajo de COMPAS</h2><button onClick={onOpenApp}>Abrir COMPAS completo</button><div className="admin-scope"><button disabled={!spaces.some(s=>s.id===selectedScope)} onClick={()=>onOpenScope(selectedScope)}>Abrir plan seleccionado</button></div></section>
  <details className="admin-section"><summary>Configuración y recuperación de cuentas</summary><p>Las cuentas anteriores y los cambios de contraseña se pueden gestionar desde la consola propietaria.</p><p><a href={`${project}/authentication/users`} target="_blank" rel="noopener noreferrer">Gestionar cuentas en Firebase</a></p><p><a href="https://github.com/bhermoso/COMPAS_NG/blob/master/firebase/firestore.rules" target="_blank" rel="noopener noreferrer">Reglas de gestión de accesos que deben estar publicadas en Firestore</a></p></details>
 </>;
}
