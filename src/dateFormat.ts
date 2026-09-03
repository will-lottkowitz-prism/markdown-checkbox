/**
 * Minimal date formatter covering the moment.js tokens people actually put in
 * `markdown-checkbox.dateFormat`. Replaces the `moment` dependency (~230 KB for
 * a single `.format()` call). `[literal text]` is passed through unchanged, as
 * in moment.
 */

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const days = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const tokenRe =
  /\[([^\]]*)\]|YYYY|YY|MMMM|MMM|MM|M|DD|Do|D|dddd|ddd|HH|H|hh|h|mm|m|ss|s|A|a/g;

export const formatDate = (date: Date, pattern: string): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const h24 = date.getHours();
  const h12 = h24 % 12 || 12;
  const day = date.getDate();

  const tokens: Record<string, string> = {
    YYYY: String(date.getFullYear()),
    YY: pad(date.getFullYear() % 100),
    MMMM: months[date.getMonth()],
    MMM: months[date.getMonth()].slice(0, 3),
    MM: pad(date.getMonth() + 1),
    M: String(date.getMonth() + 1),
    DD: pad(day),
    Do: `${day}${ordinal(day)}`,
    D: String(day),
    dddd: days[date.getDay()],
    ddd: days[date.getDay()].slice(0, 3),
    HH: pad(h24),
    H: String(h24),
    hh: pad(h12),
    h: String(h12),
    mm: pad(date.getMinutes()),
    m: String(date.getMinutes()),
    ss: pad(date.getSeconds()),
    s: String(date.getSeconds()),
    A: h24 < 12 ? 'AM' : 'PM',
    a: h24 < 12 ? 'am' : 'pm',
  };

  return pattern.replace(tokenRe, (token, literal) =>
    literal !== undefined ? literal : tokens[token]
  );
};

const ordinal = (n: number): string => {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) {
    return 'th';
  }
  switch (n % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
};
