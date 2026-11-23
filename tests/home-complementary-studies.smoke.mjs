import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const HOST = "127.0.0.1";
const PORT = "5173";
const APP_URL = `http://${HOST}:${PORT}/compas-ng-renovado/`;
const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));
const VITE_BIN = fileURLToPath(
  new URL("../node_modules/vite/bin/vite.js", import.meta.url)
);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function serverResponds() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1000);
    const response = await fetch(APP_URL, { signal: controller.signal });
    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForServer(processRef) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 20000) {
    if (processRef?.exitCode !== null && processRef?.exitCode !== undefined) {
      throw new Error(`Vite dev server exited early with code ${processRef.exitCode}.`);
    }
    if (await serverResponds()) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${APP_URL}.`);
}

function startDevServer() {
  return spawn(
    process.execPath,
    [VITE_BIN, "--host", HOST, "--port", PORT, "--strictPort"],
    {
      cwd: REPO_ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    }
  );
}

async function checkStudyRow(page, name, inputSelector) {
  // Upload label siempre visible en la fila (sin acordeón)
  const uploadLabel = page.locator(
    `.ec-study-row__upload[for="${inputSelector.slice(1)}"]`
  );
  assert(
    await uploadLabel.count() === 1,
    `Expected one upload label for ${name}, found ${await uploadLabel.count()}.`
  );
  assert(
    await uploadLabel.isVisible(),
    `Upload label for ${name} is not visible.`
  );

  // Input siempre en el DOM (aunque display:none, accesible vía CDP)
  const input = page.locator(inputSelector);
  assert(
    await input.count() === 1,
    `Expected input ${inputSelector} for ${name} in DOM, found ${await input.count()}.`
  );
}

let serverProcess = null;
let browser = null;

try {
  if (!(await serverResponds())) {
    serverProcess = startDevServer();
    await waitForServer(serverProcess);
  }

  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(error.message);
  });

  await page.goto(APP_URL, { waitUntil: "domcontentloaded" });

  const homeText = await page.locator("body").textContent();
  const normalizedHomeText =
    homeText?.normalize("NFD").replace(/\p{Diacritic}/gu, "") ?? "";
  assert(normalizedHomeText.includes("COMPAS NG"), "Home does not show COMPAS NG.");

  const repositoryButton = page.getByRole("button", { name: /Diagn.stico territorial/i });
  assert(await repositoryButton.count() === 1, "Repository navigation button ('Diagnóstico territorial') not found.");
  await repositoryButton.click();

  const repositoryText = await page.locator("body").textContent();
  for (const label of [
    "IBSE", "DUKE-EAS", "PREDIMED-EAS", "SF-12 EAS", "Sueño EAS", "CAGE-EAS",
    "AUDIT-C", "IPAQ-EAS", "GHQ-12", "PHQ-9", "PSQI", "Fagerström", "SBQ",
  ]) {
    assert(repositoryText?.includes(label), `Complementary Studies panel does not show ${label}.`);
  }

  await checkStudyRow(page, "IBSE", "#ibse-csv-input");
  await checkStudyRow(page, "DUKE-EAS", "#duke-csv-input");
  await checkStudyRow(page, "PREDIMED-EAS", "#predimed-csv-input");
  await checkStudyRow(page, "SF-12 EAS", "#sf12-csv-input");
  await checkStudyRow(page, "Sueño EAS", "#sueno-csv-input");
  await checkStudyRow(page, "CAGE-EAS", "#cage-csv-input");
  await checkStudyRow(page, "AUDIT-C", "#auditc-csv-input");
  await checkStudyRow(page, "IPAQ-EAS", "#ipaq-csv-input");
  await checkStudyRow(page, "GHQ-12", "#ghq12-csv-input");
  await checkStudyRow(page, "PHQ-9", "#phq9-csv-input");
  await checkStudyRow(page, "PSQI", "#psqi-csv-input");
  await checkStudyRow(page, "Fagerström (FTND)", "#fagerstrom-csv-input");
  await checkStudyRow(page, "SBQ", "#sbq-csv-input");

  assert(
    consoleErrors.length === 0,
    `Console errors detected:\n${consoleErrors.join("\n")}`
  );

  await context.close();
  console.log("Smoke test PASS: Home and Estudios Complementarios loaded without console errors.");
} finally {
  if (browser !== null) {
    await browser.close();
  }
  if (serverProcess !== null && serverProcess.exitCode === null) {
    serverProcess.kill();
  }
}
