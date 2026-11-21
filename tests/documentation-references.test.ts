import { describe, it, expect } from 'vitest';
import { resolveDocumentReference } from '../src/ui/components/documentReferenceResolver';
import seed from '../fixtures/workspaces/municipio-ensayo-synthetic-test.json';
import type { MunicipalDocument } from '../src/domain/repository';
const docs = seed.repository.documents as MunicipalDocument[];
describe('Document references', () => {
 it('does not substitute another file for an explicit missing ID', () => {
  expect(resolveDocumentReference(docs, {documentId:'missing',fileName:docs[0].sourceFileName})).toEqual([]);
 });
 it('preserves ambiguity instead of selecting an arbitrary original', () => {
  const original = docs.find(d => d.sourceFileName)!;
  expect(resolveDocumentReference([original,{...original,id:'duplicate'}],{fileName:original.sourceFileName})).toHaveLength(2);
 });
});
