import { createMunicipalityRuntime as currentRuntime, type CreateMunicipalityRuntimeInput } from '../../src/application/runtime/MunicipalityRuntime';
import { buildLocalHealthProfile, excludeHistoricalSources } from '../../src/application/health-profile';

/** Historical generator/exports regression harness. Production never calls this builder.
 * Archive tests explicitly reconstruct their old generated fixture; new runtime tests use the production factory.
 */
export function createMunicipalityRuntime(input: CreateMunicipalityRuntimeInput) {
 const base = currentRuntime(input);
 if (input.workspace.validatedPSL) return base;
 const profile = buildLocalHealthProfile({sanitizedStore:base.integrityGuard.sanitizedStore,
  integrityResult:base.integrityGuard,mit:base.mit,reconciliacion:base.reconciliacion,
  oitParaDecision:base.oit,workspace:excludeHistoricalSources(input.workspace)});
 return {...currentRuntime({...input,workspace:{...input.workspace,validatedPSL:profile}}),workspace:input.workspace};
}
