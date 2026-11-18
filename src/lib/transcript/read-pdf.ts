// Runs in the BROWSER only: reads a transcript PDF locally with pdf.js.
// The file never leaves the student's device; only the parsed course list is sent on Save.
import { pagesToLines, type PageText } from "./layout";
import { parseTranscriptLines, type TranscriptCourse } from "./parse";

export async function readTranscriptPdf(file: File): Promise<TranscriptCourse[]> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  try {
    const doc = await task.promise;
    const pages: PageText[] = [];
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      pages.push({
        width: page.getViewport({ scale: 1 }).width,
        items: content.items.flatMap((i) =>
          "str" in i ? [{ str: i.str, x: i.transform[4], y: i.transform[5], width: i.width }] : [],
        ),
      });
    }
    return parseTranscriptLines(pagesToLines(pages));
  } finally {
    await task.destroy();
  }
}
