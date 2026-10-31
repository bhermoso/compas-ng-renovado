import { readFileSync } from "node:fs";
import { before, after, beforeEach, test } from "node:test";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

const projectId = "demo-compas-relas";
let env;
const h = "a".repeat(64);
const path = scope => `relas_scopes/${scope}/originals/${h}`;
const metadata = (uid,scope="zagra") => ({
  schema:"compas-original/v1", municipalityId:scope,sha256:h,
  storagePath:path(scope),byteLength:123,fileName:"informe.pdf",
  contentType:"application/pdf",createdBy:uid,createdAt:serverTimestamp()
});
const db = uid => env.authenticatedContext(uid).firestore();
before(async()=>{env=await initializeTestEnvironment({projectId,firestore:{rules:readFileSync("firebase/firestore.rules","utf8")}});});
after(async()=>{await env?.cleanup();});
beforeEach(async()=>{
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async ctx=>{
    for(const [uid,scope,role] of [["coord","zagra","coordinator"],["reader","zagra","reader"],["other","loja","coordinator"]]){
      await setDoc(doc(ctx.firestore(),`relas_memberships/${uid}/scopes/${scope}`),{active:true,role});
    }
  });
});
test("coordinator creates immutable index; reader accesses it",async()=>{
  await assertSucceeds(setDoc(doc(db("coord"),path("zagra")),metadata("coord")));
  await assertSucceeds(getDoc(doc(db("reader"),path("zagra"))));
  await assertFails(setDoc(doc(db("coord"),path("zagra")),{...metadata("coord"),fileName:"alterado.pdf"}));
  await assertFails(deleteDoc(doc(db("coord"),path("zagra"))));
});
test("cross territory, anonymous, reader writes and forged content denied",async()=>{
  await assertFails(setDoc(doc(db("reader"),path("zagra")),metadata("reader")));
  await assertFails(setDoc(doc(db("other"),path("zagra")),metadata("other")));
  await assertFails(getDoc(doc(db("other"),path("zagra"))));
  await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),path("zagra"))));
  await assertFails(setDoc(doc(db("coord"),path("zagra")),{...metadata("coord"),municipalityId:"loja"}));
  await assertFails(setDoc(doc(db("coord"),path("zagra")),{...metadata("coord"),sha256:"b".repeat(64)}));
  await assertFails(setDoc(doc(db("coord"),path("zagra")),{...metadata("coord"),createdBy:"other"}));
  await assertFails(setDoc(doc(db("coord"),path("zagra")),{...metadata("coord"),createdAt:new Date(0)}));
});
test("revocation blocks same credential and disabled managed account",async()=>{
  await assertSucceeds(setDoc(doc(db("coord"),path("zagra")),metadata("coord")));
  await env.withSecurityRulesDisabled(ctx=>setDoc(doc(ctx.firestore(),"relas_memberships/coord/scopes/zagra"),{active:false,role:"coordinator"}));
  await assertFails(getDoc(doc(db("coord"),path("zagra"))));
  await env.withSecurityRulesDisabled(async ctx=>{
    await setDoc(doc(ctx.firestore(),"relas_memberships/coord/scopes/zagra"),{active:true,role:"coordinator"});
    await setDoc(doc(ctx.firestore(),"compas_access_accounts/coord"),{active:false,role:"coordinator",scope:"zagra"});
  });
  await assertFails(getDoc(doc(db("coord"),path("zagra"))));
});
