import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

// Public seed only; isolated browser storage. Never writes a production workspace.
const base = process.env.COMPAS_QA_URL ?? 'http://127.0.0.1:5187/compas-ng-renovado/';
const out = path.resolve(process.env.COMPAS_QA_OUTPUT ?? 'work/profile-review');
const scope = process.env.COMPAS_QA_SCOPE ?? 'loja';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${base}?vista=app`);
  const result = await page.evaluate(async ({base, scope}) => {
    const ws = await (await fetch(`${base}seeds/compas-ng-workspace-${scope}.json`)).json();
    if (scope === 'granada-zaidin') {
      const { processPdfHealthReport } = await import(`${base}src/application/health-report/ProcessPdfHealthReport.ts`);
      const bytes = await (await fetch(`${base}docs/source-material/health-reports/informe-salud-zaidin-abril-2023.pdf`)).arrayBuffer();
      ws.healthReport = await processPdfHealthReport(ws.healthReport, bytes);
    }
    const territory = ws.municipality.identity.name;
    const api = await import(`${base}src/application/health-profile/index.ts`);
    const { createMunicipalityRuntime } = await import(`${base}src/application/runtime/index.ts`);
    const storage = await import(`${base}src/infrastructure/persistence/local-storage/index.ts`);
    const { projectCanonicalToDocumentModel } = await import(`${base}src/application/psl-c-export/pslcCanonicalProjector.ts`);
    const { buildPSLCPdf } = await import(`${base}src/application/psl-c-export/pslcPdf.ts`);
    const args = w => ({ workspace: w,
      determinantTitles: w.evidenceStore.atoms.filter(a => a.kind === 'determinant').map(a => a.title),
      assets: w.evidenceStore.atoms.filter(a => a.kind === 'asset').map(a => ({title:a.title,content:a.content})) });
    const answers = api.buildDiagnosticAnswers(args(ws));
    const psl = createMunicipalityRuntime({ workspace: ws }).psl;
    const doc = api.buildCanonicalProfileDocumentFromPSL({ psl, answers, territory });
    const sealed = api.sealCanonicalProfileDocument(doc);
    assertLocal(api.readSealedCanonicalDocument(JSON.parse(JSON.stringify(sealed))) !== null, 'seal reload');
    storage.saveWorkspaceToLocalStorage(ws);
    const loaded = storage.loadWorkspaceFromLocalStorage(scope);
    assertLocal(loaded !== null, 'workspace reload');
    assertLocal(JSON.stringify(api.buildDiagnosticAnswers(args(loaded))) === JSON.stringify(answers), 'answers reload');
    const model = projectCanonicalToDocumentModel(doc.editorialView, doc.technicalSpace, {
      title: `Perfil de Salud Local de ${territory}`, subtitle: 'Documento de trabajo · revisión reproducible',
      fileName: 'perfil-loja-revision.pdf',
      portada: ['Expediente público del repositorio. Revisión de 24 de octubre de 2026.',
        'Borrador sin validación técnica ni consenso institucional. No es un PSL-C aprobado.'],
      traceability: { sourceHash: sealed.canonicalHash, artifactId: 'review-only', sourcePSLId: psl.id,
        sourcePSLVersion: psl.version, sourcePSLEvidenceStoreVersion: psl.evidenceStoreVersion,
        frozenEvidenceAtomCount: psl.totalEvidenceAtoms },
    });
    const pdf = Array.from(new Uint8Array(buildPSLCPdf(model).output('arraybuffer')));
    const { default: React } = await import(`${base}node_modules/.vite/deps/react.js`);
    const { default: ReactDOM } = await import(`${base}node_modules/.vite/deps/react-dom_client.js`);
    const { ProfileIntegratedEditorialPreview } = await import(`${base}src/ui/components/ProfileIntegratedEditorialPreview.tsx`);
    for (const child of document.body.children) if (child instanceof HTMLElement) child.style.display = 'none';
    const mount = document.createElement('main');
    mount.id = 'profile-review'; mount.style.cssText = 'max-width:1120px;margin:auto;padding:20px';
    document.body.append(mount);
    ReactDOM.createRoot(mount).render(React.createElement(ProfileIntegratedEditorialPreview, { view: doc.editorialView }));
    return { pdf, model, canonical: doc, answers, documents: ws.repository.documents.map(d => ({
      id:d.id, title:d.title, kind:d.kind, status:d.status, cycle:d.cycle, chars:d.sourceText?.length ?? 0,
      file:d.sourceFileName, scale:d.territorialScale, tags:d.tags })),
      persistence: { workspaceReload: true, answersEqual: true, sealReload: true }, pslStatus: psl.status };
    function assertLocal(value, label) { if (!value) throw new Error(label); }
  }, {base, scope});
  await page.locator('#profile-review h1, #profile-review h2').first().waitFor();
  assert.equal(result.pslStatus, 'generated');
  await writeFile(path.join(out, `perfil-${scope}.pdf`), Buffer.from(result.pdf));
  delete result.pdf;
  await writeFile(path.join(out, 'revision.json'), JSON.stringify(result, null, 2));
  await writeFile(path.join(out, `perfil-${scope}.txt`), result.model.sections.map(s => `${s.title}\n${JSON.stringify(s)}`).join('\n\n'));
  await page.locator('#profile-review').screenshot({ path: path.join(out, `perfil-${scope}.png`) });
  console.log(JSON.stringify({ output:out, documents:result.documents, blocks:result.canonical.editorialView.sourceBlocks.length,
    sections:result.model.sections.map(s=>s.sectionId), persistence:result.persistence }));
} finally { await browser.close(); }
