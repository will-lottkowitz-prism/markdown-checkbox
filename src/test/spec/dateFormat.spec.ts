import * as assert from 'assert';
import { formatDate } from '../../dateFormat';

describe('formatDate', () => {
  // 2026-03-07 09:05:03 local (a Saturday)
  const d = new Date(2026, 2, 7, 9, 5, 3);

  it('formats the default YYYY-MM-DD', () => {
    assert.strictEqual(formatDate(d, 'YYYY-MM-DD'), '2026-03-07');
  });

  it('handles day/month-first orders and separators', () => {
    assert.strictEqual(formatDate(d, 'DD/MM/YYYY'), '07/03/2026');
    assert.strictEqual(formatDate(d, 'D.M.YY'), '7.3.26');
  });

  it('handles time tokens', () => {
    assert.strictEqual(formatDate(d, 'HH:mm:ss'), '09:05:03');
    assert.strictEqual(formatDate(d, 'h:mm a'), '9:05 am');
    assert.strictEqual(
      formatDate(new Date(2026, 2, 7, 14, 0, 0), 'h:mm A'),
      '2:00 PM'
    );
  });

  it('handles names and ordinals', () => {
    assert.strictEqual(formatDate(d, 'ddd, MMM D'), 'Sat, Mar 7');
    assert.strictEqual(
      formatDate(d, 'dddd MMMM Do YYYY'),
      'Saturday March 7th 2026'
    );
    assert.strictEqual(formatDate(new Date(2026, 0, 21), 'Do'), '21st');
    assert.strictEqual(formatDate(new Date(2026, 0, 11), 'Do'), '11th');
  });

  it('passes [bracketed] text through literally', () => {
    assert.strictEqual(formatDate(d, '[on] YYYY-MM-DD'), 'on 2026-03-07');
  });
});
