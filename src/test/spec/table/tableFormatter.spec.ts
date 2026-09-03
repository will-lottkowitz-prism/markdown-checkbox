import * as assert from 'assert';
import {
  findAllTables,
  formatTable,
  parseTableAt,
  splitCells,
  stringWidth,
} from '../../../table/tableFormatter';

const lines = (s: string) => s.split('\n');

describe('table formatter', () => {
  it('splits rows with and without outer pipes', () => {
    assert.deepStrictEqual(splitCells('| a | b | c |'), ['a', 'b', 'c']);
    assert.deepStrictEqual(splitCells('a | b | c'), ['a', 'b', 'c']);
    assert.deepStrictEqual(splitCells('| a \\| b | c |'), ['a \\| b', 'c']);
    assert.deepStrictEqual(splitCells('| `x | y` | z |'), ['`x | y`', 'z']);
  });

  it('counts wide characters as width 2', () => {
    assert.strictEqual(stringWidth('abc'), 3);
    assert.strictEqual(stringWidth('日本'), 4);
  });

  it('pads columns to a common width and keeps alignment', () => {
    const table = parseTableAt(
      lines(
        [
          '| Name | Qty | Note |',
          '|:--|--:|:-:|',
          '| a | 1 | x |',
          '| longer | 200 | yy |',
        ].join('\n')
      ),
      0
    );
    assert.ok(table);
    assert.deepStrictEqual(formatTable(table as any), [
      '| Name   | Qty | Note |',
      '| :----- | --: | :--: |',
      '| a      |   1 |  x   |',
      '| longer | 200 |  yy  |',
    ]);
  });

  it('pads short body rows out to the column count', () => {
    const table = parseTableAt(
      lines(['| a | b | c |', '| - | - | - |', '| 1 | 2 |'].join('\n')),
      2
    );
    assert.ok(table);
    const out = formatTable(table as any);
    assert.strictEqual(out[2], '| 1   | 2   |     |');
  });

  it('detects the table under the cursor even from a trailing body row', () => {
    const doc = lines(
      [
        'intro paragraph',
        '',
        '| h1 | h2 |',
        '| -- | -- |',
        '| 1  | 2  |',
        '| 3  | 4  |',
        '',
        'after',
      ].join('\n')
    );
    const table = parseTableAt(doc, 5);
    assert.ok(table);
    assert.strictEqual((table as any).startLine, 2);
    assert.strictEqual((table as any).endLine, 5);
  });

  it('does not treat a pipe paragraph as a table', () => {
    assert.strictEqual(parseTableAt(lines('a | b | c'), 0), undefined);
  });

  it('finds every table in a document', () => {
    const doc = lines(
      [
        '# Doc',
        '',
        '| a | b |',
        '| - | - |',
        '| 1 | 2 |',
        '',
        'text',
        '',
        '| x | y |',
        '| - | - |',
        '| 9 | 8 |',
      ].join('\n')
    );
    assert.strictEqual(findAllTables(doc).length, 2);
  });
});
