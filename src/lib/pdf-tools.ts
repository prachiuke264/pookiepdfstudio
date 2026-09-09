import { PDFDocument, PDFName } from "pdf-lib";

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
  level: CompressionLevel,
  targetBytes: number
): Promise<Uint8Array> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, src.getPageIndices());

  for (const page of pages) {
    if (level !== "low") {
      // remove interactive/annotation overhead
      page.node.delete(PDFName.of("Annots"));
    }
    if (level === "high") {
      page.node.delete(PDFName.of("StructParents"));
      page.node.delete(PDFName.of("Metadata"));
    }
    out.addPage(page);
  }

  stripMetadata(out);

  const lossless = await out.save({
    useObjectStreams: true,
    addDefaultPage: false,
    objectsPerTick: 200,
  });

  if (lossless.byteLength <= targetBytes) return lossless;

  // Re-render progressively until the closest practical target is found.
  // PDFs cannot always hit an exact byte count because page objects add fixed
  // overhead, so the closest valid result is returned without padding bytes.
  const ratio = Math.min(1, Math.max(0.02, targetBytes / lossless.byteLength));
  const settings = {
    low: { scale: 1.7, quality: 0.9, scaleStep: 0.1, qualityStep: 0.05 },
    medium: { scale: 1.45, quality: 0.82, scaleStep: 0.14, qualityStep: 0.08 },
    high: { scale: 1.2, quality: 0.72, scaleStep: 0.17, qualityStep: 0.1 },
  }[level];
  const ratioScale = Math.max(0.45, Math.sqrt(ratio));
  let best = lossless;
  let bestDistance = Math.abs(lossless.byteLength - targetBytes);

  try {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const scale = Math.max(
        0.38,
        settings.scale * ratioScale - settings.scaleStep * attempt
      );
      const quality = Math.max(
        0.3,
        settings.quality - settings.qualityStep * attempt
      );
      const raster = await rasterizePdf(file, scale, quality);
      const distance = Math.abs(raster.byteLength - targetBytes);
      if (raster.byteLength < best.byteLength && distance < bestDistance) {
        best = raster;
        bestDistance = distance;
      }
      if (raster.byteLength <= targetBytes && raster.byteLength >= targetBytes * 0.9) {
        break;
      }
    }
    return best;
  } catch {
    return lossless;
  }
}

async function rasterizePdf(file: File, scale: number, quality: number) {
  const pdfjs = await loadPdfjs();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) })
    .promise;
  const out = await PDFDocument.create();
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvas, canvasContext: ctx, viewport } as never).promise;
    const blob: Blob = await new Promise((res) =>
      canvas.toBlob((b) => res(b!), "image/jpeg", quality)
    );
    const img = await out.embedJpg(new Uint8Array(await blob.arrayBuffer()));
    const pdfPage = out.addPage([canvas.width, canvas.height]);
    pdfPage.drawImage(img, { x: 0, y: 0, width: canvas.width, height: canvas.height });
  }
  stripMetadata(out);
  return out.save({ useObjectStreams: true });
}

async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  return pdfjs;
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

export async function pdfToText(file: File): Promise<string> {
  const pdfjs = await loadPdfjs();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) })
    .promise;
  let text = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    text +=
      content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " ") + "\n\n";
  }
  return text.trim();
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
