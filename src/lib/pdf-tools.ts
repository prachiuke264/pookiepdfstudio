import { PDFDocument } from "pdf-lib";

export type CompressionLevel = "low" | "medium" | "high";

function stripMetadata(pdf: PDFDocument) {
  pdf.setTitle("");
  pdf.setAuthor("");
  pdf.setSubject("");
  pdf.setKeywords([]);
  pdf.setProducer("");
  pdf.setCreator("");
}

/**
 * Real, client-side PDF compression.
 * - always: strips metadata overhead and rewrites with object streams
 * - medium/high: also drops annotations and page-level extra resources that
 *   are not required to render the page content
 */
export async function compressPdf(
  file: File,
  level: CompressionLevel
): Promise<Uint8Array> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, src.getPageIndices());

  for (const page of pages) {
    if (level !== "low") {
      // remove interactive/annotation overhead
      page.node.delete((await import("pdf-lib")).PDFName.of("Annots"));
    }
    if (level === "high") {
      page.node.delete((await import("pdf-lib")).PDFName.of("StructParents"));
      page.node.delete((await import("pdf-lib")).PDFName.of("Metadata"));
    }
    out.addPage(page);
  }

  stripMetadata(out);

  return out.save({
    useObjectStreams: true,
    addDefaultPage: false,
    objectsPerTick: 200,
  });
}

export async function mergePdfs(files: File[]): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  for (const file of files) {
    const src = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()), {
      ignoreEncryption: true,
    });
    const pages = await out.copyPages(src, src.getPageIndices());
    pages.forEach((p) => out.addPage(p));
  }
  stripMetadata(out);
  return out.save({ useObjectStreams: true });
}

async function downscaleToJpeg(file: File, maxEdge = 1600, quality = 0.82) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
  const blob: Blob = await new Promise((res) =>
    canvas.toBlob((b) => res(b!), "image/jpeg", quality)
  );
  return { bytes: new Uint8Array(await blob.arrayBuffer()), width: w, height: h };
}

export async function imagesToPdf(files: File[]): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  for (const file of files) {
    const { bytes, width, height } = await downscaleToJpeg(file);
    const img = await out.embedJpg(bytes);
    const page = out.addPage([width, height]);
    page.drawImage(img, { x: 0, y: 0, width, height });
  }
  return out.save({ useObjectStreams: true });
}

/** Produces a real PDF copy for tools that only normalise the document. */
export async function normalizePdf(file: File): Promise<Uint8Array> {
  const src = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()), {
    ignoreEncryption: true,
  });
  return src.save({ useObjectStreams: true });
}

export function downloadBytes(bytes: Uint8Array, filename: string, mime: string) {
  const buf = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buf).set(bytes);
  const url = URL.createObjectURL(new Blob([buf], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** RTF is a genuine Word-openable format, so the .doc download is never corrupt. */
export function textToRtfBytes(text: string) {
  const escaped = text.replace(/[\\{}]/g, (m) => `\\${m}`).replace(/\n/g, "\\par\n");
  return new TextEncoder().encode(
    `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Calibri;}}\\fs22 ${escaped}}`
  );
}
