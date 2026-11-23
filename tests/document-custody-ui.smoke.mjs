import assert from "node:assert/strict";
import { chromium } from "playwright";
import { createServer } from "vite";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc } from "firebase/firestore";
import { jsPDF } from "jspdf";

// Ejecutar con los emuladores del proyecto demo-compas-relas y la configuración local del repositorio.
const server = await createServer({
  plugins: [{
    name: "compas-firestore-demo-only",
    enforce: "pre",
    transform(_source, id) {
      if (id.replaceAll("\\", "/").endsWith("/src/infrastructure/relas/BrowserRelasClient.ts")) {
        return "export function createBrowserRelasClient() { if (!globalThis.compasDemoClient) throw Error('Cliente de ensayo no instalado'); return globalThis.compasDemoClient; }";
      }
    },
  }],
  server: { host: "127.0.0.1", port: 0 },
});
await server.listen();
const appOrigin = "http://127.0.0.1:" + server.httpServer.address().port;
const env = await initializeTestEnvironment({
  projectId: "demo-compas-relas", firestore: { host: "127.0.0.1", port: 8189 },
});
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("dialog", dialog => dialog.accept());
  await page.route("**/*", route => new URL(route.request().url()).hostname === "127.0.0.1" ? route.continue() : route.abort());
  await page.goto(appOrigin + server.config.base + "tests/fixtures/document-custody-ui.html");
  await page.waitForFunction(() => typeof compasInterfaceTest !== "undefined");
  const uid = await page.evaluate(() => compasInterfaceTest.signUp("custodia-interfaz"));
  await env.withSecurityRulesDisabled(ctx => setDoc(doc(ctx.firestore(), "compas_admins", uid), { active: true }));
  function pdf(text) {
    const doc = new jsPDF();
    doc.text(text, 20, 20);
    return Buffer.from(doc.output("arraybuffer"));
  }
  await page.evaluate(buffer => compasInterfaceTest.seed(buffer), Array.from(pdf("Informe inicial sintetico")));
  await page.evaluate(() => compasInterfaceTest.mount());
  const launch = page.getByRole("button", { name: /Consultar documentación/ });
  const dialog = page.getByRole("dialog");
  const index = dialog.getByRole("button", { name: "← Índice documental" });
  const openDoc = async name => {
    if (!await dialog.isVisible()) await launch.click();
    if (await index.isVisible()) await index.click();
    await dialog.getByRole("button", { name, exact: true }).click();
  };
  const management = dialog.getByText("Gestionar versiones, archivo y eliminación", { exact: true });
  const openManagement = async () => {
    await management.waitFor({ timeout: 15000 });
    if (!await management.evaluate(element => element.closest("details").open)) await management.click();
  };
  const read = () => page.evaluate(() => compasInterfaceTest.read());
  await openDoc("Informe inicial de ensayo");
  await openManagement();
  await dialog.getByLabel("Crear nueva versión documental PDF o DOCX").setInputFiles({
    name: "informe-nuevo.pdf", mimeType: "application/pdf", buffer: pdf("Informe nuevo sintetico"),
  });
  await dialog.getByText("Versión incorporada", { exact: false }).waitFor();
  const pending = await read();
  assert.equal(pending.report, "informe-origen");
  const pendingDoc = pending.documents.find(doc => doc[3] === "informe-nuevo.pdf");
  assert.equal(pendingDoc[2], "informe-origen");
  assert.ok(pending.originals.includes("informe-origen.pdf") && pending.originals.includes("informe-nuevo.pdf"));
  await dialog.getByRole("button", { name: / · versión 2$/ }).click();
  await openManagement();
  await dialog.getByRole("button", { name: "Usar esta revisión del Informe" }).click();
  await dialog.getByText("Revisión utilizada en Diagnóstico y guardada en Firebase.", { exact: true }).waitFor();
  const activated = await read();
  assert.equal(activated.report, pendingDoc[0]);
  assert.ok(activated.reportText.includes("Informe nuevo sintetico"));
  assert.deepEqual(activated.previous, ["informe-origen"]);
  assert.equal(activated.documents.find(doc => doc[0] === "informe-origen")[1], "archived");
  console.log("Interfaz · Informe nuevo activado, anterior archivado y originales conservados al releer");

  await dialog.getByText("Vincular PDF o DOCX como copia reconstruida o convertida", { exact: true }).click();
  const derivative = pdf("Copia derivada sintetica");
  await dialog.getByLabel(/Adjuntar copia derivada PDF o DOCX/).setInputFiles({
    name: "copia.pdf", mimeType: "application/pdf", buffer: derivative,
  });
  await dialog.getByText("Copia derivada registrada en el expediente compartido.", { exact: true }).waitFor();
  assert.deepEqual((await read()).derived, [{name: "copia.pdf", size: derivative.length}]);
  console.log("Interfaz · Copia PDF derivada adjuntada y recuperada con verificación de huella");

  await openDoc("Anexo IBSE de ensayo");
  await openManagement();
  await dialog.getByRole("button", { name: "Eliminar documento", exact: true }).click();
  await dialog.getByRole("button", { name: "Anexo IBSE de ensayo", exact: true }).waitFor({ state: "detached" });
  await dialog.getByText("Documento eliminado.", { exact: true }).waitFor();
  await page.getByText("Eliminación comprobada mediante lectura de Firebase", { exact: false }).first().waitFor({ state: "attached" });
  const ibse = await read();
  assert.equal(ibse.study, "ibse-activo");
  assert.equal(ibse.studyN, 10);
  assert.deepEqual(ibse.ibseAtoms, ["media-ibse-sintetica"]);
  assert.ok(!ibse.documents.some(doc => doc[0] === "anexo-ibse") && !ibse.originals.includes("anexo.pdf"));
  console.log("Interfaz · Anexo IBSE eliminado sin alterar el estudio ni su evidencia");

  await openDoc("Localiza, primera carga");
  await openManagement();
  await dialog.getByRole("button", { name: "Eliminar documento", exact: true }).click();
  await dialog.getByRole("button", { name: "Localiza, primera carga", exact: true }).waitFor({ state: "detached" });
  await dialog.getByText("Documento eliminado.", { exact: true }).waitFor();
  await page.getByText("Eliminación comprobada mediante lectura de Firebase", { exact: false }).first().waitFor({ state: "attached" });
  const localiza = await read();
  assert.deepEqual(localiza.localiza, ["localiza-segunda"]);
  assert.ok(!localiza.documents.some(doc => doc[0] === "localiza-primera"));
  console.log("Interfaz · Retirada la primera carga de Localiza, el activo conserva la segunda procedencia");
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
  await env.cleanup();
  await server.close();
}
