import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const server = await createServer({ server: { host: '127.0.0.1', port: 0 } });
await server.listen();
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/compas-ng-renovado/`);
  await page.evaluate(() => localStorage.setItem('compas-ng:custom-municipalities', JSON.stringify([
    { id: 'fuente-vaqueros', name: 'Fuente Vaqueros', province: 'Granada' },
    { id: 'prueba-borrado', name: 'Prueba borrado', province: 'Granada' },
  ])));
  await page.reload();
  await page.locator('.app-nav__tab').filter({ hasText: 'Plan de Acción' }).click();
  const openSelector = () => page.getByRole('button', { name: /Cambiar ámbito/ }).click();
  await openSelector();
  assert.equal(await page.locator('.municipality-selector__option-name').filter({ hasText: 'Fuente Vaqueros' }).count(), 1);
  await page.locator('.municipality-selector__option-main').filter({ hasText: 'Prueba borrado' }).click();
  await page.waitForFunction(() => !!localStorage.getItem('compas-ng:workspace:prueba-borrado'));
  await page.evaluate(async () => {
    const files = await import('/compas-ng-renovado/src/infrastructure/document-files/originalFiles.ts');
    await files.saveOriginalFile('prueba-borrado', 'original', new File(['prueba'], 'original.txt'));
  });
  // Native confirmations are unavailable in some embedded browsers.
  await page.evaluate(() => { window.confirm = () => false; });
  await openSelector();
  await page.getByRole('button', { name: 'Eliminar expediente de Prueba borrado', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar', exact: true }).click();
  assert.ok(await page.evaluate(() => localStorage.getItem('compas-ng:workspace:prueba-borrado')));
  await page.getByRole('button', { name: 'Eliminar expediente de Prueba borrado', exact: true }).click();
  await page.getByRole('button', { name: 'Eliminar de este navegador', exact: true }).click();
  await page.waitForFunction(() => localStorage.getItem('compas-ng:active-municipality') !== 'prueba-borrado');
  await page.reload();
  await page.locator('.app-nav__tab').filter({ hasText: 'Plan de Acción' }).click();
  await openSelector();
  assert.equal(await page.locator('.municipality-selector__option-name').filter({ hasText: 'Prueba borrado' }).count(), 0);
  const saved = await page.evaluate(async () => {
    const files = await import('/compas-ng-renovado/src/infrastructure/document-files/originalFiles.ts');
    const storage = await import('/compas-ng-renovado/src/infrastructure/persistence/indexed-db-workspace.ts');
    return { local: localStorage.getItem('compas-ng:workspace:prueba-borrado'),
      indexed: await storage.loadWorkspaceFromIndexedDB('prueba-borrado'),
      originals: (await files.listOriginalFiles()).filter(file => file.municipalityId === 'prueba-borrado').length };
  });
  assert.deepEqual(saved, { local: null, indexed: null, originals: 0 });
  await page.getByRole('button', { name: 'Eliminar expediente de Fuente Vaqueros', exact: true }).click();
  await page.getByRole('button', { name: 'Eliminar de este navegador', exact: true }).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('compas-ng:deleted-municipalities')).includes('fuente-vaqueros'));
  await page.reload();
  await page.locator('.app-nav__tab').filter({ hasText: 'Plan de Acción' }).click();
  await openSelector();
  assert.equal(await page.locator('.municipality-selector__option-name').filter({ hasText: 'Fuente Vaqueros' }).count(), 0);
  console.log('OK: catálogo sin duplicados; borrado de datos y originales; no reaparece al recargar. Contexto de prueba aislado.');
} finally {
  await browser?.close();
  await server.close();
}
