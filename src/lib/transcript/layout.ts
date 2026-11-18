// Turns positioned PDF text items into reading-order lines.
// The Stanford unofficial transcript prints two columns per page, so we split each
// page at its midpoint and read the left column top-to-bottom, then the right one.

export interface TextItem {
  str: string;
  x: number; // left edge, in PDF units
  y: number; // baseline, PDF units (larger = higher on the page)
  width: number;
}

export interface PageText {
  width: number;
  items: TextItem[];
}

const LINE_TOLERANCE = 2.5; // items whose baselines differ by less than this share a line

function toLines(items: TextItem[]): string[] {
  const sorted = items.filter((i) => i.str.trim()).sort((a, b) => b.y - a.y || a.x - b.x);
  const lines: TextItem[][] = [];
  for (const item of sorted) {
    const current = lines[lines.length - 1];
    if (current && Math.abs(current[0].y - item.y) < LINE_TOLERANCE) current.push(item);
    else lines.push([item]);
  }
  return lines.map((line) =>
    line
      .sort((a, b) => a.x - b.x)
      .map((i) => i.str.trim())
      .join(" ")
      .replace(/\s+/g, " "),
  );
}

export function pagesToLines(pages: PageText[]): string[] {
  const out: string[] = [];
  for (const page of pages) {
    const mid = page.width / 2;
    out.push(...toLines(page.items.filter((i) => i.x < mid)));
    out.push(...toLines(page.items.filter((i) => i.x >= mid)));
  }
  return out;
}
