import * as vscode from 'vscode';
import { Position, TextEditor, TextLine } from 'vscode';
import { Checkbox } from '../models/checkbox';

/** Get the current cursor position */
export const getCursorPosition = (): Position => {
  return getEditor().selection.active;
};

/** Get the active editor of VS Code */
export const getEditor = (): TextEditor => {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    return editor;
  } else {
    throw new Error('Could not load the VS Code editor instance.');
  }
};

/** Give the information if the line has already a bullet point */
export const lineHasBulletPointAlready = (
  line: TextLine
): { pos: number; bullet: boolean } => {
  const fstChar = line.firstNonWhitespaceCharacterIndex;

  switch (line.text.charAt(fstChar)) {
    case '*':
    case '+':
    case '-':
      return { pos: fstChar + 2, bullet: true };
    default:
      return { pos: fstChar, bullet: false };
  }
};

const checklistLineRegex = /^(\s*)((?:[*+-]\s+)?)\[([ xX])\]\s?(.*)$/;

export type ListLineKind = 'checkbox' | 'bullet' | 'ordered';

export interface ListLineParts {
  kind: ListLineKind;
  indent: string;
  /** The marker text (bullet/number + trailing separator) reproduced when continuing the list. */
  marker: string;
  content: string;
}

const bulletLineRegex = /^(\s*)([*+-])(\s+)(.*)$/;
const orderedLineRegex = /^(\s*)(\d+)([.)])(\s+)(.*)$/;

/**
 * Parse a line as a checkbox, bullet (-, *, +) or ordered (1., 1)) list item.
 * Returns undefined if the line does not match any of these list styles.
 */
export const getListLineParts = (line: TextLine): ListLineParts | undefined => {
  const checkboxMatch = checklistLineRegex.exec(line.text);
  if (checkboxMatch) {
    return {
      kind: 'checkbox',
      indent: checkboxMatch[1],
      marker: `${checkboxMatch[2]}[${checkboxMatch[3]}] `,
      content: checkboxMatch[4],
    };
  }

  const orderedMatch = orderedLineRegex.exec(line.text);
  if (orderedMatch) {
    return {
      kind: 'ordered',
      indent: orderedMatch[1],
      marker: `${orderedMatch[2]}${orderedMatch[3]} `,
      content: orderedMatch[5],
    };
  }

  const bulletMatch = bulletLineRegex.exec(line.text);
  if (bulletMatch) {
    return {
      kind: 'bullet',
      indent: bulletMatch[1],
      marker: `${bulletMatch[2]} `,
      content: bulletMatch[4],
    };
  }

  return undefined;
};

/** Build the marker to use for the next line when continuing a list, incrementing ordered list numbers. */
export const getNextListLineMarker = (parts: ListLineParts): string => {
  if (parts.kind === 'ordered') {
    const match = /^(\d+)([.)])\s+$/.exec(parts.marker);
    if (match) {
      const nextNumber = parseInt(match[1], 10) + 1;
      return `${nextNumber}${match[2]} `;
    }
  }

  if (parts.kind === 'checkbox') {
    const match = /^(.*)\[[ xX]\]\s?$/.exec(parts.marker);
    const bulletPrefix = match ? match[1] : '';
    return `${bulletPrefix}[ ] `;
  }

  return parts.marker;
};

/** Get the checkbox of a specific line */
export const getCheckboxOfLine = (line: TextLine): Checkbox | undefined => {
  const lineText = line.text.toString();
  const cbPosition = lineText.indexOf('[ ]');
  const cbPositionMarked = lineText.search(new RegExp(/\[.\]/));
  const plainText = getPlainLineText(lineText);

  if (cbPosition > -1 || cbPositionMarked > -1) {
    return {
      checked: cbPosition > -1 ? false : true,
      position: new Position(
        line.lineNumber,
        cbPosition > -1 ? cbPosition : cbPositionMarked
      ),
      text: plainText,
      lineNumber: line.lineNumber,
    };
  } else {
    return undefined;
  }
};

/** Get a list of all checkboxes in a document */
export const getAllCheckboxes = (): Checkbox[] => {
  const editor = getEditor();
  const lineCount = editor.document.lineCount;
  const result = [];

  for (let l = 0; l < lineCount; l++) {
    const line = editor.document.lineAt(l);
    const lhc = getCheckboxOfLine(line);
    if (lhc) {
      result.push(lhc);
    }
  }
  return result;
};

/** Get the plain text of a line without the checkbox. */
export const getPlainLineText = (text: string) => {
  return text.replace(/(\*|-|\+)\s\[(\s|x)]\s/gi, '');
};

/** Get the value of a workspace config property */
export const getConfig = <T>(config: string): T =>
  vscode.workspace.getConfiguration('markdown-checkbox').get<T>(config) as T;

/** Determine whether a given language ID of the configuration is valid to activate this extension. */
export const isActivationLanguageId = (languageId: string): boolean => {
  const config = getConfig<string | string[]>('languages');

  if (!config) {
    return languageId === 'markdown';
  }

  if (typeof config === 'string') {
    return config === languageId;
  }

  return config.indexOf(languageId) !== -1;
};

/** Follow all the rules to determine if we should activate a command */
export const shouldActivate = (): boolean => {
  const editor = getEditor();

  if (!editor) {
    return false;
  }

  return isActivationLanguageId(editor.document.languageId);
};

/** Get the current date as string. */
export const getDateString = (now: Date) => {
  const leadingZero = (n: number) => (n < 10 ? '0' + n : n);
  const year = now.getFullYear().toString();
  const month = leadingZero(now.getMonth() + 1);
  const date = leadingZero(now.getDate());
  return `${year}-${month}-${date}`;
};
