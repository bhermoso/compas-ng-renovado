import type { EvidenceAtom } from '../../domain/evidence';
import type { AssetValidationDeclaration } from '../../domain/repository';

/**
 * Solo decisiones expresas de validación del equipo. Una misma denominación
 * no agrupa ni elimina activos, y las fichas no validadas no se computan.
 * El origen de la ficha se conserva en el átomo y la declaración en el repositorio.
 */
export function validatedAssetCounts(
 atoms: ReadonlyArray<EvidenceAtom>,
 declarations: ReadonlyArray<AssetValidationDeclaration> = [],
): {registered:number;validated:number;pending:number} {
 const records=atoms.filter(a=>a.kind==='asset' &&
  (a.provenance.origin==='localiza-salud'||a.provenance.origin==='community-assets'));
 const validated=records.filter(a=>declarations.some(v=>
  v.documentId===a.provenance.documentId &&
  (v.atomIds===undefined||v.atomIds.includes(a.id)))).length;
 return {registered:records.length,validated,pending:records.length-validated};
}
