import * as vscode from 'vscode';
import { Position, Selection } from 'vscode';
import * as helpers from './helpers';
import { moveCell } from './table/tableEditor';

const tableNavigationEnabled = () =>
  helpers.getConfig<boolean>('tableCellNavigation');

/** Single-line selection (including an empty one) - safe for table cell nav. */
const isSingleLineSelection = (editor: vscode.TextEditor): boolean =>
  editor.selections.length === 1 &&
  editor.selection.start.line === editor.selection.end.line;

/**
 * Enter behavior on list lines (checkboxes, bullets [-, *, +] and numbered lists):
 * - list item with text -> continue the list on the next line at the same indent.
 * - empty list item that is indented -> remove one level of indent (like Shift+Tab), stay on the same line.
 * - empty list item that is not indented -> remove the marker entirely and move to the next line.
 * - anything else -> default Enter behavior.
 */
export const onEnterKey = async () => {
  const editor = helpers.getEditor();
  const selection = editor.selection;

  if (editor.selections.length > 1 || !selection.isEmpty) {
    return vscode.commands.executeCommand('default:type', { text: '\n' });
  }

  const line = editor.document.lineAt(selection.active.line);
  const parts = helpers.getListLineParts(line);

  if (!parts) {
    return vscode.commands.executeCommand('default:type', { text: '\n' });
  }

  if (parts.content.trim().length === 0) {
    if (parts.indent.length > 0) {
      return vscode.commands.executeCommand('editor.action.outdentLines');
    }

    await editor.edit((editBuilder) => {
      editBuilder.replace(line.range, parts.indent);
    });

    const endOfLine = new Position(line.lineNumber, parts.indent.length);
    editor.selection = new Selection(endOfLine, endOfLine);

    return vscode.commands.executeCommand('default:type', { text: '\n' });
  }

  const marker = helpers.getNextListLineMarker(parts);
  const insertText = `\n${parts.indent}${marker}`;

  await editor.edit((editBuilder) => {
    editBuilder.insert(selection.active, insertText);
  });

  const newPosition = new Position(
    selection.active.line + 1,
    parts.indent.length + marker.length
  );
  editor.selection = new Selection(newPosition, newPosition);
};

/**
 * Tab: move to the next table cell when in a table, otherwise indent an empty
 * list item, otherwise fall back to the default Tab behavior.
 */
export const onTabKey = async () => {
  const editor = helpers.getEditor();
  const selection = editor.selection;

  if (tableNavigationEnabled() && isSingleLineSelection(editor)) {
    if (await moveCell(1)) {
      return;
    }
  }

  if (editor.selections.length > 1 || !selection.isEmpty) {
    return vscode.commands.executeCommand('tab');
  }

  if (!helpers.getConfig<boolean>('continueChecklists')) {
    return vscode.commands.executeCommand('tab');
  }

  const line = editor.document.lineAt(selection.active.line);
  const parts = helpers.getListLineParts(line);

  if (!parts || parts.content.trim().length > 0) {
    return vscode.commands.executeCommand('tab');
  }

  return vscode.commands.executeCommand('editor.action.indentLines');
};

/**
 * Shift+Tab: move to the previous table cell when in a table, otherwise
 * de-indent an empty list item, otherwise fall back to the default behavior.
 */
export const onShiftTabKey = async () => {
  const editor = helpers.getEditor();
  const selection = editor.selection;

  if (tableNavigationEnabled() && isSingleLineSelection(editor)) {
    if (await moveCell(-1)) {
      return;
    }
  }

  if (editor.selections.length > 1 || !selection.isEmpty) {
    return vscode.commands.executeCommand('outdent');
  }

  if (!helpers.getConfig<boolean>('continueChecklists')) {
    return vscode.commands.executeCommand('outdent');
  }

  const line = editor.document.lineAt(selection.active.line);
  const parts = helpers.getListLineParts(line);

  if (!parts || parts.content.trim().length > 0) {
    return vscode.commands.executeCommand('outdent');
  }

  return vscode.commands.executeCommand('editor.action.outdentLines');
};
