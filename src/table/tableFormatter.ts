/**
 * Pure GFM-table parsing and formatting - no VS Code API, so it is unit-testable
 * on its own. Ported down to just the pieces this extension needs from a full
 * Markdown table plugin: locate the table under the caret, pad every column to a
 * common width, honor per-column alignment from the delimiter row.
 */

export type Align = 'none' | 'left' | 'right' | 'center';

export interface ParsedTable {
  /** 0-based line index of the header row. */
  startLine: number;
  /** 0-based line index of the last body row (inclusive). */
  endLine: number;
  /** Leading whitespace shared by the rendered rows (taken from the header). */
  indent: string;
  /** Header + body rows as trimmed cell arrays (the delimiter row is not kept). */
  rows: string[][];
  aligns: Align[];
}

/** Display width, counting common East-Asian wide / fullwidth code points as 2. */
export const stringWidth = (str: string): number => {
  let width = 0;
  for (const ch of str) {
    const c = ch.codePointAt(0) as number;
    const wide =
      (c >= 0x1100 && c <= 0x115f) ||
      (c >= 0x2e80 && c <= 0x303e) ||
      (c >= 0x3041 && c <= 0x33ff) ||
      (c >= 0x3400 && c <= 0x4dbf) ||
      (c >= 0x4e00 && c <= 0x9fff) ||
      (c >= 0xa000 && c <= 0xa4cf) ||
      (c >= 0xac00 && c <= 0xd7a3) ||
      (c >= 0xf900 && c <= 0xfaff) ||
      (c >= 0xfe30 && c <= 0xfe4f) ||
      (c >= 0xff00 && c <= 0xff60) ||
      (c >= 0xffe0 && c <= 0xffe6) ||
      (c >= 0x20000 && c <= 0x3fffd);
    width += wide ? 2 : 1;
  }
  return width;
};

const containsPipe = (line: string): boolean => line.indexOf('|') !== -1;

const isRowLine = (line: string): boolean =>
  containsPipe(line) && line.trim().length > 0;

/** Split a table row into trimmed cells, respecting `\|` escapes and code spans. */
export const splitCells = (line: string): string[] => {
  const text = line.trim();
  const cells: string[] = [];
  let cur = '';

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (ch === '\\' && i + 1 < text.length) {
      cur += ch + text[i + 1];
      i++;
      continue;
    }

    if (ch === '`') {
      const end = text.indexOf('`', i + 1);
      if (end !== -1) {
        cur += text.slice(i, end + 1);
        i = end;
        continue;
      }
    }

    if (ch === '|') {
      cells.push(cur);
      cur = '';
      continue;
    }

    cur += ch;
  }
  cells.push(cur);

  if (cells.length > 1 && cells[0].trim() === '') {
    cells.shift();
  }
  if (cells.length > 1 && cells[cells.length - 1].trim() === '') {
    cells.pop();
  }

  return cells.map((c) => c.trim());
};

const delimiterCell = /^:?-+:?$/;

/** True when every cell of the row is a `---` / `:--` / `--:` / `:-:` marker. */
export const isDelimiterRow = (cells: string[]): boolean =>
  cells.length > 0 && cells.every((c) => delimiterCell.test(c));

const alignOf = (cell: string): Align => {
  const left = cell.startsWith(':');
  const right = cell.endsWith(':');
  if (left && right) {
    return 'center';
  }
  if (right) {
    return 'right';
  }
  if (left) {
    return 'left';
  }
  return 'none';
};

/**
 * Find the table that contains (or immediately surrounds) `anchor`. Returns
 * undefined when the anchor is not part of a well-formed table - a table needs a
 * header row whose next line is a delimiter row.
 */
export const parseTableAt = (
  lines: string[],
  anchor: number
): ParsedTable | undefined => {
  if (anchor < 0 || anchor >= lines.length || !isRowLine(lines[anchor])) {
    return undefined;
  }

  let start = anchor;
  while (start > 0 && isRowLine(lines[start - 1])) {
    start--;
  }
  let end = anchor;
  while (end < lines.length - 1 && isRowLine(lines[end + 1])) {
    end++;
  }

  let delim = -1;
  for (let i = start + 1; i <= end; i++) {
    if (isDelimiterRow(splitCells(lines[i]))) {
      delim = i;
      break;
    }
  }
  if (delim === -1) {
    return undefined;
  }

  const headerLine = delim - 1;
  const bodyStart = delim + 1;
  const indent = /^\s*/.exec(lines[headerLine])?.[0] ?? '';

  const rows: string[][] = [splitCells(lines[headerLine])];
  for (let i = bodyStart; i <= end; i++) {
    rows.push(splitCells(lines[i]));
  }

  const delimCells = splitCells(lines[delim]);
  const columns = Math.max(delimCells.length, ...rows.map((r) => r.length));

  const aligns: Align[] = [];
  for (let c = 0; c < columns; c++) {
    aligns.push(c < delimCells.length ? alignOf(delimCells[c]) : 'none');
  }

  return { startLine: headerLine, endLine: end, indent, rows, aligns };
};

const pad = (content: string, width: number, align: Align): string => {
  const deficit = Math.max(0, width - stringWidth(content));
  if (deficit === 0) {
    return content;
  }
  if (align === 'right') {
    return ' '.repeat(deficit) + content;
  }
  if (align === 'center') {
    const leftPad = Math.floor(deficit / 2);
    return ' '.repeat(leftPad) + content + ' '.repeat(deficit - leftPad);
  }
  return content + ' '.repeat(deficit);
};

const delimiterFor = (width: number, align: Align): string => {
  const w = Math.max(3, width);
  switch (align) {
    case 'left':
      return ':' + '-'.repeat(w - 1);
    case 'right':
      return '-'.repeat(w - 1) + ':';
    case 'center':
      return ':' + '-'.repeat(w - 2) + ':';
    default:
      return '-'.repeat(w);
  }
};

/** Column widths used by {@link formatTable} - max cell width per column, min 3. */
export const columnWidths = (table: ParsedTable): number[] => {
  const columns = table.aligns.length;
  const widths: number[] = [];
  for (let c = 0; c < columns; c++) {
    let max = 3;
    for (const row of table.rows) {
      max = Math.max(max, stringWidth(row[c] ?? ''));
    }
    widths.push(max);
  }
  return widths;
};

/** Render a parsed table back to aligned Markdown lines. */
export const formatTable = (table: ParsedTable): string[] => {
  const columns = table.aligns.length;
  const widths = columnWidths(table);

  const renderRow = (cells: string[]): string => {
    const out: string[] = [];
    for (let c = 0; c < columns; c++) {
      out.push(pad(cells[c] ?? '', widths[c], table.aligns[c]));
    }
    return `${table.indent}| ${out.join(' | ')} |`;
  };

  const header = renderRow(table.rows[0]);
  const delimiter = `${table.indent}| ${table.aligns
    .map((a, c) => delimiterFor(widths[c], a))
    .join(' | ')} |`;
  const body = table.rows.slice(1).map(renderRow);

  return [header, delimiter, ...body];
};

/** Locate every well-formed table in the document. */
export const findAllTables = (lines: string[]): ParsedTable[] => {
  const tables: ParsedTable[] = [];
  let i = 0;

  while (i < lines.length - 1) {
    const headerIsFresh =
      i === 0 || lines[i - 1].trim() === '' || !containsPipe(lines[i - 1]);

    if (
      headerIsFresh &&
      isRowLine(lines[i]) &&
      isRowLine(lines[i + 1]) &&
      isDelimiterRow(splitCells(lines[i + 1]))
    ) {
      const table = parseTableAt(lines, i);
      if (table) {
        tables.push(table);
        i = table.endLine + 1;
        continue;
      }
    }
    i++;
  }

  return tables;
};
