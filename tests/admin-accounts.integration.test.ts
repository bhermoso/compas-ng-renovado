import {readFileSync} from 'node:fs';
import {afterAll,beforeAll,expect,test} from 'vitest';
import {initializeTestEnvironment} from '@firebase/rules-unit-testing';
import {deleteApp,initializeApp} from 'firebase/app';
import {connectAuthEmulator,createUserWithEmailAndPassword,initializeAuth,inMemoryPersistence,signInWithEmailAndPassword} from 'firebase/auth';
import {connectFirestoreEmulator,doc,getDoc,getFirestore,setDoc} from 'firebase/firestore';
import {createTerritorialAccount,createTerritorialSpace,listTerritorialSpaces,saveManagedAccess,listManagedAccounts} from '../src/infrastructure/relas/AdminAccounts';
import {readAccessProfile,saveRelasDraft,saveRelasReview,type RelasClient} from '../src/infrastructure/relas/RelasClient';
import type {PlanPreparationDraft,PlanPreparationReview} from '../src/domain/action-plan-catalog/PlanPreparationDraft';
const projectId='demo-compas-relas';
const clients:RelasClient[]=[];
let env:Awaited<ReturnType<typeof initializeTestEnvironment>>;
function client(name:string){
 const app=initializeApp({projectId,apiKey:'demo-api-key',authDomain:'localhost'},name);
 const auth=initializeAuth(app,{persistence:inMemoryPersistence});connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});
 const db=getFirestore(app);connectFirestoreEmulator(db,'127.0.0.1',8189);
 const c={auth,db};clients.push(c);return c;
}
beforeAll(async()=>{env=await initializeTestEnvironment({projectId,firestore:{host:'127.0.0.1',port:8189,rules:readFileSync('firebase/firestore.rules','utf8')}});await env.clearFirestore();});
afterAll(async()=>{await Promise.all(clients.map(c=>deleteApp(c.auth.app)));await env?.cleanup();});
test('actual account creation preserves owner session; scoped grants and revocation use server rules',async()=>{
 const owner=client('owner-integration');const email=`owner-${Date.now()}@example.test`;
 const root=await createUserWithEmailAndPassword(owner.auth,email,'TestOwner8!local');
 await env.withSecurityRulesDisabled(ctx=>setDoc(doc(ctx.firestore(),`compas_admins/${root.user.uid}`),{active:true}));
 await createTerritorialSpace(owner,{id:'granada-centro',name:'Granada · Centro',type:'distrito-municipal'});
 expect((await listTerritorialSpaces(owner))[0].type).toBe('distrito-municipal');
 await expect(createTerritorialSpace(owner,{id:'granada-centro',name:'No sobrescribir',type:'municipio'})).rejects.toThrow('Ya existe');
 const created=await createTerritorialAccount(owner,`plan-${Date.now()}@example.test`);
 expect(owner.auth.currentUser?.uid).toBe(root.user.uid);
 expect((await readAccessProfile(owner)).administrator).toBe(true);
 const account={uid:created.uid,email:created.email,scope:'granada-centro',role:'coordinator' as const,active:true};
 await saveManagedAccess(owner,account);
 expect((await listManagedAccounts(owner)).find(a=>a.uid===created.uid)?.scope).toBe('granada-centro');
 const partial=client('partial-integration');await signInWithEmailAndPassword(partial.auth,created.email,created.password);
 expect(await readAccessProfile(partial)).toEqual({administrator:false,scopes:[{id:'granada-centro',role:'coordinator'}]});
 await expect(getDoc(doc(partial.db,'relas_scopes/atarfe/drafts/aging'))).rejects.toMatchObject({code:'permission-denied'});
 await expect(createTerritorialAccount(partial,'unauthorised@example.test')).rejects.toThrow('administración general');
 await expect(saveManagedAccess(owner,{...account,uid:root.user.uid,active:false})).rejects.toThrow('Tu administración general');

 const draft:PlanPreparationDraft={municipalityId:'granada-centro',moduleId:'aging',version:'test-v1',updatedAt:new Date().toISOString(),decisions:{'ENV-OE1.1':{status:'modified',sourceText:'Texto vigente',text:'Propuesta territorial'}}};
 await expect(saveRelasDraft(owner,draft,null)).rejects.toThrow();
 const savedDraft=await saveRelasDraft(partial,draft,null);expect(savedDraft.version).toBe(1);
 const review:PlanPreparationReview={municipalityId:'granada-centro',moduleId:'aging',sourceVersion:'test-v1',sourceDraftVersion:1,updatedAt:new Date().toISOString(),decisions:{'ENV-OE1.1':{status:'accepted',sourceText:'Texto vigente',proposedText:'Propuesta territorial',reviewedAt:new Date().toISOString()}}};
 await expect(saveRelasReview(partial,review,null)).rejects.toThrow();
 const savedReview=await saveRelasReview(owner,review,null);expect(savedReview.version).toBe(1);

 await getDoc(doc(partial.db,'relas_scopes/granada-centro/drafts/aging'));
 await saveManagedAccess(owner,{...account,active:false});
 await expect(getDoc(doc(partial.db,'relas_scopes/granada-centro/drafts/aging'))).rejects.toMatchObject({code:'permission-denied'});
 expect((await readAccessProfile(owner)).administrator).toBe(true);
 const stored=await getDoc(doc(owner.db,'compas_access_accounts',created.uid));expect(stored.data()).not.toHaveProperty('password');
});
