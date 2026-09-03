/**
 * Pure helpers for the "don't double up the list marker on paste" behavior.
 *
 * When the cursor sits directly after a bare list marker (`- `, `* `, `1. `,
 * `- [ ] `, `[ ] ` ...) and the pasted text starts with its own list marker,
 * the leading marker of the pasted text's first line is stripped so the two
 * markers don't stack up (`- - foo`, `- [ ] - [ ] foo`).
 */

/** A checkbox marker, optionally preceded by a bullet: `- [ ] `, `* [x] `, `[ ] `. */
const checkboxMarker = /^(\s*)((?:[-*+]\s+)?\[[ xX]\]\s+)/;
/** A plain bullet marker: `- `, `* `, `+ `. */
const bulletMarker = /^(\s*)([-*+]\s+)/;
/** An ordered-list marker: `1. `, `2) `. */
const orderedMarker = /^(\s*)(\d+[.)]\s+)/;

export type LinePrefixKind = 'checkbox' | 'bullet' | 'ordered' | null;

/**
 * Classify the text between the start of the line and the caret. Returns the
 * marker kind only when that text is *nothing but* indentation and a single
 * list marker (optionally followed by spaces) - i.e. the caret is parked at the
 * start of an otherwise empty list item.
 */
export const classifyLinePrefix = (linePrefix: string): LinePrefixKind => {
  if (/^\s*(?:[-*+]\s+)?\[[ xX]\]\s*$/.test(linePrefix)) {
    return 'checkbox';
  }
  if (/^\s*[-*+]\s*$/.test(linePrefix)) {
    return 'bullet';
  }
  if (/^\s*\d+[.)]\s*$/.test(linePrefix)) {
    return 'ordered';
  }
  return null;
};

/**
 * Given the caret's line prefix and the full clipboard text, return the text
 * that should actually be inserted. When no de-duplication applies the original
 * text is returned unchanged (referentially equal), so callers can fall back to
 * a normal paste.
 */
export const dedupePastedMarker = (
  linePrefix: string,
  pastedText: string
): string => {
  const kind = classifyLinePrefix(linePrefix);
  if (!kind || pastedText.length === 0) {
    return pastedText;
  }

  const newlineIndex = pastedText.search(/\r?\n/);
  const firstLine =
    newlineIndex === -1 ? pastedText : pastedText.slice(0, newlineIndex);
  const rest = newlineIndex === -1 ? '' : pastedText.slice(firstLine.length);

  let stripped: string | undefined;

  if (kind === 'checkbox') {
    // A checkbox line swallows a pasted checkbox marker, or a lone bullet.
    if (checkboxMarker.test(firstLine)) {
      stripped = firstLine.replace(checkboxMarker, '');
    } else if (bulletMarker.test(firstLine)) {
      stripped = firstLine.replace(bulletMarker, '');
    }
  } else if (kind === 'bullet') {
    // A bullet line only swallows a leading bullet; a pasted `[ ] ` after `- `
    // legitimately forms `- [ ] ` and must be kept.
    if (bulletMarker.test(firstLine)) {
      stripped = firstLine.replace(bulletMarker, '');
    }
  } else if (kind === 'ordered') {
    if (orderedMarker.test(firstLine)) {
      stripped = firstLine.replace(orderedMarker, '');
    } else if (bulletMarker.test(firstLine)) {
      stripped = firstLine.replace(bulletMarker, '');
    }
  }

  if (stripped === undefined || stripped === firstLine) {
    return pastedText;
  }

  return stripped + rest;
};
