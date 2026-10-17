/**
 * scripts/capturas-web-renovada.mjs
 *
 * Genera capturas PNG de la web-renovada a 1280 y 400 px.
 * Vistas: inicio (home), repositorio, psl, plan.
 *
 * Uso: node scripts/capturas-web-renovada.mjs
 * Requiere el servidor dev en http://localhost:5173
 */
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const OUT_DIR = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../compas-analisis/analisis/F5/web-renovada"
);
mkdirSync(OUT_DIR, { recursive: true });

const BASE_URL = "http://localhost:5173";

const VIEWS = [
  { label: "home",        navText: null },
  { label: "repositorio", navText: "Diagnóstico territorial" },
  { label: "psl",         navText: "Perfil de Salud Local" },
  { label: "plan",        navText: "Plan de Acción" },
];

const WIDTHS = [1280, 400];

async function capture() {
  const browser = await chromium.launch({ headless: true });

  for (const width of WIDTHS) {
    const page = await browser.newPage({
      viewport: { width, height: Math.round(width * 0.75) },
    });

    // Cargar la home una vez para hidratar el estado de la app
    await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 20000 });
    await page.waitForTimeout(800);

    for (const view of VIEWS) {
      if (view.navText) {
        // Volver a la home para restablecer el estado y luego navegar
        await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 15000 });
        await page.waitForTimeout(400);
        const tab = page.locator("button.app-nav__tab").filter({ hasText: view.navText });
        if (await tab.count() > 0) {
          await tab.first().click();
          await page.waitForTimeout(600);
        } else {
          console.warn(`Tab "${view.navText}" no encontrado`);
        }
      }

      const file = resolve(OUT_DIR, `${view.label}-${width}.png`);
      await page.screenshot({ path: file, fullPage: true });
      console.log(`✓ ${file}`);
    }

    await page.close();
  }

  await browser.close();
  console.log("\nCapturas completadas en:", OUT_DIR);
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
