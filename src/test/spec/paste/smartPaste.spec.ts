import * as assert from 'assert';
import * as vscode from 'vscode';
import { getEditor } from '../../../helpers';
import { onPaste } from '../../../smartPaste';
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

describe('smart paste', () => {
  beforeEach(async () => {
    await setSettingsToDefault();
  });

  it('does not double the dash when pasting a bullet after a bullet marker', async () => {
    await openMarkdown('- ');
    setCursor(0, 2);
    await vscode.env.clipboard.writeText('- pasted item');

    await onPaste();

    assert.strictEqual(getEditor().document.getText(), '- pasted item');
  });

  it('does not double the checkbox marker when pasting after "- [ ] "', async () => {
    await openMarkdown('- [ ] ');
    setCursor(0, '- [ ] '.length);
    await vscode.env.clipboard.writeText('- [ ] task\n- [ ] next');

    await onPaste();

    assert.strictEqual(
      getEditor().document.getText(),
      '- [ ] task\n- [ ] next'
    );
  });

  it('pastes normally when the caret is not after a bare marker', async () => {
    await openMarkdown('- existing');
    setCursor(0, '- existing'.length);
    await vscode.env.clipboard.writeText(' and more');

    await onPaste();

    assert.strictEqual(getEditor().document.getText(), '- existing and more');
  });
});
