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
const b = await chromium.launch({ executablePath: process.env.CH ?? process.env.COMPAS_TEST_CHROMIUM, headless: true, args: ["--no-sandbox"] });
const page = await b.newPage({ viewport: { width: 1400, height: 900 } });
const errs = []; page.on("pageerror", e => errs.push(e.message));
const step = async (n, f) => { try { await f(); } catch (e) { console.log("FALLO en", n, String(e.message).split("\n")[0]); await page.screenshot({ path: "/tmp/agenda-fail.png" }); await b.close(); await server.close(); process.exit(1); } };
await page.goto(`${base}/app-direct`, { waitUntil: "domcontentloaded" });
await step("nav", async () => { await page.locator(".app-nav__tab", { hasText: "Agenda" }).click({ timeout: 20000 }); });
await step("vista", async () => { await page.getByRole("heading", { name: /Agenda de actuaciones/ }).waitFor({ timeout: 10000 }); });
await step("alta", async () => {
  await page.getByRole("button", { name: "Nueva actuación" }).click();
  await page.getByPlaceholder("Nombre de la actuación").fill("Taller de marcha");
  await page.getByRole("button", { name: "Crear", exact: true }).click();
  await page.getByRole("button", { name: "Guardar ficha" }).waitFor({ timeout: 5000 });
  await page.getByRole("button", { name: "Cerrar", exact: true }).click();
});
console.log("tarjetas:", await page.locator("[data-actuation-id]").count());
await step("arrastre", async () => {
  await page.locator("[data-actuation-id]").first().dragTo(page.locator(".agenda-column--comunitario .agenda-column__body"), { sourcePosition: { x: 8, y: 6 } });
  await page.waitForTimeout(300);
});
console.log("comunitario:", await page.locator(".agenda-column--comunitario [data-actuation-id]").count(), "| sin asignar:", await page.locator(".agenda-column--unassigned [data-actuation-id]").count());
await step("selector", async () => { await page.getByLabel("Entorno de Taller de marcha").selectOption("laboral"); });
console.log("laboral:", await page.locator(".agenda-column--laboral [data-actuation-id]").count());
await step("evaluación sin agenda", async () => {
  await page.locator(".app-nav__tab", { hasText: "Evaluación" }).click();
  await page.getByRole("heading", { name: /Evaluación del Plan Local de Salud/ }).waitFor({ timeout: 5000 });
  if (await page.getByText("Taller de marcha").count()) throw new Error("la vista Evaluación no debe mostrar la agenda");
  await page.locator(".app-nav__tab", { hasText: "Agenda" }).click();
  await page.locator("[data-actuation-id]").first().getByRole("button").first().click();
  await page.getByRole("button", { name: "Guardar ficha" }).waitFor({ timeout: 5000 });
});
// Aviso de cambios sin guardar, guardado y persistencia tras recargar
await step("dirty", async () => {
  await page.getByLabel("Nombre", { exact: true }).fill("Taller de marcha nórdica");
  await page.getByText("Hay cambios sin guardar.").waitFor({ timeout: 3000 });
  await page.getByRole("button", { name: "Cerrar sin guardar" }).click();
  await page.getByRole("button", { name: "Descartar cambios y cerrar" }).waitFor({ timeout: 3000 });
  await page.getByRole("button", { name: "Seguir editando" }).click();
  await page.getByRole("button", { name: "Guardar ficha" }).click();
  await page.getByText("Sin cambios pendientes.").waitFor({ timeout: 3000 });
});
await step("recarga", async () => {
  await page.waitForTimeout(1500);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator(".app-nav__tab", { hasText: "Agenda" }).click({ timeout: 20000 });
  await page.getByText("Taller de marcha nórdica").first().waitFor({ timeout: 8000 });
});
console.log("persiste tras recargar, en laboral:", await page.locator(".agenda-column--laboral [data-actuation-id]").count());
// Filtro y deshacer
await step("filtro", async () => {
  await page.getByPlaceholder(/Buscar por nombre/).fill("zzz-no-existe");
  await page.getByText(/0 de 1 actuaciones/).waitFor({ timeout: 3000 });
  await page.getByRole("button", { name: "Quitar filtros" }).click();
  await page.getByPlaceholder(/Buscar por nombre/).fill("NORDICA");
  await page.getByText(/1 de 1 actuaciones/).waitFor({ timeout: 3000 });
  await page.getByRole("button", { name: "Quitar filtros" }).click();
});
await step("eliminar-deshacer", async () => {
  await page.getByRole("button", { name: "Eliminar", exact: true }).click();
  await page.getByRole("button", { name: "Eliminar de verdad" }).click();
  await page.getByRole("button", { name: "Deshacer" }).click();
  await page.getByText("Taller de marcha nórdica").first().waitFor({ timeout: 3000 });
});
await step("importar-historico", async () => {
  const copia = { estrategias: { "es-andalucia-epvsa": { municipios: { Prueba: { agendas: {
    1: { id: 1, nombre: "Actuación del histórico A", entorno: "educativo", estado: "en ejecucion", trimestre: "T3", orden: 1 },
    2: { id: 2, nombre: "Actuación del histórico B", entorno: "sanitario", estado: "finalizada", orden: 2 } } } } } } };
  await page.locator("input[type=file][aria-label^='Copia .json']").setInputFiles({ name: "copia.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(copia)) });
  await page.getByRole("button", { name: "Importar", exact: true }).click({ timeout: 5000 });
  await page.getByText(/2 actuaciones importadas del histórico/).waitFor({ timeout: 3000 });
  if ((await page.locator(".agenda-column--educativo [data-actuation-id]").count()) !== 1) throw new Error("A no está en educativo");
  if ((await page.locator(".agenda-column--sanitario [data-actuation-id]").count()) !== 1) throw new Error("B no está en sanitario");
  console.log("importadas: OK");
});
await page.screenshot({ path: "/tmp/agenda-e2e.png", fullPage: true });
console.log("OK; errores de página:", JSON.stringify(errs));
await b.close(); await server.close();
