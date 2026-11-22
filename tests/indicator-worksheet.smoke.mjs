// Isolated browser context: all entered content is test-only and never touches user data.
// Run: node tests/indicator-worksheet.smoke.mjs
// Optional: COMPAS_TEST_CHROMIUM=/path/to/chromium COMPAS_TEST_OUTPUT=/tmp/output
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { createServer } from "vite";
import { chromium } from "playwright";

// La portada exige sesión (main.tsx): se monta la aplicación directamente, con los expedientes públicos de Loja y Atarfe.
const appDirect = { name: "app-direct", configureServer(s) { s.middlewares.use("/app-direct", async (_q, res) => {
  res.setHeader("Content-Type", "text/html");
  res.end(await s.transformIndexHtml("/app-direct", `<html><body><div id="root"></div><script type="module">import React from 'react';import {createRoot} from 'react-dom/client';import App from '/src/App.tsx';import '/src/index.css';createRoot(document.getElementById('root')).render(React.createElement(App));</script></body></html>`));
}); } };
const server = await createServer({ plugins: [appDirect], server: { host: "127.0.0.1", port: 0 } });
await server.listen();
const output = process.env.COMPAS_TEST_OUTPUT;
// Un espacio por indicador de la plantilla común: envejecimiento saludable (18), adicciones (12) y bienestar emocional (17).
const WORKSHEETS = 47;
let browser;
try {
  browser = await chromium.launch({ headless: true,
    ...(process.env.COMPAS_TEST_CHROMIUM ? { executablePath: process.env.COMPAS_TEST_CHROMIUM } : {}),
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const address = server.httpServer.address();
  await page.goto(`http://127.0.0.1:${address.port}/app-direct`);
  // Plan de Acción con el diseño de Inicio: se abre «Líneas e indicadores» y la primera línea.
  const plan = async () => {
    await page.locator(".app-nav__tab").filter({ hasText: "Plan de Acción" }).click();
    const section = page.locator("details.plan-page__section").first();
    if (await section.getAttribute("open") === null) await section.locator(":scope > summary").click();
    const line = page.locator("details.pcm-line-fold").first();
    if (await line.getAttribute("open") === null) await line.locator(":scope > summary").click();
  };
  const changeMunicipality = async (name, id) => {
    await page.waitForTimeout(1000);
    if (!(await page.locator(".municipality-selector").isVisible())) await page.getByRole("button", { name: /Cambiar ámbito|Elige un ámbito/ }).first().click();
    await page.locator(".municipality-selector__option").filter({ hasText: name }).click();
    await page.waitForFunction((id) => {
      const raw = localStorage.getItem(`compas-ng:workspace:${id}`);
      return raw && JSON.parse(raw).repository.documents.length > 0;
    }, id);
  };
  const openSheet = async () => {
    const general = page.locator(".pcm-general").first();
    if (await general.getAttribute("open") === null) await general.locator(":scope > summary").click();
    const indicator = general.locator(".pcm-sheet").first();
    if (await indicator.getAttribute("open") === null) await indicator.locator(":scope > summary").click();
    const sheet = general.locator(".indicator-worksheet").first();
    if (await sheet.getAttribute("open") === null) await sheet.locator(":scope > summary").click();
    return sheet;
  };
  const snapshot = (id) => page.evaluate((id) => JSON.parse(localStorage.getItem(`compas-ng:workspace:${id}`)), id);
  await changeMunicipality("Loja", "loja");
  await plan();
  assert.equal(await page.locator(".indicator-worksheet").count(), WORKSHEETS);
  const before = await snapshot("loja");
  let sheet = await openSheet();
  const owner = "RESPONSABLE DE PRUEBA — no es un dato real";
  assert.equal(await sheet.getByLabel("Persona y entidad responsables de consolidar el indicador").inputValue(), "");
  await sheet.getByLabel("Persona y entidad responsables de consolidar el indicador").fill(owner);
  await sheet.getByRole("button", { name: "Crear ficha de actuación", exact: true }).click();
  const action = sheet.locator("details.indicator-worksheet__action").last();
  await action.getByLabel("Nombre de la actuación o programa", { exact: true }).fill("ACTUACIÓN SOLO DE PRUEBA");
  await action.getByRole("button", { name: "Añadir entrega de datos", exact: true }).click();
  await action.getByLabel("Periodo al que corresponden los datos").fill("PERIODO DE PRUEBA");
  await action.getByLabel("Numerador o recuento observado (si se dispone)").fill("0");
  await action.getByRole("button", { name: "Añadir entrega de datos", exact: true }).click();
  await sheet.getByRole("button", { name: "Añadir periodo de consolidación", exact: true }).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("compas-ng:workspace:loja")).indicatorWorksheets?.[0]?.consolidations.length === 1);
  const saved = await snapshot("loja");
  assert.equal(saved.indicatorWorksheets[0].actions[0].returns.length, 2);
  assert.equal(saved.indicatorWorksheets[0].consolidations[0].status, "pending");
  assert.deepEqual(saved.indicatorWorksheets[0].consolidations[0].values, {});
  assert.deepEqual(saved.evidenceStore.atoms, before.evidenceStore.atoms);
  assert.deepEqual(saved.actionPlanModuleReviews, before.actionPlanModuleReviews);

  const downloaded = page.waitForEvent("download");
  await sheet.getByRole("button", { name: "Descargar dossier del indicador (Word)", exact: true }).click();
  const download = await downloaded;
  assert.match(download.suggestedFilename(), /loja-ENV-I1\.1\.docx$/);
  assert.equal(await download.failure(), null);
  if (output) { await mkdir(output, { recursive: true }); await download.saveAs(`${output}/ficha-exportada-prueba.docx`); }

  await changeMunicipality("Atarfe", "atarfe");
  await plan();
  sheet = await openSheet();
  assert.equal(await sheet.getByLabel("Persona y entidad responsables de consolidar el indicador").inputValue(), "");
  await changeMunicipality("Loja", "loja");
  await page.reload(); await page.waitForTimeout(1500); await plan();
  sheet = await openSheet();
  assert.equal(await sheet.getByLabel("Persona y entidad responsables de consolidar el indicador").inputValue(), owner);
  assert.equal(await sheet.getByLabel("Numerador o recuento observado (si se dispone)").first().inputValue(), "0");
  assert.equal(await sheet.getByLabel("Numerador o recuento observado (si se dispone)").nth(1).inputValue(), "");
  page.once("dialog", (dialog) => dialog.dismiss());
  await sheet.getByRole("button", { name: "Eliminar ficha de actuación", exact: true }).click();
  assert.equal(await sheet.locator("details.indicator-worksheet__action").count(), 1);
  if (output) await sheet.screenshot({ path: `${output}/ficha-pantalla-prueba.png` });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await sheet.evaluate((element) => element.scrollWidth <= element.clientWidth + 1), true);
  assert.deepEqual(errors, []);
  console.log(`PASS: ${WORKSHEETS} espacios de seguimiento; fichas de actuación, entregas, Word, recarga, aislamiento municipal, cancelación de borrado y pantalla estrecha.`);
} finally {
  await browser?.close();
  await server.close();
}
