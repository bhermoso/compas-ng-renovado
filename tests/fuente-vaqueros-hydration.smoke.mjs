import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createServer } from "vite";
import { chromium } from "playwright";

// La entrada ordinaria exige sesión de Firebase; esta prueba monta la aplicación directamente
// (sin acceso) para comprobar solo la hidratación del expediente en el navegador.
const server = await createServer({
  plugins: [{
    name: "app-direct",
    configureServer(s) {
      s.middlewares.use("/app-direct", async (_req, res) => {
        res.setHeader("Content-Type", "text/html");
        res.end(await s.transformIndexHtml("/app-direct", `<html><body><div id="root"></div><script type="module">import React from 'react';import {createRoot} from 'react-dom/client';import App from '/src/App.tsx';import '/src/index.css';createRoot(document.getElementById('root')).render(React.createElement(App));</script></body></html>`));
      });
    },
  }],
  server: { host: "127.0.0.1", port: 0 },
});
await server.listen();
const url = `http://127.0.0.1:${server.httpServer.address().port}/app-direct`;
let browser;
try {
  browser = await chromium.launch(process.env.COMPAS_TEST_CHROMIUM
    ? { executablePath: process.env.COMPAS_TEST_CHROMIUM, args: ["--no-sandbox"] } : {});
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
    await page.locator(".app-nav__tab", { hasText: "Diagnóstico territorial" }).click();
    await page.getByRole("heading", { name: "Fuente Vaqueros", exact: true }).waitFor();
    await page.getByText("PLIZD+ 2024-2028").first().waitFor({ timeout: 15000 });
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
  await server.close();
}
