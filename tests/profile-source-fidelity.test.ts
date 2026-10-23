import { describe, expect, it } from 'vitest';
import seed from '../public/seeds/compas-ng-workspace-granada-zaidin.json';
import type { MunicipalityWorkspace } from '../src/domain/workspace';
import { buildHealthReportStructuredReading } from '../src/application/health-report/HealthReportStructuredReading';
import { createMunicipalityRuntime } from '../src/application/runtime';
import { buildDiagnosticAnswers, excludeHistoricalSources } from '../src/application/health-profile';
import { healthReportFingerprint, profileSourceChanged } from '../src/application/health-profile/profileSourceChanged';
import { setMunicipalDocumentCycle } from '../src/domain/repository';

const workspace = () => structuredClone(seed) as unknown as MunicipalityWorkspace;
function syntheticReport(text: string, id = 'synthetic-town') {
  return {
    ...workspace().healthReport!, municipalityId: id,
    body: { originalText: text, charCount: text.length, format: 'plain' as const, isAuthoritative: true as const },
    sections: [],
  };
}

describe('Mortality extraction preserves the source rather than supplying defaults', () => {
  it.each(['Villa Uno', 'Villa Dos'])('uses only explicit fields for %s', name => {
    const text = `4.3 Análisis de la mortalidad\nEn el municipio de ${name} en 2025 fallecieron 3 personas. Tasa Bruta de Mortalidad de 3,6‰.\nLas principales causas de defunción fueron causas externas, sin porcentajes disponibles.\n5. Análisis Encuesta Andaluza de Salud`;
    const result = buildHealthReportStructuredReading(syntheticReport(text));
    const rate = result.findings.find(f => f.topic === 'mortalidad general')!;
    expect(rate.value).toBe(3.6);
    expect(rate.numerator).toBe(3);
    expect(rate.period).toBe('2025');
    expect(rate.geography.label).toBe(name);
    expect(rate.limitations.join(' ')).toContain('recuentos pequeños');
    const causes = result.findings.find(f => f.topic.includes('principales causas'))!;
    expect(causes.value).toBe('Las principales causas de defunción fueron causas externas, sin porcentajes disponibles.');
    expect(causes.period).toBeUndefined();
    expect(JSON.stringify(result.findings)).not.toMatch(/27%|25%|11%|Granada|2021/);
  });
  it('does not use the report year or territory as the observation year or geography', () => {
    const report = syntheticReport('4.3 Análisis de la mortalidad\nTasa Bruta de Mortalidad de 8,1‰.');
    report.reportingPeriod = '2026';
    const rate = buildHealthReportStructuredReading(report).findings[0];
    expect(rate.period).toBeUndefined();
    expect(rate.geography.level).toBe('unknown');
    expect(rate.numerator).toBeUndefined();
  });
  it('preserves literal cause percentages for Zaidin without supplying missing ones', () => {
    const text = '4.3 Análisis de la mortalidad\nLas principales causas de defunción en 2024 fueron tumores 19%.\n5. Análisis Encuesta Andaluza de Salud';
    const cause = buildHealthReportStructuredReading(syntheticReport(text, 'granada-zaidin')).findings[0];
    expect(cause.value).toContain('19%');
    expect(cause.value).not.toContain('27%');
    expect(cause.period).toBe('2024');
  });
  it('does not assign Zaidin clinical geography to another municipality', () => {
    const text = '4.1.1.- Enfermedades Crónicas\nDiabetes Mellitus\nLa prevalencia documentada fue del 7% en 2025.\n4.1.2.- Incidencia de Cáncer';
    const result = buildHealthReportStructuredReading(syntheticReport(text));
    expect(result.findings.some(f => f.geography.label.includes('Zaidín'))).toBe(false);
    expect(result.extractionNotes.join(' ')).toContain('no se aplican a este territorio');
    expect(result.sections.length).toBeGreaterThan(0);
  });
});

describe('Source age and validated profile preservation', () => {
  it('excludes a historical primary report without changing the original workspace', () => {
    const w = workspace();
    const original = w.healthReport;
    w.repository = setMunicipalDocumentCycle(w.repository, original!.linkedDocumentId, { status: 'historical', referenceYear: 2010 });
    expect(excludeHistoricalSources(w).healthReport).toBeUndefined();
    const answers = buildDiagnosticAnswers({ workspace: w, assets: [], determinantTitles: [] });
    expect(answers.sanitaria.present).toBe(false);
    expect(answers.antecedentes?.sources.some(s => s.documentId === original!.linkedDocumentId)).toBe(true);
    expect(w.healthReport).toBe(original);
    expect(createMunicipalityRuntime({workspace:w}).psl.healthReportDocumentId).toBeUndefined();
  });
  it.each(['validated', 'approved'] as const)('detects same-ID changes and preserves %s authorship', status => {
    const w = workspace();
    w.validatedPSL = {...createMunicipalityRuntime({workspace:w}).psl, status};
    const saved = w.validatedPSL;
    expect(createMunicipalityRuntime({workspace:w}).pslIsStale).toBe(false);
    w.healthReport!.body.originalText += '\nSYNTHETIC NEW SOURCE CONTENT';
    const runtime = createMunicipalityRuntime({workspace:w});
    expect(runtime.pslIsStale).toBe(true);
    expect(runtime.psl).toBe(saved);
  });
  it('detects changed HTML and historical status with the same report id', () => {
    const w = workspace();
    const p = createMunicipalityRuntime({workspace:w}).psl;
    w.healthReport!.body.originalHtml = '<table><tr><td>Changed</td></tr></table>';
    expect(profileSourceChanged(p,w)).toBe(true);
    w.healthReport = workspace().healthReport;
    w.repository = setMunicipalDocumentCycle(w.repository,w.healthReport!.linkedDocumentId,{status:'historical',referenceYear:2010});
    expect(profileSourceChanged(p,w)).toBe(true);
  });
  it('keeps the fingerprint across serialization and ignores processing timestamps', () => {
    const w = workspace();
    const before = healthReportFingerprint(w.healthReport);
    w.healthReport!.updatedAt = '2099-01-01T00:00:00Z';
    expect(healthReportFingerprint(JSON.parse(JSON.stringify(w.healthReport)))).toBe(before);
  });
  it('handles legacy profiles without inventing a historical fingerprint', () => {
    const w = workspace();
    const p = {...createMunicipalityRuntime({workspace:w}).psl, healthReportFingerprint:undefined, validatedAt:'2020-01-01T00:00:00Z'};
    w.healthReport!.updatedAt = '2025-01-01T00:00:00Z';
    expect(profileSourceChanged(p,w)).toBe(true);
    expect(p.healthReportFingerprint).toBeUndefined();
  });
});
