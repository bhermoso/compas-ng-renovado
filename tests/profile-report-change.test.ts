import { createMunicipalityRuntime as legacyProfileFixture } from './helpers/legacyProfileRuntime';
import {describe,it,expect} from 'vitest';
import seed from '../public/seeds/compas-ng-workspace-granada-zaidin.json';
import type {MunicipalityWorkspace} from '../src/domain/workspace';
import {createMunicipalityRuntime} from '../src/application/runtime';
import {correctZaidinHealthReport,ZAIDIN_REPORT_CORRECTION,ZAIDIN_PDF_DOCUMENT_ID} from '../src/application/workspace/correctZaidinHealthReport';

describe('Vigencia del Perfil al cambiar el informe',()=>{
 for(const status of ['validated','approved'] as const)it('detecta la fuente anterior en un perfil '+status+' aunque la evidencia no cambie',()=>{
  const workspace=structuredClone(seed) as unknown as MunicipalityWorkspace;
  const generated=legacyProfileFixture({workspace}).psl;
  workspace.validatedPSL={...generated,status,healthReportDocumentId:'informe-anterior'};
  const runtime=createMunicipalityRuntime({workspace});
  expect(runtime.pslIsStale).toBe(true);
  expect(runtime.psl).toBe(workspace.validatedPSL);
  workspace.validatedPSL={...workspace.validatedPSL,healthReportDocumentId:workspace.healthReport!.linkedDocumentId};
  expect(createMunicipalityRuntime({workspace}).pslIsStale).toBe(false);
 });
 it('archiva el perfil validado y conserva el snapshot de sus respuestas al corregir el Word',()=>{
  const workspace=structuredClone(seed) as unknown as MunicipalityWorkspace;
  workspace.appliedSeedMigrations=workspace.appliedSeedMigrations?.filter(m=>m!==ZAIDIN_REPORT_CORRECTION);
  workspace.healthReport=workspace.previousHealthReports![0];
  workspace.repository.documents=workspace.repository.documents.filter(d=>d.id!==ZAIDIN_PDF_DOCUMENT_ID).map(d=>d.id===workspace.healthReport!.linkedDocumentId?{...d,kind:'health-report'}:d);
  workspace.validatedPSL={...legacyProfileFixture({workspace}).psl,status:'validated'};
  const next=correctZaidinHealthReport(workspace);
  expect(next.previousProfileRevisions?.at(-1)?.profile).toBe(workspace.validatedPSL);
  expect(next.validatedPSL).toBe(workspace.validatedPSL);
 });
});
