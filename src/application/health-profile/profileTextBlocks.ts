export type ProfileTextBlock =
  | { kind: 'paragraph'; text: string }
  | { kind: 'table'; rows: string[][] };

/** Presentation only: recognise consecutive, rectangular pipe-delimited rows.
 * Ambiguous single lines and ragged rows remain literal text. No figures are derived.
 */
export function profileTextBlocks(paragraphs: string[]): ProfileTextBlock[] {
  const lines = paragraphs.flatMap(p => p.includes('|') ? p.split('\n') : [p]);
  const blocks: ProfileTextBlock[] = [];
  const cells = (s: string) => {
    if (!s.includes(' | ')) return undefined;
    const row = s.trim().replace(/^\|\s*/, '').replace(/\s*\|$/, '').split(/\s*\|\s*/);
    return row.length > 1 ? row : undefined;
  };
  for (let i = 0; i < lines.length;) {
    const first = cells(lines[i]);
    if (!first) { blocks.push({kind:'paragraph',text:lines[i++]}); continue; }
    const rows = [first];
    let end = i + 1;
    while (end < lines.length) {
      const row = cells(lines[end]);
      if (!row || row.length !== first.length) break;
      rows.push(row); end++;
    }
    const dataRows = rows.filter(row => !row.every(c => /^:?-{3,}:?$/.test(c)));
    if (dataRows.length >= 2) { blocks.push({kind:'table',rows:dataRows}); i = end; }
    else blocks.push({kind:'paragraph',text:lines[i++]});
  }
  return blocks;
}
