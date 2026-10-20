import { createServer } from "vite";
import { chromium } from "playwright";
const server = await createServer({
  plugins: [{ name: "app-direct", configureServer(s) { s.middlewares.use("/app-direct", async (req, res) => {
    res.setHeader("Content-Type", "text/html");
    res.end(await s.transformIndexHtml("/app-direct", `<html><body><div id="root"></div><script type="module">import React from 'react';import {createRoot} from 'react-dom/client';import App from '/src/App.tsx';import '/src/index.css';createRoot(document.getElementById('root')).render(React.createElement(App));</script></body></html>`));
  }); } }],
  server: { host: "127.0.0.1", port: 0 },
});
await server.listen();
const base = `http://127.0.0.1:${server.httpServer.address().port}`;
const b = await chromium.launch({ executablePath: process.env.COMPAS_TEST_CHROMIUM, headless: true, args: ["--no-sandbox"] });
const page = await b.newPage({ viewport: { width: 1400, height: 900 } });
const errs = []; page.on("pageerror", e => errs.push(e.message));
let code = 0;
try {
  await page.goto(`${base}/app-direct`, { waitUntil: "domcontentloaded" });
  await page.locator(".app-nav__tab", { hasText: "Plan de Acción" }).first().click({ timeout: 20000 });
  await page.waitForTimeout(800);
  const h = () => page.evaluate(() => document.documentElement.scrollHeight);
  const tabs = await page.locator(".plan-tabs__tab").allTextContents();
  console.log("pestañas:", tabs.join(" | "), "| altura inicial:", await h());
  await page.screenshot({ path: "/tmp/plan-lineas.png", fullPage: true });
  const folds = page.locator(".pcm-line-fold");
  console.log("líneas plegadas:", await folds.count(), "| abiertas:", await page.locator(".pcm-line-fold[open]").count());
  if (await folds.count()) { await folds.first().locator("> summary").click(); console.log("tras abrir una línea, altura:", await h()); }
  for (const t of tabs.slice(1)) { await page.locator(".plan-tabs__tab", { hasText: t }).click(); await page.waitForTimeout(300); console.log(t, "→ altura", await h()); }
  await page.screenshot({ path: "/tmp/plan-tabs.png" });
  if (!tabs.length) code = 1;
} catch (e) { console.log("FALLO", String(e.message).split("\n")[0]); await page.screenshot({ path: "/tmp/plan-tabs-fail.png" }); code = 1; }
console.log("errores de página:", errs.length ? errs.join("; ") : "ninguno");
await b.close(); await server.close(); process.exit(code);
