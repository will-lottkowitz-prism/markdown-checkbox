import * as vscode from 'vscode';
import * as helpers from '../helpers';
import { reportError } from '../output';
import { formatAllTables, formatTableAtCursor } from '../table/tableEditor';

export const formatTableCommand = vscode.commands.registerCommand(
  'markdown-checkbox.formatTable',
  async () => {
    if (!helpers.shouldActivate()) {
      return;
    }

    try {
      const done = await formatTableAtCursor();
      if (!done) {
        vscode.window.setStatusBarMessage(
          'Markdown Checkbox: cursor is not inside a table.',
          2000
        );
      }
    } catch (error) {
      reportError('formatTable', error);
    }
  }
);

export const formatAllTablesCommand = vscode.commands.registerCommand(
  'markdown-checkbox.formatAllTables',
  async () => {
    if (!helpers.shouldActivate()) {
      return;
    }

    try {
      const count = await formatAllTables();
      vscode.window.setStatusBarMessage(
        count === 0
          ? 'Markdown Checkbox: no tables found.'
          : `Markdown Checkbox: formatted ${count} table${
              count === 1 ? '' : 's'
            }.`,
        2000
      );
    } catch (error) {
      reportError('formatAllTables', error);
    }
  }
);
