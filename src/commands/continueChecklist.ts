import * as vscode from 'vscode';
import { onEnterKey, onShiftTabKey, onTabKey } from '../continueChecklist';
import * as helpers from '../helpers';
import { logError } from '../output';

export const onEnterKeyCommand = vscode.commands.registerCommand(
  'markdown-checkbox.onEnterKey',
  () => {
    if (!helpers.shouldActivate()) {
      return vscode.commands.executeCommand('default:type', { text: '\n' });
    }

    try {
      return onEnterKey();
    } catch (error) {
      logError('onEnterKey', error);
    }
  }
);

export const onTabKeyCommand = vscode.commands.registerCommand(
  'markdown-checkbox.onTabKey',
  () => {
    if (!helpers.shouldActivate()) {
      return vscode.commands.executeCommand('tab');
    }

    try {
      return onTabKey();
    } catch (error) {
      logError('onTabKey', error);
    }
  }
);

export const onShiftTabKeyCommand = vscode.commands.registerCommand(
  'markdown-checkbox.onShiftTabKey',
  () => {
    if (!helpers.shouldActivate()) {
      return vscode.commands.executeCommand('outdent');
    }

    try {
      return onShiftTabKey();
    } catch (error) {
      logError('onShiftTabKey', error);
    }
  }
);
