import * as vscode from 'vscode';
import { CheckboxStatus, CheckboxStatusController } from './checkboxStatus';
import { createCheckboxCommand } from './commands/createCheckbox';
import {
  onEnterKeyCommand,
  onShiftTabKeyCommand,
  onTabKeyCommand,
} from './commands/continueChecklist';
import { markCheckboxCommand } from './commands/markCheckbox';
import { showQuickPickCommand } from './commands/quickPick';
import { onPasteCommand } from './commands/smartPaste';
import { formatAllTablesCommand, formatTableCommand } from './commands/table';
import { disposeOutput } from './output';
import { initSelfUpdate } from './selfUpdate';

export const activate = (context: vscode.ExtensionContext) => {
  // item in the status bar to show checkbox information
  const checkboxStatus = new CheckboxStatus();
  const controller = new CheckboxStatusController(checkboxStatus);

  // subscribe to changes to update the status bar
  context.subscriptions.push(checkboxStatus);
  context.subscriptions.push(controller);

  context.subscriptions.push(
    markCheckboxCommand,
    createCheckboxCommand,
    showQuickPickCommand,
    onEnterKeyCommand,
    onTabKeyCommand,
    onShiftTabKeyCommand,
    onPasteCommand,
    formatTableCommand,
    formatAllTablesCommand
  );

  initSelfUpdate(context, { configPrefix: 'markdown-checkbox' });
};

// this method is called when the extension is deactivated
export const deactivate = () => {
  disposeOutput();
};
