import * as assert from 'assert';
import {
  classifyLinePrefix,
  dedupePastedMarker,
} from '../../../paste/pasteTransform';

describe('paste marker de-duplication', () => {
  it('classifies bare list prefixes', () => {
    assert.strictEqual(classifyLinePrefix('- '), 'bullet');
    assert.strictEqual(classifyLinePrefix('  * '), 'bullet');
    assert.strictEqual(classifyLinePrefix('- [ ] '), 'checkbox');
    assert.strictEqual(classifyLinePrefix('    - [x] '), 'checkbox');
    assert.strictEqual(classifyLinePrefix('[ ] '), 'checkbox');
    assert.strictEqual(classifyLinePrefix('1. '), 'ordered');
    assert.strictEqual(classifyLinePrefix('- some text'), null);
    assert.strictEqual(classifyLinePrefix('plain'), null);
  });

  it('strips a duplicate bullet when pasting after a bullet', () => {
    assert.strictEqual(dedupePastedMarker('- ', '- buy milk'), 'buy milk');
    assert.strictEqual(dedupePastedMarker('  * ', '* nested'), 'nested');
  });

  it('strips a duplicate checkbox marker when pasting after a checkbox', () => {
    assert.strictEqual(dedupePastedMarker('- [ ] ', '- [ ] task'), 'task');
    assert.strictEqual(dedupePastedMarker('- [ ] ', '[x] done'), 'done');
  });

  it('keeps following lines intact', () => {
    assert.strictEqual(
      dedupePastedMarker('- [ ] ', '- [x] one\n- [ ] two'),
      'one\n- [ ] two'
    );
  });

  it('only strips the bullet (not the checkbox) when pasting a checkbox after a bullet', () => {
    assert.strictEqual(dedupePastedMarker('- ', '- [ ] task'), '[ ] task');
  });

  it('leaves text unchanged when nothing needs stripping', () => {
    const pasted = 'just some words';
    assert.strictEqual(dedupePastedMarker('- ', pasted), pasted);
    assert.strictEqual(dedupePastedMarker('- [ ] ', pasted), pasted);
    assert.strictEqual(dedupePastedMarker('not a marker', '- item'), '- item');
  });

  it('leaves an empty clipboard alone', () => {
    assert.strictEqual(dedupePastedMarker('- ', ''), '');
  });
});
