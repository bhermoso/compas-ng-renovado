import { readFileSync } from "node:fs";
import { before, after, beforeEach, test } from "node:test";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getBytes, deleteObject } from "firebase/storage";
let env;
const sha = "a".repeat(64);
const target = "relas_scopes/zagra/originals/" + sha;
const store = uid => env.authenticatedContext(uid).storage("gs://demo-compas-relas.firebasestorage.app");
const save = (uid, hash=sha) => uploadBytes(ref(store(uid),target),new Uint8Array([1,2,3]),{customMetadata:{sha256:hash,municipalityId:"zagra"}});
before(async()=>{
 env=await initializeTestEnvironment({projectId:"demo-compas-relas",firestore:{rules:readFileSync("firebase/firestore.rules","utf8")},storage:{rules:readFileSync("firebase/storage.rules.draft","utf8")}});
});
after(async()=>{await env?.cleanup();});
beforeEach(async()=>{
 await env.clearFirestore(); await env.clearStorage();
 await env.withSecurityRulesDisabled(async ctx=>{
  for(const [uid,role] of [["coord","coordinator"],["reader","reader"],["legacy","coordinator"],["suspended","coordinator"]]){
   await setDoc(doc(ctx.firestore(),"relas_memberships/"+uid+"/scopes/zagra"),{active:true,role});
  }
  await setDoc(doc(ctx.firestore(),"compas_access_accounts/suspended"),{active:false,scope:"zagra"});
  await setDoc(doc(ctx.firestore(),"compas_admins/owner"),{active:true});
 });
});
test("coordinador puede crear y lector puede descargar; original inmutable",async()=>{
 await assertSucceeds(save("coord"));
 await assertSucceeds(getBytes(ref(store("reader"),target)));
 await assertFails(save("coord"));
 await assertFails(deleteObject(ref(store("coord"),target)));
});
test("suspensión y lector sin escritura bloqueados",async()=>{
 await assertFails(save("suspended"));
 await assertFails(save("reader"));
});
test("cuenta heredada con membresía activa puede crear",async()=>{
 await assertSucceeds(save("legacy"));
});
test("metadatos manipulados rechazados",async()=>{
 await assertFails(save("coord","b".repeat(64)));
});
test("administrador general sin membresía: brecha conocida, bloqueo de despliegue",async()=>{
 await assertFails(save("owner"));
});
