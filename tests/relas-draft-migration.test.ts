import {beforeEach, describe, expect, it, vi} from 'vitest';
const database=vi.hoisted(()=>({rows:new Map<string,unknown>(),writes:[] as {ref:string;row:unknown}[]}));
vi.mock('firebase/app',()=>({initializeApp:vi.fn(),getApps:()=>[]}));
vi.mock('firebase/auth',()=>({initializeAuth:vi.fn(),inMemoryPersistence:{}}));
vi.mock('firebase/firestore',()=>({
 getFirestore:vi.fn(),collection:vi.fn(),getDocs:vi.fn(),
 doc:(_db:unknown,...segments:string[])=>segments.join('/'),
 serverTimestamp:()=> 'server-time',
 getDocFromServer:async(ref:string)=>({exists:()=>database.rows.has(ref),data:()=>database.rows.get(ref)}),
 runTransaction:async(_db:unknown,callback:(tx:unknown)=>Promise<unknown>)=>{
  const pending:{ref:string;row:unknown}[]=[];
  const result=await callback({
   get:async(ref:string)=>({exists:()=>database.rows.has(ref),data:()=>database.rows.get(ref)}),
   set:(ref:string,row:unknown)=>{pending.push({ref,row});},
  });
  for(const {ref,row} of pending)database.rows.set(ref,row);
  database.writes.push(...pending);return result;
 },
}));
import {readRelasDraft,saveRelasDraft,type RelasClient} from '../src/infrastructure/relas/RelasClient';
import {HEALTHY_AGING_MODULE as original} from '../src/domain/action-plan-catalog/ActionPlanCatalog';
import {ZAGRA_AGING_PROPOSAL as module,prepareMunicipalActionPlanDraft} from '../src/domain/action-plan-catalog/MunicipalActionPlanModule';
import type {PlanPreparationDraft} from '../src/domain/action-plan-catalog/PlanPreparationDraft';
const client={auth:{currentUser:{uid:'coordinator'}},db:{}} as unknown as RelasClient;
const ref=`relas_scopes/zagra/drafts/${module.id}`;
const old:PlanPreparationDraft={municipalityId:'zagra',moduleId:module.id,version:original.version,updatedAt:'2026-10-01',decisions:{'ENV-OE1.1':{status:'modified',sourceText:'Fuente',text:'Texto municipal'}}};
beforeEach(()=>{database.rows.clear();database.writes=[];database.rows.set(ref,{version:7,payload:structuredClone(old)});});
describe('Migración territorial con transacción y archivo original',()=>{
 it('preparar la lectura no escribe; guardar conserva el original y recargar no migra otra vez',async()=>{
  const row=(await readRelasDraft(client,'zagra',module.id))!;
  const migrated=prepareMunicipalActionPlanDraft('zagra',module,row.payload,'2026-10-30')!;
  expect(database.writes).toHaveLength(0);
  const saved=await saveRelasDraft(client,migrated,row.version);
  expect(saved.version).toBe(8);expect(saved.payload.migration?.draft).toEqual(old);
  expect(database.writes).toHaveLength(2);
  expect(database.writes[0].row).toEqual(database.writes[1].row);
  const restored=(await readRelasDraft(client,'zagra',module.id))!;
  expect(prepareMunicipalActionPlanDraft('zagra',module,restored.payload)).toBe(restored.payload);
  expect(database.rows.get(ref)).toEqual(database.writes[0].row);
 });
 it('un conflicto concurrente no guarda ni la migración ni un historial parcial',async()=>{
  const migrated=prepareMunicipalActionPlanDraft('zagra',module,structuredClone(old))!;
  const concurrent={version:8,payload:{...old,updatedAt:'2026-10-29'}};
  database.rows.set(ref,concurrent);
  await expect(saveRelasDraft(client,migrated,7)).rejects.toThrow(/No se ha guardado/);
  expect(database.writes).toHaveLength(0);expect(database.rows.get(ref)).toEqual(concurrent);
 });
 it('rechaza referencias desconocidas y cambios de versión sin el original archivado',async()=>{
  await expect(saveRelasDraft(client,{...old,version:'unknown'},7)).rejects.toThrow(/compatibilidad/);
  await expect(saveRelasDraft(client,{...old,version:module.version},7)).rejects.toThrow(/No se ha guardado/);
  expect(database.writes).toHaveLength(0);
 });
 it('no escribe sin sesión ni acepta un archivo que omita decisiones anteriores',async()=>{
  const migrated=prepareMunicipalActionPlanDraft('zagra',module,structuredClone(old))!;
  await expect(saveRelasDraft({auth:{currentUser:null},db:{}} as RelasClient,migrated,7)).rejects.toThrow(/sesión/);
  migrated.migration!.draft.decisions={};
  await expect(saveRelasDraft(client,migrated,7)).rejects.toThrow(/No se ha guardado/);
  expect(database.writes).toHaveLength(0);
 });
 it('compara mapas de Firebase sin depender del orden de sus campos',async()=>{
  const migrated=prepareMunicipalActionPlanDraft('zagra',module,structuredClone(old))!;
  database.rows.set(ref,{version:7,payload:Object.fromEntries(Object.entries(old).reverse())});
  await expect(saveRelasDraft(client,migrated,7)).resolves.toMatchObject({version:8});
 });
});
