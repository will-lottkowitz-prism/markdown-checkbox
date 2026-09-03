import * as vscode from 'vscode';
import { Position, Selection } from 'vscode';
import * as helpers from './helpers';
import { dedupePastedMarker } from './paste/pasteTransform';

const normalPaste = 'editor.action.clipboardPasteAction';

/** End position of `text` when inserted at `start`. */
const endOfInsert = (start: Position, text: string): Position => {
  const lines = text.split(/\r?\n/);
  if (lines.length === 1) {
    return new Position(start.line, start.character + text.length);
  }
  return new Position(
    start.line + lines.length - 1,
    lines[lines.length - 1].length
  );
};

/**
 * Paste handler that strips a duplicated leading list marker when the caret is
 * parked right after a bare marker. Any case it does not handle is delegated to
 * VS Code's built-in paste so behavior is otherwise identical.
 */
export const onPaste = async () => {
  if (!helpers.getConfig<boolean>('dedupePasteMarkers')) {
    return vscode.commands.executeCommand(normalPaste);
  }

  const editor = helpers.getEditor();
  const selection = editor.selection;

  if (editor.selections.length > 1 || !selection.isEmpty) {
    return vscode.commands.executeCommand(normalPaste);
  }

  const clipboard = await vscode.env.clipboard.readText();
  if (!clipboard) {
    return vscode.commands.executeCommand(normalPaste);
  }

  const caret = selection.active;
  const linePrefix = editor.document
    .lineAt(caret.line)
    .text.slice(0, caret.character);

  const toInsert = dedupePastedMarker(linePrefix, clipboard);
  if (toInsert === clipboard) {
    return vscode.commands.executeCommand(normalPaste);
  }

  await editor.edit((editBuilder) => editBuilder.insert(caret, toInsert));

  const end = endOfInsert(caret, toInsert);
  editor.selection = new Selection(end, end);
};
