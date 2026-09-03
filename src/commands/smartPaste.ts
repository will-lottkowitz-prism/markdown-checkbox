import * as vscode from 'vscode';
import { onPaste } from '../smartPaste';
import * as helpers from '../helpers';
import { logError } from '../output';

export const onPasteCommand = vscode.commands.registerCommand(
  'markdown-checkbox.onPaste',
  () => {
    if (!helpers.shouldActivate()) {
      return vscode.commands.executeCommand(
        'editor.action.clipboardPasteAction'
      );
    }

    try {
      return onPaste();
    } catch (error) {
      logError('onPaste', error);
      return vscode.commands.executeCommand(
        'editor.action.clipboardPasteAction'
      );
    }
  }
);
