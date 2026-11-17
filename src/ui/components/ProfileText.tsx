import type { ReactNode } from 'react';
import { profileTextBlocks } from '../../application/health-profile/profileTextBlocks';
import './ProfileText.css';

/** Cifra, año, periodo, intervalo o raya: se lee entero, sin partirse entre líneas. */
const VALUE_CELL = /^[\s\d.,:;%+\-–—/()]+$/;

export function ProfileText({ paragraphs, className, renderText = text => text, withTables = true }: {
  paragraphs: string[]; className?: string; renderText?: (text:string)=>ReactNode;
  /** false: solo el texto; las tablas del documento de origen se omiten (p. ej. cuando otra tabla ya las contiene). */
  withTables?: boolean;
}) {
  return <>{profileTextBlocks(paragraphs).filter(block => withTables || block.kind === 'paragraph').map((block,i) => block.kind === 'paragraph'
    ? <p className={className} key={i}>{renderText(block.text)}</p>
    : <div className="profile-text-table" key={i}><table aria-label="Tabla del documento de origen">
      <thead><tr>{block.rows[0].map((cell,j)=><th scope="col" key={j} className={VALUE_CELL.test(cell.trim())?'profile-text-table__label-value':undefined}>{renderText(cell)}</th>)}</tr></thead>
      <tbody>{block.rows.slice(1).map((row,k)=><tr key={k}>{row.map((cell,j)=><td key={j} data-label={j>0?block.rows[0][j]:undefined} className={VALUE_CELL.test(cell.trim())?(j>0?'profile-text-table__value':'profile-text-table__label-value'):undefined}>{renderText(cell)}</td>)}</tr>)}</tbody>
    </table></div>)}</>;
}
