import * as assert from 'assert';
import * as vscode from 'vscode';
import { getEditor } from '../../../helpers';
import {
  formatAllTables,
  formatTableAtCursor,
  moveCell,
} from '../../../table/tableEditor';
import { setSettingsToDefault } from '../defaultSettings';

const openMarkdown = async (content: string) => {
  const doc = await vscode.workspace.openTextDocument({
    content,
    language: 'markdown',
  });
  await vscode.window.showTextDocument(doc);
};

const setCursor = (line: number, character: number) => {
  const editor = getEditor();
  const position = new vscode.Position(line, character);
  editor.selection = new vscode.Selection(position, position);
};

describe('table cell navigation', () => {
  beforeEach(async () => {
    await setSettingsToDefault();
  });

  it('formats the table under the cursor', async () => {
    await openMarkdown(['|a|b|', '|-|-|', '|1|2|'].join('\n'));
    setCursor(2, 1);

    const done = await formatTableAtCursor();

    assert.strictEqual(done, true);
    assert.strictEqual(
      getEditor().document.getText(),
      ['| a   | b   |', '| --- | --- |', '| 1   | 2   |'].join('\n')
    );
  });

  it('returns false when the cursor is not in a table', async () => {
    await openMarkdown('just a paragraph');
    setCursor(0, 3);

    assert.strictEqual(await formatTableAtCursor(), false);
  });

  it('moves to the next cell on Tab and formats the table', async () => {
    await openMarkdown(['| a | b |', '| - | - |', '| 1 | 2 |'].join('\n'));
    setCursor(2, 2);

    const moved = await moveCell(1);

    assert.strictEqual(moved, true);
    const selection = getEditor().selection;
    assert.strictEqual(selection.active.line, 2);
    // caret parked on the second body cell ("2")
    assert.strictEqual(getEditor().document.getText(selection), '2');
  });

  it('adds a new row when tabbing past the last cell', async () => {
    await openMarkdown(['| a | b |', '| - | - |', '| 1 | 2 |'].join('\n'));
    setCursor(2, 6); // last cell of last row

    await moveCell(1);

    const linesOut = getEditor().document.getText().split('\n');
    assert.strictEqual(linesOut.length, 4);
    assert.strictEqual(linesOut[3], '|     |     |');
    assert.strictEqual(getEditor().selection.active.line, 3);
  });

  it('moves to the previous cell on Shift+Tab', async () => {
    await openMarkdown(['| a | b |', '| - | - |', '| 1 | 2 |'].join('\n'));
    setCursor(2, 6);

    const moved = await moveCell(-1);

    assert.strictEqual(moved, true);
    assert.strictEqual(
      getEditor().document.getText(getEditor().selection),
      '1'
    );
  });

  it('returns false from Shift+Tab at the very first cell', async () => {
    await openMarkdown(['| a | b |', '| - | - |', '| 1 | 2 |'].join('\n'));
    setCursor(0, 2);

    assert.strictEqual(await moveCell(-1), false);
  });

  it('formats every table in the document', async () => {
    await openMarkdown(
      [
        '|a|b|',
        '|-|-|',
        '|1|2|',
        '',
        'text',
        '',
        '|x|y|',
        '|-|-|',
        '|9|8|',
      ].join('\n')
    );
    setCursor(0, 0);

    const count = await formatAllTables();

    assert.strictEqual(count, 2);
    const text = getEditor().document.getText();
    assert.ok(text.includes('| a   | b   |'));
    assert.ok(text.includes('| x   | y   |'));
  });
});
