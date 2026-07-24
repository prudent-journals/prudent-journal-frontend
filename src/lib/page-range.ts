/**
 * Parse a human written page selection such as "1-3, 7, 11-14".
 *
 * Returns one based page numbers, de-duplicated and in ascending order, or an
 * explanation of what is wrong with the input. Kept separate from the UI so it
 * can be reasoned about, and tested, on its own.
 */

export interface RangeResult {
  pages: number[];
  error: string | null;
}

export function parsePageRange(input: string, totalPages: number): RangeResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { pages: [], error: 'Enter the pages you want, for example 1-3, 7' };
  }

  const selected = new Set<number>();

  for (const rawPart of trimmed.split(',')) {
    const part = rawPart.trim();
    if (!part) continue;

    // Accepts an en or em dash as well as a hyphen, because people paste
    // ranges out of word processors that substitute them. This is input
    // tolerance only, no dash of that kind is ever displayed by the site.
    const range = part.match(/^(\d+)\s*(?:-|to|\u2013|\u2014)\s*(\d+)$/i);
    if (range) {
      const start = parseInt(range[1], 10);
      const end = parseInt(range[2], 10);

      if (start < 1 || end < 1) {
        return { pages: [], error: 'Page numbers start at 1' };
      }
      if (start > totalPages || end > totalPages) {
        return { pages: [], error: `This document only has ${totalPages} pages` };
      }
      if (start > end) {
        return { pages: [], error: `"${part}" runs backwards, try ${end}-${start}` };
      }
      for (let p = start; p <= end; p++) selected.add(p);
      continue;
    }

    if (/^\d+$/.test(part)) {
      const page = parseInt(part, 10);
      if (page < 1) return { pages: [], error: 'Page numbers start at 1' };
      if (page > totalPages) {
        return { pages: [], error: `This document only has ${totalPages} pages` };
      }
      selected.add(page);
      continue;
    }

    return { pages: [], error: `"${part}" is not a page or a range` };
  }

  if (selected.size === 0) {
    return { pages: [], error: 'No pages selected' };
  }

  return { pages: [...selected].sort((a, b) => a - b), error: null };
}

/** Render a page list back as a compact string, so "1,2,3,7" reads as "1-3, 7". */
export function formatPageRange(pages: number[]): string {
  if (!pages.length) return '';
  const sorted = [...pages].sort((a, b) => a - b);
  const parts: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i <= sorted.length; i++) {
    const current = sorted[i];
    if (current !== prev + 1) {
      parts.push(start === prev ? `${start}` : `${start}-${prev}`);
      start = current;
    }
    prev = current;
  }
  return parts.join(', ');
}
