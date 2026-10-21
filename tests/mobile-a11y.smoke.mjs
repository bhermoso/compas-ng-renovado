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
/* Inspección 2026-10-21: a 390 px ninguna pestaña desborda y ningún control queda sin etiqueta. */
const b = await chromium.launch({ executablePath: process.env.COMPAS_TEST_CHROMIUM, headless: true, args: ["--no-sandbox"] });
const page = await b.newPage({ viewport: { width: 390, height: 844 } });
await page.goto(`${base}/app-direct`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1200);
const tabs = (await page.locator(".app-nav__tab").allInnerTexts()).map((t) => t.replace(/^\d+\s*/, "").trim());
const problems = [];
for (const label of tabs) {
  await page.locator(".app-nav__tab", { hasText: label }).first().click();
  await page.waitForTimeout(600);
  const r = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    unlabeled: [...document.querySelectorAll("input,select,textarea,button")].filter((e) => e.type !== "hidden" && !(e.textContent || "").trim() && !e.getAttribute("aria-label") && !e.title && !e.id && !e.closest("label") && !e.getAttribute("aria-labelledby")).length
      + [...document.querySelectorAll("input,select,textarea")].filter((i) => i.type !== "hidden" && !i.getAttribute("aria-label") && !i.id && !i.closest("label") && !i.getAttribute("aria-labelledby")).length,
  }));
  if (r.overflow) problems.push(`${label}: desborda`);
  if (r.unlabeled) problems.push(`${label}: ${r.unlabeled} controles sin etiqueta`);
}
await b.close(); await server.close();
if (problems.length) { console.log("FALLO:", problems.join("; ")); process.exit(1); }
console.log(`OK: ${tabs.length} pestañas sin desborde a 390 px y sin controles sin etiqueta`);
