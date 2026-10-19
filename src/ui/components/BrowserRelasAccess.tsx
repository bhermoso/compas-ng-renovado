import {lazy,Suspense,useEffect,useMemo,useState} from 'react';
import {readAccessProfile,type AccessProfile} from '../../infrastructure/relas/RelasClient';
import {createBrowserRelasClient} from '../../infrastructure/relas/BrowserRelasClient';
import {logoutRelas} from '../../infrastructure/relas/BrowserRelasLogin';
import AdministrationPanel from './AdministrationPanel';
import TerritorialWorkspace from './TerritorialWorkspace';
import RelasLoginForm from './RelasLoginForm';
import './BackupPanel.css';
import './RelasAccess.css';
const FullApp=lazy(()=>import('../../App'));

export default function BrowserRelasAccess(){
 const view=new URLSearchParams(window.location.search).get('vista');
 const adminEntry=view==='administracion';const appEntry=!adminEntry;
 const client=useMemo(()=>createBrowserRelasClient(),[]);
 const [profile,setProfile]=useState<AccessProfile>();const [scope,setScope]=useState<string>();const [busy,setBusy]=useState(true);const [fullApp,setFullApp]=useState(appEntry);
 useEffect(()=>client.auth.onAuthStateChanged(user=>{
  if(!user){setProfile(undefined);setScope(undefined);setFullApp(false);setBusy(false);return;}
  setBusy(true);readAccessProfile(client).then(next=>{setProfile(next);if(next.administrator&&appEntry)setFullApp(true);}).finally(()=>setBusy(false));
 }),[client,appEntry]);
 function openFullApp(){window.history.replaceState(null,'',`${import.meta.env.BASE_URL}?vista=app`);setFullApp(true);}
 function openAdministration(){window.history.replaceState(null,'',`${import.meta.env.BASE_URL}?vista=administracion`);setFullApp(false);}
 if(profile?.administrator&&fullApp)return <><nav className="admin-full-nav"><strong>Administración general · COMPAS completo</strong><button onClick={openAdministration}>Volver al panel de administración</button></nav><Suspense fallback={<p>Cargando COMPAS…</p>}><FullApp/></Suspense></>;
 if(busy)return <main className="backup-recovery relas-access"><section className="backup-panel"><p>Recuperando sesión…</p></section></main>;
 return <main className="backup-recovery relas-access"><section className="backup-panel">
  <h1>COMPAS · {profile?.administrator?'Panel de administración':adminEntry?'Administración general':'Acceso'}</h1>
  {!profile?<RelasLoginForm client={client} adminEntry={adminEntry} appEntry={appEntry} onProfile={next=>{setProfile(next);if(next.administrator&&appEntry)setFullApp(true);}}/>:scope?<TerritorialWorkspace key={scope} client={client} scope={scope} role={profile.administrator?'administrator':profile.scopes.find(s=>s.id===scope)?.role??'reader'} onBack={()=>setScope(undefined)}/>:<>
   <p>Sesión: {client.auth.currentUser?.email}</p>
   {profile.administrator?<AdministrationPanel client={client} onOpenApp={openFullApp} onOpenScope={setScope}/>:<section><h2>Mis ámbitos</h2>{profile.scopes.map(s=><p key={s.id}><button onClick={()=>setScope(s.id)}>Abrir {s.id}</button> · {s.role==='reader'?'Consulta':'Coordinación'}</p>)}</section>}
   <button onClick={()=>void logoutRelas(client)}>Cerrar sesión</button>
  </>}
 </section></main>;
}
