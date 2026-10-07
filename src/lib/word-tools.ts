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
  const { jsPDF } = await import("jspdf");
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
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  await pdf.html(container, {
    margin: [36, 36, 36, 36],
    autoPaging: "text",
    width: 523,
    windowWidth: 700,
    html2canvas: { scale: 523 / 700, useCORS: false, allowTaint: false, logging: false },
  });
  return new Uint8Array(pdf.output("arraybuffer"));
}