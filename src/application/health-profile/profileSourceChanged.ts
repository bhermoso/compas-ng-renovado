import type { LocalHealthProfile } from '../../domain/health-profile';
import type { MunicipalityWorkspace } from '../../domain/workspace';
import type { HealthReportDocument } from '../../domain/health-report';
import { excludeHistoricalSources } from './antecedents';

/** Includes analytical text and tables, but not processing timestamps. */
export function healthReportFingerprint(report: HealthReportDocument | undefined): string {
 const value = JSON.stringify(report === undefined ? null : [
  report.linkedDocumentId, report.municipalityId, report.title, report.reportingPeriod,
  report.body.originalText, report.body.originalHtml, report.body.tableCount,
  report.sections.map(s => [s.key, s.title, s.bodyText, s.bodyHtml, s.sortOrder]),
  report.pdfExtraction?.sha256,
 ]);
 let first = 2166136261;
 let second = 5381;
 for (let i = 0; i < value.length; i++) {
  first = Math.imul(first ^ value.charCodeAt(i), 16777619);
  second = Math.imul(second, 33) ^ value.charCodeAt(i);
 }
 return `hr-v1:${value.length}:${(first >>> 0).toString(16)}:${(second >>> 0).toString(16)}`;
}

/** The evidence store can be unchanged even when the primary report changes. */
export function profileSourceChanged(profile:LocalHealthProfile,workspace:MunicipalityWorkspace):boolean {
 const report = excludeHistoricalSources(workspace).healthReport;
 if (profile.healthReportDocumentId !== report?.linkedDocumentId) return true;
 if (profile.healthReportFingerprint !== undefined) {
  return profile.healthReportFingerprint !== healthReportFingerprint(report);
 }
 // Legacy profiles have no content snapshot: do not fabricate one retroactively.
 const validatedAt = Date.parse(profile.validatedAt ?? '');
 const updatedAt = Date.parse(report?.updatedAt ?? '');
 return Number.isFinite(validatedAt) && Number.isFinite(updatedAt) && updatedAt > validatedAt;
}
