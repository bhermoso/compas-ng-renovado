import { chromium } from "playwright";

const base = process.env.COMPAS_QA_URL ?? "http://127.0.0.1:5187/compas-ng-renovado/";
const browser = await chromium.launch({ headless: true });
try {
  for (const width of [1280, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(`${base}?vista=app`);
    await page.evaluate(async (base) => {
      const { default: React } = await import(`${base}node_modules/.vite/deps/react.js`);
      const { default: ReactDOM } = await import(`${base}node_modules/.vite/deps/react-dom_client.js`);
      const { IBSEPanel } = await import(`${base}src/ui/components/IBSEPanel.tsx`);
      const { prepareIBSEImport } = await import(`${base}src/application/ibse/prepareIBSEImport.ts`);
      const { createIBSEStudy } = await import(`${base}src/domain/ibse/IBSEStudy.ts`);
      const { ATARFE_POPULATION_2025 } = await import(`${base}fixtures/population/atarfe-population-2025.ts`);
      const rows = ATARFE_POPULATION_2025.ageSexMatrix.filter((cell) => parseInt(cell.ageBand) >= 15)
        .flatMap((cell) => [1, 2].map((sex) => `2,${sex === 1 ? 80 : 40},60,50,30,90,${sex},${parseInt(cell.ageBand)}`));
      const csv = ["monitor_ibse_complete,ibse_total,ibse_factor_vinculo,ibse_factor_situacion,ibse_factor_control,ibse_factor_persona,sexo,edad", ...rows].join("\n");
      const parsed = await prepareIBSEImport(csv, "atarfe", "15-plus");
      if (parsed.demographicAdjustment.status !== "computed") throw new Error("Synthetic adjustment blocked");
      const study = createIBSEStudy({ municipalityId: "atarfe", sourceFileName: "synthetic-qa.csv", ...parsed });
      for (const child of document.body.children) if (child instanceof HTMLElement) child.style.display = "none";
      const mount = document.createElement("main");
      mount.style.cssText = "padding:16px;max-width:100%;box-sizing:border-box";
      document.body.append(mount);
      ReactDOM.createRoot(mount).render(React.createElement(IBSEPanel, { ibseStudy: study }));
    }, base);
    const section = page.locator("section").filter({ has: page.getByRole("heading", { name: "Ajuste demográfico", exact: true }) });
    await section.getByText("Media ajustada", { exact: true }).waitFor();
    await section.screenshot({ path: `${process.env.TEMP ?? "."}/compas-ibse-adjustment-${width}.png` });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    if (overflow) throw new Error(`Horizontal overflow at ${width}`);
    console.log(`IBSE adjusted panel verified at ${width}px`);
    await page.close();
  }
} finally {
  await browser.close();
}
