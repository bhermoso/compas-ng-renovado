import type { ReactNode } from 'react';
import { profileTextBlocks } from '../../application/health-profile/profileTextBlocks';
import './ProfileText.css';

export function ProfileText({ paragraphs, className, renderText = text => text }: {
  paragraphs: string[]; className?: string; renderText?: (text:string)=>ReactNode;
}) {
  return <>{profileTextBlocks(paragraphs).map((block,i) => block.kind === 'paragraph'
    ? <p className={className} key={i}>{renderText(block.text)}</p>
    : <div className="profile-text-table" key={i}><table aria-label="Tabla del documento de origen">
      <thead><tr>{block.rows[0].map((cell,j)=><th scope="col" key={j}>{renderText(cell)}</th>)}</tr></thead>
      <tbody>{block.rows.slice(1).map((row,k)=><tr key={k}>{row.map((cell,j)=><td key={j}>{renderText(cell)}</td>)}</tr>)}</tbody>
    </table></div>)}</>;
}
