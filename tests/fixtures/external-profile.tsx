import {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ExternalProfileDashboard} from '../../src/ui/components/ExternalProfileDashboard';
import {externalProfileFixture} from '../helpers/externalProfileFixture';
import type {ExternalProfileLibrary} from '../../src/domain/health-profile/ExternalHealthProfile';

function TestPage(){
 const profile=externalProfileFixture();
 const [library,setLibrary]=useState<ExternalProfileLibrary>(new URLSearchParams(location.search).has('example')?{profiles:[profile],attachments:[],activeId:profile.id}:{profiles:[],attachments:[]});
 const [failure,setFailure]=useState(false);
 return <><div style={{maxWidth:1320,margin:'0 auto 20px',fontSize:13,color:'#64748b',display:'flex',justifyContent:'space-between',gap:16}}><span>COMPÁS · Comprobación local · Datos ficticios · Sin conexión a Firebase</span><label><input type="checkbox" checked={failure} onChange={e=>setFailure(e.target.checked)}/> Simular fallo de guardado</label></div><ExternalProfileDashboard municipalityId="profile-test" municipalityName="Municipio de pruebas" library={library} authorName="Equipo de pruebas" onSave={async next=>{if(failure)throw new Error('Fallo de Firebase simulado: borrador conservado.');setLibrary(next);}}/></>;
}
const style=document.createElement('style');style.textContent='*{box-sizing:border-box}body{margin:0;padding:24px;background:#f8fafc;font-family:Arial,Helvetica,sans-serif}button,a,input,textarea,select{font-family:inherit}@media(max-width:680px){body{padding:12px}}';document.head.append(style);
createRoot(document.getElementById('root')!).render(<TestPage/>);
