import * as vscode from 'vscode';
import { reportError } from '../output';
import * as helpers from '../helpers';
import { toggleCheckbox } from '../toggleCheckbox';

export const markCheckboxCommand = vscode.commands.registerCommand(
  'markdown-checkbox.markCheckbox',
  () => {
    if (!helpers.shouldActivate()) {
      return;
    }

    try {
      toggleCheckbox();
    } catch (error) {
      reportError('markCheckbox', error);
    }
  }
);
