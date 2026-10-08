/** Browser-only document conversion. Imports are deferred until a visitor converts. */
export async function pdfToWord(file: File): Promise<Uint8Array> {
  const { pdfToText } = await import("./pdf-tools");
  const { Document, Packer, Paragraph } = await import("docx");
  const text = await pdfToText(file);
  if (!text.trim()) throw new Error("This PDF has no selectable text. OCR is not available.");
  const document = new Document({
    sections: [{ children: text.split(/\n/).map((line) => new Paragraph(line)) }],
  });
  return new Uint8Array(await (await Packer.toBlob(document)).arrayBuffer());
}

export async function wordToPdf(file: File): Promise<Uint8Array> {
  if (!/\.docx$/i.test(file.name)) {
    throw new Error("Please save your Word document as .docx before uploading.");
  }
  const mammoth = await import("mammoth/mammoth.browser");
  const { PDFDocument } = await import("pdf-lib");
  const { default: html2canvas } = await import("html2canvas");
  const { default: DOMPurify } = await import("dompurify");
  const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
  const container = document.createElement("div");
  // Treat uploaded document markup as untrusted; disallow external resource loads.
  container.innerHTML = DOMPurify.sanitize(result.value, {
    FORBID_TAGS: ["script", "iframe", "object", "embed", "style", "link", "video", "audio"],
    FORBID_ATTR: ["srcset", "style"],
  });
  for (const image of container.querySelectorAll("img")) {
    if (!/^data:image\/(png|jpeg|gif|webp);base64,/i.test(image.src)) image.remove();
    else image.style.maxWidth = "100%";
  }
  if (!container.textContent?.trim() && !container.querySelector("img")) {
    throw new Error("This Word document is empty or could not be read.");
  }
  container.style.cssText = "width:700px;font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#000;background:#fff;overflow-wrap:anywhere;";
  // Isolate uploaded content from application CSS (including unsupported OKLCH).
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;left:-10000px;top:0;width:740px;height:1000px;border:0;pointer-events:none;";
  document.body.appendChild(frame);
  try {
    const frameDocument = frame.contentDocument;
    if (!frameDocument) throw new Error("The document preview could not be created.");
    frameDocument.body.style.cssText = "margin:0;background:#fff;color:#000;";
    const content = frameDocument.importNode(container, true);
    frameDocument.body.appendChild(content);
    await Promise.all(Array.from(content.querySelectorAll("img")).map((img) => img.decode().catch(() => {})));
    await frameDocument.fonts.ready;
    const canvas = await html2canvas(content, {
      scale: 1.5, windowWidth: 740, backgroundColor: "#ffffff",
      useCORS: false, allowTaint: false, logging: false,
    });
    const pdf = await PDFDocument.create();
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 36;
    const printableWidth = pageWidth - margin * 2;
    const sliceHeight = Math.floor((pageHeight - margin * 2) * canvas.width / printableWidth);
    for (let top = 0; top < canvas.height; top += sliceHeight) {
      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = Math.min(sliceHeight, canvas.height - top);
      const context = slice.getContext("2d");
      if (!context) throw new Error("PDF rendering is unavailable in this browser.");
      context.drawImage(canvas, 0, top, slice.width, slice.height, 0, 0, slice.width, slice.height);
      const image = await pdf.embedPng(slice.toDataURL("image/png"));
      const height = slice.height * printableWidth / slice.width;
      const page = pdf.addPage([pageWidth, pageHeight]);
      page.drawImage(image, { x: margin, y: pageHeight - margin - height, width: printableWidth, height });
    }
    return pdf.save({ useObjectStreams: true });
  } finally {
    frame.remove();
  }
}