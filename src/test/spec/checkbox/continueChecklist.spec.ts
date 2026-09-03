import * as assert from 'assert';
import * as vscode from 'vscode';
import {
  onEnterKey,
  onShiftTabKey,
  onTabKey,
} from '../../../continueChecklist';
import { getEditor } from '../../../helpers';
import { setSettingsToDefault } from '../defaultSettings';

const setCursor = (line: number, character: number) => {
  const editor = getEditor();
  const position = new vscode.Position(line, character);
  editor.selection = new vscode.Selection(position, position);
};

describe('continue checklists', () => {
  beforeEach(async () => {
    await setSettingsToDefault();
  });

  it('should continue a checkbox line with text on the next line at the same indent', async () => {
    const newDocument = await vscode.workspace.openTextDocument({
      content: '  - [ ] this is a text',
      language: 'markdown',
    });
    await vscode.window.showTextDocument(newDocument);
    setCursor(0, 23);

    await onEnterKey();

    const content = getEditor().document.getText();
    assert.strictEqual(content, '  - [ ] this is a text\n  - [ ] ');

    const cursor = getEditor().selection.active;
    assert.strictEqual(cursor.line, 1);
    assert.strictEqual(cursor.character, '  - [ ] '.length);
  });

  it('should split the line at the cursor when continuing a checkbox', async () => {
    const newDocument = await vscode.workspace.openTextDocument({
      content: '- [ ] first second',
      language: 'markdown',
    });
    await vscode.window.showTextDocument(newDocument);
    setCursor(0, '- [ ] first'.length);

    await onEnterKey();

    const content = getEditor().document.getText();
    assert.strictEqual(content, '- [ ] first\n- [ ] second');
  });

  it('should remove one level of indent from an indented empty checkbox on enter, then remove it entirely on the next enter', async () => {
    const newDocument = await vscode.workspace.openTextDocument({
      content: '    - [ ] ',
      language: 'markdown',
    });
    await vscode.window.showTextDocument(newDocument);
    setCursor(0, 11);

    await onEnterKey();

    let content = getEditor().document.getText();
    assert.strictEqual(content, '- [ ] ');

    setCursor(0, content.length);
    await onEnterKey();

    content = getEditor().document.getText();
    assert.strictEqual(content, '\n');
  });

  it('should remove an empty un-indented checkbox and move to the next line on enter', async () => {
    const newDocument = await vscode.workspace.openTextDocument({
      content: '- [ ] ',
      language: 'markdown',
    });
    await vscode.window.showTextDocument(newDocument);
    setCursor(0, 6);

    await onEnterKey();

    const content = getEditor().document.getText();
    assert.strictEqual(content, '\n');
  });

  it('should continue a plain bullet list on the next line at the same indent', async () => {
    const newDocument = await vscode.workspace.openTextDocument({
      content: '  - this is a text',
      language: 'markdown',
    });
    await vscode.window.showTextDocument(newDocument);
    setCursor(0, 19);

    await onEnterKey();

    const content = getEditor().document.getText();
    assert.strictEqual(content, '  - this is a text\n  - ');
  });

  it('should continue a numbered list on the next line, incrementing the number', async () => {
    const newDocument = await vscode.workspace.openTextDocument({
      content: '1. this is a text',
      language: 'markdown',
    });
    await vscode.window.showTextDocument(newDocument);
    setCursor(0, 18);

    await onEnterKey();

    const content = getEditor().document.getText();
    assert.strictEqual(content, '1. this is a text\n2. ');
  });

  it('should remove an empty un-indented bullet and move to the next line on enter', async () => {
    const newDocument = await vscode.workspace.openTextDocument({
      content: '- ',
      language: 'markdown',
    });
    await vscode.window.showTextDocument(newDocument);
    setCursor(0, 2);

    await onEnterKey();

    const content = getEditor().document.getText();
    assert.strictEqual(content, '\n');
  });

  it('should fall back to default enter behavior on a non-checklist line', async () => {
    const newDocument = await vscode.workspace.openTextDocument({
      content: 'this is a text',
      language: 'markdown',
    });
    await vscode.window.showTextDocument(newDocument);
    setCursor(0, 14);

    await onEnterKey();

    const content = getEditor().document.getText();
    assert.strictEqual(content, 'this is a text\n');
  });

  it('should indent an empty checkbox line with tab', async () => {
    const newDocument = await vscode.workspace.openTextDocument({
      content: '- [ ] ',
      language: 'markdown',
    });
    await vscode.window.showTextDocument(newDocument);
    setCursor(0, 6);

    await onTabKey();

    const content = getEditor().document.getText();
    assert.strictEqual(
      content.startsWith('    - [ ]') || content.startsWith('\t- [ ]'),
      true
    );
  });

  it('should de-indent an empty checkbox line with shift+tab', async () => {
    const newDocument = await vscode.workspace.openTextDocument({
      content: '    - [ ] ',
      language: 'markdown',
    });
    await vscode.window.showTextDocument(newDocument);
    setCursor(0, 10);

    await onShiftTabKey();

    const content = getEditor().document.getText();
    assert.strictEqual(content, '- [ ] ');
  });

  it('should indent an empty bullet line with tab', async () => {
    const newDocument = await vscode.workspace.openTextDocument({
      content: '- ',
      language: 'markdown',
    });
    await vscode.window.showTextDocument(newDocument);
    setCursor(0, 2);

    await onTabKey();

    const content = getEditor().document.getText();
    assert.strictEqual(
      content.startsWith('    - ') || content.startsWith('\t- '),
      true
    );
  });

  it('should de-indent an empty bullet line with shift+tab', async () => {
    const newDocument = await vscode.workspace.openTextDocument({
      content: '    - ',
      language: 'markdown',
    });
    await vscode.window.showTextDocument(newDocument);
    setCursor(0, 6);

    await onShiftTabKey();

    const content = getEditor().document.getText();
    assert.strictEqual(content, '- ');
  });
});
