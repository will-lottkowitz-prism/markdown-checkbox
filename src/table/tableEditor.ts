import * as vscode from 'vscode';
import { Position, Range, Selection, TextDocument } from 'vscode';
import * as helpers from '../helpers';
import {
  findAllTables,
  formatTable,
  ParsedTable,
  parseTableAt,
} from './tableFormatter';

const documentLines = (doc: TextDocument): string[] => {
  const lines: string[] = [];
  for (let i = 0; i < doc.lineCount; i++) {
    lines.push(doc.lineAt(i).text);
  }
  return lines;
};

const tableRange = (doc: TextDocument, table: ParsedTable): Range =>
  new Range(
    table.startLine,
    0,
    table.endLine,
    doc.lineAt(table.endLine).text.length
  );

/** Reformat the table under the caret. No-op when the caret is not in a table. */
export const formatTableAtCursor = async (): Promise<boolean> => {
  const editor = helpers.getEditor();
  const lines = documentLines(editor.document);
  const table = parseTableAt(lines, editor.selection.active.line);
  if (!table) {
    return false;
  }

  const formatted = formatTable(table).join('\n');
  await editor.edit((b) =>
    b.replace(tableRange(editor.document, table), formatted)
  );
  return true;
};

/** Reformat every table in the document in a single edit. */
export const formatAllTables = async (): Promise<number> => {
  const editor = helpers.getEditor();
  const tables = findAllTables(documentLines(editor.document));
  if (tables.length === 0) {
    return 0;
  }

  await editor.edit((b) => {
    for (const table of tables) {
      b.replace(
        tableRange(editor.document, table),
        formatTable(table).join('\n')
      );
    }
  });
  return tables.length;
};

/** Column index the caret sits in, based on the pipe count before it. */
const columnAtCharacter = (lineText: string, character: number): number => {
  let pipes = 0;
  for (let i = 0; i < character && i < lineText.length; i++) {
    const ch = lineText[i];
    if (ch === '\\') {
      i++;
      continue;
    }
    if (ch === '`') {
      const end = lineText.indexOf('`', i + 1);
      if (end !== -1 && end < character) {
        i = end;
        continue;
      }
    }
    if (ch === '|') {
      pipes++;
    }
  }
  const hasLeadingPipe = /^\s*\|/.test(lineText);
  return Math.max(0, hasLeadingPipe ? pipes - 1 : pipes);
};

/**
 * Character span `[start, end)` of the `col`-th cell's padded content in a
 * rendered row - i.e. the text between its surrounding pipes. Works in UTF-16
 * units (so it stays correct with wide characters) and skips `\|` / code spans.
 */
const renderedCellSpan = (lineText: string, col: number): [number, number] => {
  const hasLeadingPipe = /^\s*\|/.test(lineText);
  let cellIdx = hasLeadingPipe ? -1 : 0;
  let cellStart = 0;

  for (let i = 0; i < lineText.length; i++) {
    const ch = lineText[i];
    if (ch === '\\') {
      i++;
      continue;
    }
    if (ch === '`') {
      const end = lineText.indexOf('`', i + 1);
      if (end !== -1) {
        i = end;
        continue;
      }
    }
    if (ch === '|') {
      if (cellIdx === col) {
        return [cellStart, i];
      }
      cellIdx++;
      cellStart = i + 1;
    }
  }
  return [cellStart, lineText.length];
};

const rectangular = (rows: string[][], columns: number): string[][] =>
  rows.map((row) => {
    const copy = row.slice(0, columns);
    while (copy.length < columns) {
      copy.push('');
    }
    return copy;
  });

/**
 * Move the caret to the next (`direction === 1`) or previous (`direction === -1`)
 * table cell, reformatting the table as it goes. Tab past the last cell appends
 * a new empty row. Returns false when the caret is not in a table, or is already
 * at the very first cell on a Shift+Tab - so the caller can fall back.
 */
export const moveCell = async (direction: 1 | -1): Promise<boolean> => {
  const editor = helpers.getEditor();
  const doc = editor.document;
  const lines = documentLines(doc);
  const caret = editor.selection.active;

  const table = parseTableAt(lines, caret.line);
  if (!table) {
    return false;
  }

  const columns = table.aligns.length;
  const delimLine = table.startLine + 1;

  let rowIdx: number;
  if (caret.line <= table.startLine) {
    rowIdx = 0;
  } else if (caret.line === delimLine) {
    rowIdx = 0;
  } else {
    rowIdx = caret.line - delimLine;
  }

  const colIdx = Math.min(
    columns - 1,
    columnAtCharacter(lines[caret.line], caret.character)
  );

  const rows = rectangular(table.rows, columns);

  let targetRow = rowIdx;
  let targetCol = colIdx + direction;

  if (direction === 1) {
    if (targetCol >= columns) {
      targetRow = rowIdx + 1;
      targetCol = 0;
    }
    if (targetRow >= rows.length) {
      rows.push(new Array(columns).fill(''));
      targetRow = rows.length - 1;
      targetCol = 0;
    }
  } else {
    if (targetCol < 0) {
      targetRow = rowIdx - 1;
      targetCol = columns - 1;
      if (targetRow < 0) {
        return false;
      }
    }
  }

  const formatted = formatTable({ ...table, rows });

  await editor.edit((b) =>
    b.replace(tableRange(doc, table), formatted.join('\n'))
  );

  const renderedRow = targetRow === 0 ? 0 : targetRow + 1;
  const renderedLineNo = table.startLine + renderedRow;
  const renderedText = formatted[renderedRow];

  const [spanStart, spanEnd] = renderedCellSpan(renderedText, targetCol);
  const raw = renderedText.slice(spanStart, spanEnd);
  const content = raw.trim();

  if (content.length === 0) {
    // land on the single pad space so the next keystroke fills the cell
    const p = new Position(renderedLineNo, Math.min(spanStart + 1, spanEnd));
    editor.selection = new Selection(p, p);
  } else {
    const leading = raw.length - raw.trimStart().length;
    editor.selection = new Selection(
      new Position(renderedLineNo, spanStart + leading),
      new Position(renderedLineNo, spanStart + leading + content.length)
    );
  }
  editor.revealRange(new Range(renderedLineNo, 0, renderedLineNo, 0));
  return true;
};
