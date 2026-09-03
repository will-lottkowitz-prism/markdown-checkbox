import * as vscode from 'vscode';

let channel: vscode.OutputChannel | undefined;

/** The shared "Markdown Checkbox" output channel (created on first use). */
export const getOutputChannel = (): vscode.OutputChannel => {
  if (!channel) {
    channel = vscode.window.createOutputChannel('Markdown Checkbox');
  }
  return channel;
};

/** Dispose the output channel if it was created (call from `deactivate`). */
export const disposeOutput = (): void => {
  channel?.dispose();
  channel = undefined;
};

/** Append an error's stack to the output channel (no user-facing popup). Used
 * for keystroke handlers, where a toast on every failed key press would be
 * worse than the failure. Replaces the old `console.log(error)`. */
export const logError = (where: string, error: unknown): void => {
  const detail =
    error instanceof Error ? error.stack ?? error.message : String(error);
  getOutputChannel().appendLine(
    `[${new Date().toISOString()}] ${where}: ${detail}`
  );
};

/**
 * Report an unexpected failure from an explicit command: log the stack and show
 * a short error toast with a button that opens the channel.
 */
export const reportError = (where: string, error: unknown): void => {
  logError(where, error);
  const summary = error instanceof Error ? error.message : String(error);
  vscode.window
    .showErrorMessage(
      `Markdown Checkbox: ${where} failed - ${summary}`,
      'Show Log'
    )
    .then((choice) => {
      if (choice === 'Show Log') {
        getOutputChannel().show(true);
      }
    });
};
