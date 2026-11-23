import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixtures = resolve(repo, "fixtures");
const atarfe = resolve(repo, "Atarfe");
const viteBin = resolve(repo, "node_modules/vite/bin/vite.js");
const appUrl = "http://127.0.0.1:5173/compas-ng-renovado/";
const storageKey = "compas-ng:workspace:atarfe";

const studies = [
  { name: "IBSE", input: "ibse-csv-input", file: "ibse-atarfe.csv", field: "ibseStudy", tag: "ibse", atoms: 6 },
  { name: "DUKE-EAS", input: "duke-csv-input", file: "duke-eas-granada.csv", field: "dukeStudy", tag: "duke-eas", atoms: 4 },
  { name: "PREDIMED-EAS", input: "predimed-csv-input", file: "predimed-eas-granada.csv", field: "predimedStudy", tag: "predimed-eas", atoms: 2 },
  { name: "SF-12 EAS", input: "sf12-csv-input", file: "sf12-eas-granada.csv", field: "sf12Study", tag: "sf12-eas", atoms: 3 },
  { name: "Sueno EAS", input: "sueno-csv-input", file: "sueno-eas-granada.csv", field: "suenoStudy", tag: "sueno-eas", atoms: 3 },
  { name: "CAGE-EAS", input: "cage-csv-input", file: "cage-eas-granada.csv", field: "cageStudy", tag: "cage-eas", atoms: 3 },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function serverResponds() {
  try {
    const response = await fetch(appUrl);
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForServer(processRef, getOutput) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 25000) {
    if (processRef.exitCode !== null) {
      throw new Error(`Vite exited with code ${processRef.exitCode}.\n${getOutput()}`);
    }
    if (await serverResponds()) return;
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  throw new Error(`Timed out waiting for ${appUrl}.\n${getOutput()}`);
}

let server = null;
let browser = null;

try {
  if (!(await serverResponds())) {
    console.log("Atarfe E2E: starting Vite");
    let serverOutput = "";
    server = spawn(
      process.execPath,
      [viteBin, "--host", "127.0.0.1", "--port", "5173", "--strictPort"],
      { cwd: repo, stdio: ["ignore", "pipe", "pipe"], windowsHide: true }
    );
    server.stdout.on("data", (chunk) => { serverOutput += chunk.toString(); });
    server.stderr.on("data", (chunk) => { serverOutput += chunk.toString(); });
    await waitForServer(server, () => serverOutput);
  }

  console.log("Atarfe E2E: launching browser");
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  console.log("Atarfe E2E: opening repository");
  await page.goto(appUrl, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "2 Repositorio documental" }).click();

  console.log("Atarfe E2E: registering Localiza Salud");
  const kindSelect = page.locator(".document-form select");
  await kindSelect.selectOption("localiza-salud");
  await page.locator(".workspace-panel textarea").fill(
    "Documento de comprobacion de integracion para Localiza Salud en Atarfe."
  );
  await page.locator(".document-form input").fill("Localiza Salud - Atarfe");
  await page.getByRole("button", { name: "Registrar documento" }).click();
  await page.waitForFunction(
    (key) => JSON.parse(localStorage.getItem(key) ?? "null")?.repository?.documents?.some(
      (document) => document.kind === "localiza-salud"
    ),
    storageKey
  );

  console.log("Atarfe E2E: loading Health Report");
  await page.locator(".document-form select").selectOption("health-report");
  await page.locator("#hr-file-input").setInputFiles(resolve(atarfe, "Informe_Salud_Atarfe.docx"));
  await page.waitForFunction(
    (key) => JSON.parse(localStorage.getItem(key) ?? "null")?.healthReport !== undefined,
    storageKey,
    { timeout: 30000 }
  );

  for (const study of studies) {
    console.log(`Atarfe E2E: loading ${study.name}`);
    const uploadAction = page.locator(`.ec-study-row__upload[for="${study.input}"]`);
    assert(await uploadAction.isVisible(), `${study.name}: visible upload label not found.`);
    await page.locator(`#${study.input}`).setInputFiles(resolve(fixtures, study.file));
    await page.waitForFunction(
      ({ key, field, file }) => {
        const workspace = JSON.parse(localStorage.getItem(key) ?? "null");
        return workspace?.[field]?.sourceFileName === file;
      },
      { key: storageKey, field: study.field, file: study.file }
    );
  }

  await page.waitForTimeout(750);
  console.log("Atarfe E2E: checking workspace and repository");
  const rawBeforeReload = await page.evaluate((key) => localStorage.getItem(key), storageKey);
  assert(rawBeforeReload !== null, "Atarfe workspace was not persisted.");
  const workspace = JSON.parse(rawBeforeReload);

  assert(workspace.repository.documents.length === 8, `Expected 8 documents, found ${workspace.repository.documents.length}.`);
  assert(workspace.municipality.identity.id === "atarfe", "Workspace municipality is not Atarfe.");

  for (const study of studies) {
    const documents = workspace.repository.documents.filter((document) => document.tags.includes(study.tag));
    const atoms = workspace.evidenceStore.atoms.filter((atom) => atom.tags.includes(study.tag));
    assert(documents.length === 1, `${study.name}: expected one repository document, found ${documents.length}.`);
    assert(atoms.length === study.atoms, `${study.name}: expected ${study.atoms} atoms, found ${atoms.length}.`);
    assert(
      atoms.every(
        (atom) => atom.municipalityId === "atarfe" && atom.provenance.documentId === documents[0].id
      ),
      `${study.name}: incomplete document traceability or municipality isolation.`
    );
    const repositoryRow = page.locator(`[data-document-tags~="${study.tag}"]`);
    assert(await repositoryRow.count() === 1, `${study.name}: repository row is not visible in UI.`);
  }

  console.log("Atarfe E2E: reloading persisted workspace");
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    (key) => JSON.parse(localStorage.getItem(key) ?? "null")?.repository?.documents?.length === 8,
    storageKey
  );
  await page.waitForTimeout(250);
  const rawAfterReload = await page.evaluate((key) => localStorage.getItem(key), storageKey);
  assert(rawAfterReload === rawBeforeReload, "Workspace changed after a reload without user changes.");
  assert(consoleErrors.length === 0, `Console errors:\n${consoleErrors.join("\n")}`);

  console.log("Atarfe E2E PASS");
  console.log("");
  console.log("── REPOSITORIO DOCUMENTAL ────────────────────────────────────────────");
  for (const doc of workspace.repository.documents) {
    const studyTag = doc.tags.find(t => !["complementary-study","redcap-export","eas","health-report","primary-source"].includes(t));
    const label = studyTag ? studyTag.toUpperCase().replace(/-/g," ") : doc.kind.toUpperCase().replace(/-/g," ");
    console.log(`  [${label.padEnd(16)}]  ${doc.title}  (${doc.sourceFileName ?? "texto manual"})`);
  }
  console.log("");
  console.log("── EVIDENCESTORE ─────────────────────────────────────────────────────");
  console.log(`  Total átomos: ${workspace.evidenceStore.atoms.length}`);
  for (const study of studies) {
    const count = workspace.evidenceStore.atoms.filter((atom) => atom.tags.includes(study.tag)).length;
    console.log(`  ${study.tag.padEnd(14)}: ${count} átomos`);
  }
  const otherAtoms = workspace.evidenceStore.atoms.filter(a => !studies.some(s => a.tags.includes(s.tag))).length;
  if (otherAtoms > 0) console.log(`  ${"otros".padEnd(14)}: ${otherAtoms} átomos (health-report / texto)`);
  console.log("");
  console.log("── PANELES — DATOS CARGADOS ──────────────────────────────────────────");
  const ibse    = workspace.ibseStudy;
  const duke    = workspace.dukeStudy;
  const pred    = workspace.predimedStudy;
  const sf12    = workspace.sf12Study;
  const sueno   = workspace.suenoStudy;
  const cage    = workspace.cageStudy;
  if (ibse)  console.log(`  IBSE           n=${ibse.aggregates.nValid} válidos · media IBSE total=${ibse.aggregates.meanTotal}`);
  if (duke)  console.log(`  DUKE-EAS       n=${duke.aggregates.nValidGlobal} · media global=${duke.aggregates.meanGlobal}/55 · apoyo bajo=${duke.aggregates.lowGlobalPercentage}%`);
  if (pred)  console.log(`  PREDIMED-EAS   n=${pred.aggregates.nValid} · media Predimed=${pred.aggregates.meanScore} · alta adherencia=${pred.aggregates.highPercentage}%`);
  if (sf12)  console.log(`  SF-12 EAS      n=${sf12.aggregates.nValidPCS} · PCS=${sf12.aggregates.meanPCS} · MCS=${sf12.aggregates.meanMCS}`);
  if (sueno) console.log(`  SUEÑO EAS      n=${sueno.aggregates.nValidP33R} válidos P33_R · insuficiente=${sueno.aggregates.pctInsufficientSleep}% · no descansa=${sueno.aggregates.pctNoRest}%`);
  if (cage)  console.log(`  CAGE-EAS       n=${cage.aggregates.nValidCAGER} válidos CAGE_R · riesgo=${cage.aggregates.pctRisk}% (n=${cage.aggregates.nRisk}) · abstinentes=${cage.aggregates.missingCAGER}`);
  console.log("");
  console.log("── PERSISTENCIA ──────────────────────────────────────────────────────");
  console.log("  Workspace idéntico tras recarga de página: ✓");
  console.log("Persistence: exact workspace equality after reload");

  await context.close();
} finally {
  if (browser !== null) await browser.close();
  if (server !== null && server.exitCode === null) server.kill();
}
