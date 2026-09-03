import * as vscode from 'vscode';
import { reportError } from '../output';
import { createCheckbox } from '../createCheckbox';
import * as helpers from '../helpers';

export const createCheckboxCommand = vscode.commands.registerCommand(
  'markdown-checkbox.createCheckbox',
  () => {
    if (!helpers.shouldActivate()) {
      return;
    }

    try {
      createCheckbox(helpers.getEditor());
    } catch (error) {
      reportError('createCheckbox', error);
    }
  }
);
