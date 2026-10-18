import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const url = "http://127.0.0.1:4174/COMPAS_NG/";
const server = spawn(process.execPath, [
  "node_modules/vite/bin/vite.js", "preview", "--host", "127.0.0.1", "--port", "4174",
], { stdio: "inherit" });
let browser;
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try { ready = (await fetch(url)).ok; } catch {}
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  assert.ok(ready, "El servidor de la compilación debe arrancar");
  browser = await chromium.launch();
  const page = await browser.newPage();
  const seed = JSON.parse(readFileSync("public/seeds/compas-ng-workspace-fuente-vaqueros.json", "utf8"));
  const placeholder = structuredClone(seed);
  placeholder.repository.documents = [];
  placeholder.evidenceStore.atoms = [];
  placeholder.updatedAt = "2026-10-08T10:00:00.000Z";
  delete placeholder.appliedSeedMigrations;
  await page.addInitScript(value => {
    const key = "compas-ng:workspace:fuente-vaqueros";
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(value));
    localStorage.setItem("compas-ng:active-municipality", "fuente-vaqueros");
  }, placeholder);
  await page.route("**/seeds/*.json", route => route.abort("blockedbyclient"));
  for (let visit = 0; visit < 2; visit++) {
    if (visit === 0) await page.goto(url); else await page.reload();
    await page.getByRole("button", { name: "2 Diagnóstico territorial", exact: true }).click();
    await page.getByRole("heading", { name: "Fuente Vaqueros", exact: true }).waitFor();
    await page.getByRole("heading", { name: "Otras fuentes documentales1" }).waitFor({ timeout: 15000 });
    await page.waitForFunction(() => {
      const raw = localStorage.getItem("compas-ng:workspace:fuente-vaqueros");
      if (!raw) return false;
      const ws = JSON.parse(raw);
      return ws.repository.documents.length === 1 && ws.evidenceStore.atoms.length === 29;
    });
    if (visit === 0) {
      // Reproduce el navegador afectado: localStorage ya tiene el seed, pero
      // IndexedDB conserva un placeholder vacío con una fecha posterior.
      placeholder.updatedAt = "2026-10-09T10:00:00.000Z";
      await page.evaluate(async value => {
        const db = await new Promise((resolve, reject) => {
          const request = indexedDB.open("compas-ng-workspaces", 1);
          request.onupgradeneeded = () => {
            if (!request.result.objectStoreNames.contains("workspaces")) {
              request.result.createObjectStore("workspaces");
            }
          };
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        await new Promise((resolve, reject) => {
          const tx = db.transaction("workspaces", "readwrite");
          tx.objectStore("workspaces").put(JSON.stringify(value), "fuente-vaqueros");
          tx.oncomplete = resolve;
          tx.onerror = () => reject(tx.error);
        });
        db.close();
      }, placeholder);
    }
  }
  console.log("Fuente Vaqueros: 1 documento y 29 evidencias visibles y persistidas; recarga correcta con JSON bloqueado.");
} finally {
  await browser?.close();
  server.kill();
}
