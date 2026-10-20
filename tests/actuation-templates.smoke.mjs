import { createServer } from "vite";
import { chromium } from "playwright";
const server = await createServer({
  plugins: [{
    name: "app-direct",
    configureServer(s) {
      s.middlewares.use("/app-direct", async (req, res) => {
        res.setHeader("Content-Type", "text/html");
        res.end(await s.transformIndexHtml("/app-direct", `<html><body><div id="root"></div><script type="module">import React from 'react';import {createRoot} from 'react-dom/client';import App from '/src/App.tsx';import '/src/index.css';createRoot(document.getElementById('root')).render(React.createElement(App));</script></body></html>`));
      });
    },
  }],
  server: { host: "127.0.0.1", port: 0 },
});
await server.listen();
const base = `http://127.0.0.1:${server.httpServer.address().port}`;
const b = await chromium.launch({ executablePath: process.env.COMPAS_TEST_CHROMIUM, headless: true, args: ["--no-sandbox"] });
const page = await b.newPage({ viewport: { width: 1400, height: 900 } });
const step = async (n, f) => { try { await f(); } catch (e) { console.log("FALLO en", n, String(e.message).split("\n")[0]); await page.screenshot({ path: "/tmp/templates-fail.png" }); await b.close(); await server.close(); process.exit(1); } };
await page.goto(`${base}/app-direct`, { waitUntil: "domcontentloaded" });
await step("nav", async () => { await page.locator(".app-nav__tab", { hasText: "Agenda" }).click({ timeout: 20000 }); });
await step("abrir repositorio", async () => { await page.getByRole("button", { name: "Desde actuación-tipo" }).click(); await page.getByText("157 actuaciones-tipo").waitFor({ timeout: 5000 }); });
await step("buscar GRUSE", async () => { await page.getByPlaceholder(/Buscar: GRUSE/).fill("gruse"); await page.getByText(/^\d+ actuaciones-tipo/).waitFor({ timeout: 3000 }); });
await step("ficha completa heredada", async () => {
  await page.getByPlaceholder(/Buscar: GRUSE/).fill("Consejo dietético estructurado");
  await page.getByText("Base citada por la fuente:").first().waitFor({ timeout: 3000 });
  await page.getByText(/Indicador que le atribuía el histórico/).first().waitFor({ timeout: 3000 });
  await page.getByPlaceholder(/Buscar: GRUSE/).fill("gruse");
  await page.getByText(/^\d+ actuaciones-tipo/).waitFor({ timeout: 3000 });
});
await step("usar y adaptar", async () => {
  await page.getByRole("button", { name: "Usar y adaptar" }).click();
  await page.getByRole("button", { name: "Guardar ficha" }).waitFor({ timeout: 5000 });
  await page.getByText(/Adaptada de la actuación-tipo «Grupos Socioeducativos/).waitFor({ timeout: 3000 });
  await page.getByLabel("Nombre", { exact: true }).fill("GRUSE de mujeres de Zagra");
  await page.getByRole("button", { name: "Guardar ficha" }).click();
  await page.getByText("Sin cambios pendientes.").waitFor({ timeout: 3000 });
});
await step("guardar como tipo", async () => {
  await page.getByRole("button", { name: "Guardar como actuación-tipo" }).click();
  await page.getByPlaceholder("Nombre de la actuación-tipo").fill("GRUSE mujeres (propia)");
  await page.getByRole("button", { name: "Guardar actuación-tipo" }).click();
  await page.getByText(/guardada como actuación-tipo propia/).waitFor({ timeout: 3000 });
});
await step("aparece en propias", async () => {
  await page.getByRole("button", { name: "Cerrar", exact: true }).click();
  await page.getByRole("button", { name: "Desde actuación-tipo" }).click();
  await page.getByLabel("Filtrar por origen").selectOption("propia");
  await page.getByText("1 actuaciones-tipo").waitFor({ timeout: 3000 });
  await page.getByText("GRUSE mujeres (propia)").first().waitFor({ timeout: 3000 });
});
await step("persiste", async () => {
  await page.waitForTimeout(1500);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator(".app-nav__tab", { hasText: "Agenda" }).click({ timeout: 20000 });
  await page.getByRole("button", { name: "Desde actuación-tipo" }).click();
  await page.getByLabel("Filtrar por origen").selectOption("propia");
  await page.getByText("GRUSE mujeres (propia)").first().waitFor({ timeout: 5000 });
});
console.log("OK: repositorio, adaptación, guardado como actuación-tipo y persistencia");
await b.close(); await server.close();
